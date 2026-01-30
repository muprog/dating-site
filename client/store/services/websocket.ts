import { io, Socket } from 'socket.io-client'
import { store } from '../store'
import {
  newMessageReceived,
  setTypingIndicator,
  setOnlineStatus,
  setOnlineStatusBatch,
  replaceOptimisticMessage,
  editMessageSuccess,
  getUnreadTotalSuccess,
  incrementTotalUnread,
  decrementTotalUnread,
} from '../slices/messageSlice'
class WebSocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Function[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private connectionCallbacks: ((connected: boolean) => void)[] = []
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    this.setupEventListeners()
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (this.socket?.connected) {
          console.log('✅ WebSocket already connected')
          resolve(true)
          return
        }

        const token = this.getToken()
        const serverUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

        console.log('🔌 Connecting to WebSocket...', { serverUrl })

        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling'],
          auth: { token },
          query: { token },
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
          forceNew: true,
        })

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected successfully:', {
            socketId: this.socket?.id,
            connected: this.socket?.connected,
          })
          this.reconnectAttempts = 0
          this.notifyConnectionChange(true)
          this.startHeartbeat()
          resolve(true)
        })

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error.message)
          this.notifyConnectionChange(false)
          this.reconnectAttempts++

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('⚠️ Max reconnection attempts reached')
            this.socket?.disconnect()
          }

          resolve(false)
        })

        this.socket.on('disconnect', (reason) => {
          console.log('❌ WebSocket disconnected:', reason)
          this.notifyConnectionChange(false)
          this.stopHeartbeat()

          if (reason === 'io server disconnect') {
            setTimeout(() => {
              if (!this.socket?.connected) {
                this.connect()
              }
            }, 1000)
          }
        })

        // Setup event listeners
        this.setupSocketListeners()
      } catch (error) {
        console.error('❌ WebSocket connection error:', error)
        resolve(false)
      }
    })
  }

  private getToken(): string {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      const tokenCookie = cookies.find((c) => c.trim().startsWith('token='))
      return tokenCookie ? tokenCookie.split('=')[1] : ''
    }
    return ''
  }

  private setupSocketListeners() {
    if (!this.socket) return
    this.socket.on('unread-update', (data: any) => {
      console.log('📊 WebSocket: Received unread update:', data)

      // Update total unread count in Redux
      store.dispatch(
        getUnreadTotalSuccess({
          totalUnread: data.totalUnread || 0,
          matchesWithUnread: data.matchesWithUnread || [],
        })
      )

      // Also increment/decrement as needed based on action
      if (data.action === 'increment') {
        store.dispatch(incrementTotalUnread())
      } else if (data.action === 'decrement' && data.count) {
        store.dispatch(decrementTotalUnread(data.count))
      }

      this.triggerEvent('unread-update', data)
    })
    this.socket.on('message-edited', this.messageEditedHandler)
    // Listen for new messages
    this.socket.on('new-message', (message: any) => {
      console.log('📩 WebSocket: Received new message:', {
        id: message._id,
        tempId: message.tempId,
        matchId: message.matchId,
        sender: message.sender,
      })

      // If this is a real message replacing an optimistic one
      if (message.tempId) {
        console.log(
          '🔄 Replacing optimistic message with tempId:',
          message.tempId
        )
        store.dispatch(
          replaceOptimisticMessage({
            tempId: message.tempId,
            realMessage: message,
          })
        )
      } else {
        store.dispatch(newMessageReceived(message))
      }

      this.triggerEvent('new-message', message)
    })

    // Listen for typing indicators
    this.socket.on('user-typing', (data: any) => {
      console.log('✍️ WebSocket: User typing:', data)
      store.dispatch(
        setTypingIndicator({
          userId: data.userId,
          matchId: data.matchId,
          isTyping: data.isTyping,
          name: data.name,
          user: data.user,
          timestamp: data.timestamp || new Date().toISOString(),
        })
      )
      this.triggerEvent('user-typing', data)
    })

    // Listen for online status updates
    this.socket.on('user-status', (data: any) => {
      console.log('📡 WebSocket: User status changed:', data)
      store.dispatch(
        setOnlineStatus({
          userId: data.userId,
          isOnline: data.status === 'online',
          lastSeen: data.lastSeen,
          user: data.user,
        })
      )
      this.triggerEvent('user-status', data)
    })

    // Listen for online status batch
    this.socket.on('online-status-batch', (statuses: any) => {
      console.log(
        '👥 WebSocket: Received batch status for',
        Object.keys(statuses).length,
        'users'
      )
      store.dispatch(setOnlineStatusBatch(statuses))
      this.triggerEvent('online-status-batch', statuses)
    })

    // Listen for online users list
    this.socket.on('online-users', (userIds: string[]) => {
      console.log('👥 WebSocket: Online users:', userIds.length)
      this.triggerEvent('online-users', userIds)

      if (userIds.length > 0) {
        this.checkOnlineStatusBatch(userIds)
      }
    })

    // Listen for room joined confirmation
    this.socket.on('room-joined', (data: any) => {
      console.log('🚪 WebSocket: Room joined:', data.room)
      this.triggerEvent('room-joined', data)
    })

    // Listen for message sent confirmation
    this.socket.on('message-sent', (data: any) => {
      console.log('✅ WebSocket: Message sent confirmation:', data.tempId)
      this.triggerEvent('message-sent', data)
    })

    // Listen for message error
    this.socket.on('message-error', (error: any) => {
      console.error('❌ WebSocket: Message error:', error)
      this.triggerEvent('message-error', error)
    })

    // Listen for messages read
    this.socket.on('messages-read', (data: any) => {
      console.log('📖 WebSocket: Messages read:', data.messageIds.length)
      this.triggerEvent('messages-read', data)
    })

    // Listen for welcome
    this.socket.on('welcome', (data: any) => {
      console.log('👋 WebSocket:', data.message)
      this.triggerEvent('welcome', data)
    })
  }

  // SIMPLIFIED: Just send typing events, backend handles everything
  sendTypingIndicator(matchId: string, isTyping: boolean): boolean {
    if (!this.socket?.connected) {
      console.log('⚠️ WebSocket not connected, cannot send typing indicator')
      return false
    }

    try {
      console.log(
        `✍️ Sending typing indicator: ${
          isTyping ? 'started' : 'stopped'
        } for match ${matchId}`
      )

      // Just emit the event, backend handles state management
      this.socket.emit('typing', { matchId, isTyping })
      return true
    } catch (error) {
      console.error('❌ Error sending typing indicator:', error)
      return false
    }
  }

  // Online status methods
  checkOnlineStatus(userId: string): boolean {
    if (!this.socket?.connected) {
      console.log('⚠️ WebSocket not connected, cannot check online status')
      return false
    }

    this.socket.emit('check-online', userId)
    return true
  }

  checkOnlineStatusBatch(userIds: string[]): boolean {
    if (!this.socket?.connected) {
      console.log(
        '⚠️ WebSocket not connected, cannot check online status batch'
      )
      return false
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return false
    }

    console.log('👥 Checking online status for batch:', userIds.length, 'users')
    this.socket.emit('check-online-batch', userIds)
    return true
  }

  // Match room methods
  joinMatch(matchId: string): boolean {
    if (!this.socket?.connected) {
      console.log('⚠️ WebSocket not connected, cannot join match')
      return false
    }

    try {
      this.socket.emit('join-match', matchId)
      console.log(`🚪 Joining match room: ${matchId}`)
      return true
    } catch (error) {
      console.error('❌ Error joining match room:', error)
      return false
    }
  }

  leaveMatch(matchId: string): boolean {
    if (!this.socket?.connected) {
      console.log('⚠️ WebSocket not connected, cannot leave match')
      return false
    }

    try {
      this.socket.emit('leave-match', matchId)
      console.log(`🚪 Leaving match room: ${matchId}`)
      return true
    } catch (error) {
      console.error('❌ Error leaving match room:', error)
      return false
    }
  }

  // Message sending
  async sendMessage(
    matchId: string,
    content: string,
    tempId?: string
  ): Promise<boolean> {
    if (!this.socket?.connected) {
      console.error('❌ WebSocket not connected')
      return false
    }

    return new Promise((resolve) => {
      try {
        const messageData = { matchId, content, tempId }
        console.log('📤 Sending message via WebSocket:', {
          matchId,
          tempId,
          contentLength: content.length,
        })
        this.socket?.emit('send-message', messageData)

        // Set up confirmation listener
        const onMessageSent = (data: any) => {
          console.log('✅ WebSocket message sent confirmation:', data)
          if (data.success) {
            resolve(true)
          } else {
            resolve(false)
          }
          // Clean up listeners
          this.socket?.off('message-sent', onMessageSent)
          this.socket?.off('message-error', onMessageError)
          webSocketService.off('message-edited', this.messageEditedHandler)
        }

        const onMessageError = (error: any) => {
          console.error('❌ WebSocket message send error:', error)
          resolve(false)
          // Clean up listeners
          this.socket?.off('message-sent', onMessageSent)
          this.socket?.off('message-error', onMessageError)
          webSocketService.off('message-edited', this.messageEditedHandler)
        }

        this.socket?.on('message-sent', onMessageSent)
        this.socket?.on('message-error', onMessageError)
        webSocketService.off('message-edited', this.messageEditedHandler)

        // Timeout after 5 seconds
        setTimeout(() => {
          this.socket?.off('message-sent', onMessageSent)
          this.socket?.off('message-error', onMessageError)
          console.log('⏰ Message send timeout')
          resolve(false)
        }, 5000)
      } catch (error) {
        console.error('❌ Error sending message:', error)
        resolve(false)
      }
    })
  }

  // Mark messages as read
  markMessagesAsRead(matchId: string, messageIds: string[]): boolean {
    if (
      !this.socket?.connected ||
      !Array.isArray(messageIds) ||
      messageIds.length === 0
    ) {
      return false
    }

    try {
      this.socket.emit('mark-read', { matchId, messageIds })
      return true
    } catch (error) {
      console.error('❌ Error marking messages as read:', error)
      return false
    }
  }

  // Heartbeat for connection monitoring
  private startHeartbeat() {
    this.stopHeartbeat()

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat')
      } else {
        this.stopHeartbeat()
      }
    }, 30000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)?.push(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private triggerEvent(event: string, data: any) {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in ${event} callback:`, error)
      }
    })
  }

  // Connection status
  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback)
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionCallbacks.forEach((callback) => {
      try {
        callback(connected)
      } catch (error) {
        console.error('Error in connection change callback:', error)
      }
    })
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getSocket(): Socket | null {
    return this.socket
  }

  sendMessageEdit(
    messageId: string,
    matchId: string,
    content: string
  ): boolean {
    if (!this.socket?.connected) {
      console.log('⚠️ WebSocket not connected, cannot edit message')
      return false
    }

    try {
      console.log(
        `✏️ Sending message edit: messageId=${messageId}, matchId=${matchId}`
      )

      this.socket.emit('edit-message', {
        messageId,
        matchId,
        content,
      })
      return true
    } catch (error) {
      console.error('❌ Error sending message edit:', error)
      return false
    }
  }

  // Add this event listener setup
  messageEditedHandler = (data: any) => {
    console.log('✏️ WebSocket: Message edited:', {
      messageId: data.messageId,
      matchId: data.matchId,
      content: data.content,
    })

    // You need to import editMessageSuccess from your slice
    store.dispatch(
      editMessageSuccess({
        messageId: data.messageId,
        matchId: data.matchId,
        content: data.content,
        updatedAt: data.updatedAt,
      })
    )

    this.triggerEvent('message-edited', data)
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.notifyConnectionChange(false)
      this.stopHeartbeat()
    }
  }

  private setupEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        if (!this.isConnected()) {
          console.log('🔄 Window focused, attempting to reconnect...')
          this.connect()
        }
      })

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.isConnected()) {
          console.log('🔄 Page visible, attempting to reconnect...')
          this.connect()
        }
      })
    }
  }
}

export const webSocketService = new WebSocketService()
