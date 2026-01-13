// // services/websocket.ts - COMPLETELY FIXED VERSION
// import { io, Socket } from 'socket.io-client'
// import { Message } from '../../types/messaging'
// import { store } from '../store'
// import { newMessageReceived } from '../slices/messageSlice'
// import { logDebugInfo } from '../../utils/debugUtils'

// class WebSocketService {
//   private socket: Socket | null = null
//   private reconnectAttempts = 0
//   private maxReconnectAttempts = 5
//   private messageQueue: Array<{ matchId: string; content: string }> = []
//   private isConnecting = false
//   private connectionListeners: Array<(connected: boolean) => void> = []
//   private onUserStatusCallbacks: Array<{
//     userId: string
//     callback: (status: 'online' | 'offline') => void
//   }> = []
//   private onTypingCallbacks: Array<
//     (data: { matchId: string; userId: string; isTyping: boolean }) => void
//   > = []
//   private onReadReceiptCallbacks: Array<
//     (data: { matchId: string; userId: string; messageIds: string[] }) => void
//   > = []
//   // Event listeners
//   private onNewMessageCallbacks: ((message: Message) => void)[] = []

//   // Get token from multiple sources
//   private getToken(): string | null {
//     if (typeof window === 'undefined') return null

//     try {
//       // 1. Try cookies first
//       const cookies = document.cookie.split(';')
//       const tokenCookie = cookies.find((c) => c.trim().startsWith('token='))
//       if (tokenCookie) {
//         const token = tokenCookie.split('=')[1]
//         if (token && token !== 'undefined' && token !== 'null') {
//           console.log('🔑 Found token in cookies')
//           return token
//         }
//       }

//       // 2. Try localStorage as fallback
//       const localStorageToken = localStorage.getItem('token')
//       if (
//         localStorageToken &&
//         localStorageToken !== 'undefined' &&
//         localStorageToken !== 'null'
//       ) {
//         console.log('🔑 Found token in localStorage')
//         return localStorageToken
//       }

//       // 3. Try Redux store
//       const state = store.getState()
//       const userToken = state.auth.user?.token
//       if (userToken) {
//         console.log('🔑 Found token in Redux store')
//         return userToken
//       }

//       console.warn('⚠️ No token found in any storage')
//       return null
//     } catch (error) {
//       console.error('❌ Error getting token:', error)
//       return null
//     }
//   }

//   async connect(): Promise<boolean> {
//     // Log debug info
//     logDebugInfo()

//     if (this.socket?.connected) {
//       console.log('🔌 WebSocket already connected')
//       return true
//     }

//     if (this.isConnecting) {
//       console.log('🔌 WebSocket connection in progress...')
//       return new Promise((resolve) => {
//         const checkInterval = setInterval(() => {
//           if (this.socket?.connected) {
//             clearInterval(checkInterval)
//             resolve(true)
//           }
//           if (!this.isConnecting) {
//             clearInterval(checkInterval)
//             resolve(false)
//           }
//         }, 100)
//       })
//     }

//     this.isConnecting = true
//     console.log('🔌 Starting WebSocket connection...')

//     const token = this.getToken()
//     console.log('🔑 Token status:', token ? 'Available' : 'Missing')

//     // Use the same URL as your API
//     const wsUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
//     console.log('🔌 Connecting to WebSocket server:', wsUrl)

//     // FIXED: Simplified socket options
//     const socketOptions: any = {
//       transports: ['websocket'], // Use ONLY websocket, no polling
//       reconnection: true,
//       reconnectionAttempts: 3,
//       reconnectionDelay: 1000,
//       timeout: 10000,
//       autoConnect: true,
//       forceNew: true,
//       withCredentials: true,
//       auth: token ? { token } : undefined,
//       query: token ? { token } : undefined,
//     }

//     try {
//       console.log('🔌 Creating socket with options:', {
//         ...socketOptions,
//         auth: token ? { token: '***' } : 'none',
//         query: token ? { token: '***' } : 'none',
//       })

//       this.socket = io(wsUrl, socketOptions)
//       this.setupEventListeners()

//       return new Promise((resolve) => {
//         const connectionTimeout = setTimeout(() => {
//           console.warn('⚠️ WebSocket connection timeout')
//           this.isConnecting = false
//           resolve(false)
//         }, 10000)

//         this.socket!.on('connect', () => {
//           clearTimeout(connectionTimeout)
//           this.isConnecting = false
//           this.reconnectAttempts = 0
//           console.log('✅ WebSocket CONNECTED successfully!', {
//             socketId: this.socket?.id,
//             transport: this.socket?.io?.engine?.transport?.name,
//           })

//           // Notify connection listeners
//           this.connectionListeners.forEach((listener) => listener(true))

//           // Process queued messages
//           this.processMessageQueue()

//           // Join current match if exists
//           const state = store.getState()
//           const currentMatch = state.messages.currentMatch
//           if (currentMatch) {
//             console.log(`🚪 Auto-joining match room: ${currentMatch._id}`)
//             this.joinMatch(currentMatch._id)
//           }

//           resolve(true)
//         })

//         this.socket!.on('connect_error', (error: any) => {
//           console.error('❌ WebSocket CONNECTION ERROR:', {
//             message: error.message,
//             description: error.description,
//             type: error.type,
//             context: error.context,
//           })

//           this.isConnecting = false
//           clearTimeout(connectionTimeout)

//           // Try reconnection
//           this.reconnectAttempts++
//           if (this.reconnectAttempts < this.maxReconnectAttempts) {
//             console.log(
//               `🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
//             )
//             setTimeout(() => {
//               if (this.socket && !this.socket.connected) {
//                 this.socket.connect()
//               }
//             }, 2000)
//           } else {
//             console.warn('⚠️ Max reconnection attempts reached')
//             resolve(false)
//           }
//         })
//       })
//     } catch (error: any) {
//       console.error('❌ CRITICAL: Failed to create socket:', error)
//       this.isConnecting = false
//       this.socket = null
//       return false
//     }
//   }

//   private setupEventListeners() {
//     if (!this.socket) return

//     // Remove all existing listeners first
//     this.socket.removeAllListeners()

//     // Basic connection events
//     this.socket.on('disconnect', (reason) => {
//       console.log('🔌 WebSocket disconnected:', reason)
//       this.connectionListeners.forEach((listener) => listener(false))

//       if (reason === 'io server disconnect') {
//         // Server disconnected, try to reconnect
//         setTimeout(() => {
//           if (this.socket && !this.socket.connected) {
//             console.log('🔄 Attempting to reconnect after server disconnect...')
//             this.socket.connect()
//           }
//         }, 1000)
//       }
//     })

//     // Application events
//     this.socket.on('new-message', (message: Message) => {
//       console.log('📩 WebSocket: Received new-message:', {
//         messageId: message._id,
//         matchId: message.matchId,
//         sender: message.sender,
//         content: message.content.substring(0, 30) + '...',
//       })

//       // Dispatch to Redux
//       store.dispatch(newMessageReceived(message))

//       // Notify callbacks
//       this.onNewMessageCallbacks.forEach((callback) => callback(message))
//     })

//     this.socket.on('welcome', (data) => {
//       console.log('👋 WebSocket welcome:', data)
//     })

//     this.socket.on('joined-room', (data) => {
//       console.log('🚪 Joined room:', data)
//     })

//     this.socket.on('message-sent', (data) => {
//       console.log('✅ Message sent confirmation:', data)
//     })

//     this.socket.on('error', (error) => {
//       console.error('❌ Socket error:', error)
//     })

//     // Debug: Log all events
//     this.socket.onAny((event, ...args) => {
//       if (!['ping', 'pong'].includes(event)) {
//         console.log(`🔵 [WS Event: ${event}]`, args.length > 0 ? args[0] : '')
//       }
//     })
//     this.socket.on('user-online', (userId: string) => {
//       console.log(`🟢 User ${userId} is online`)
//       this.onUserStatusCallbacks.forEach((item) => {
//         if (item.userId === userId) {
//           item.callback('online')
//         }
//       })
//     })

//     this.socket.on('user-offline', (userId: string) => {
//       console.log(`🔴 User ${userId} is offline`)
//       this.onUserStatusCallbacks.forEach((item) => {
//         if (item.userId === userId) {
//           item.callback('offline')
//         }
//       })
//     })

//     // Typing indicator
//     // this.socket.on(
//     //   'user-typing',
//     //   (data: { matchId: string; userId: string; isTyping: boolean }) => {
//     //     console.log(`✍️ User ${userId} typing: ${data.isTyping}`)
//     //     this.onTypingCallbacks.forEach((callback) => callback(data))
//     //   }
//     // )
//     this.socket.on(
//       'user-typing',
//       (data: { matchId: string; userId: string; isTyping: boolean }) => {
//         console.log(`✍️ User ${data.userId} typing: ${data.isTyping}`) // Fixed: data.userId
//         this.onTypingCallbacks.forEach((callback) => callback(data))
//       }
//     )
//     // Read receipts
//     // this.socket.on(
//     //   'messages-read',
//     //   (data: { matchId: string; userId: string; messageIds: string[] }) => {
//     //     console.log(`✓✓ Messages read by ${userId}:`, data.messageIds)
//     //     this.onReadReceiptCallbacks.forEach((callback) => callback(data))
//     //   }
//     // )
//     this.socket.on(
//       'messages-read',
//       (data: { matchId: string; userId: string; messageIds: string[] }) => {
//         console.log(`✓✓ Messages read by ${data.userId}:`, data.messageIds) // Fixed: data.userId
//         this.onReadReceiptCallbacks.forEach((callback) => callback(data))
//       }
//     )
//   }

//   private processMessageQueue() {
//     if (this.messageQueue.length > 0) {
//       console.log(`📤 Processing ${this.messageQueue.length} queued messages`)
//       const queueCopy = [...this.messageQueue]
//       this.messageQueue = []

//       queueCopy.forEach(({ matchId, content }) => {
//         this.sendMessageInternal(matchId, content)
//       })
//     }
//   }

//   private sendMessageInternal(matchId: string, content: string) {
//     if (this.socket?.connected) {
//       console.log(
//         `📤 Sending WebSocket message to match ${matchId}:`,
//         content.substring(0, 30) + '...'
//       )
//       this.socket.emit('send-message', { matchId, content })
//     } else {
//       console.warn('⚠️ Cannot send WebSocket message: socket not connected')
//       // Queue for later
//       this.messageQueue.push({ matchId, content })
//     }
//   }

//   // Public API
//   onConnectionChange(callback: (connected: boolean) => void) {
//     this.connectionListeners.push(callback)
//     return () => {
//       const index = this.connectionListeners.indexOf(callback)
//       if (index > -1) this.connectionListeners.splice(index, 1)
//     }
//   }

//   onNewMessage(callback: (message: Message) => void) {
//     this.onNewMessageCallbacks.push(callback)
//     return () => {
//       const index = this.onNewMessageCallbacks.indexOf(callback)
//       if (index > -1) this.onNewMessageCallbacks.splice(index, 1)
//     }
//   }

//   joinMatch(matchId: string) {
//     if (this.socket?.connected) {
//       console.log(`🚪 Joining match room: ${matchId}`)
//       this.socket.emit('join-match', matchId)
//     } else {
//       console.warn('⚠️ Cannot join match: socket not connected, queuing...')
//       // Connect first, then join
//       this.connect().then((connected) => {
//         if (connected) {
//           console.log(`🚪 Joining match room after connection: ${matchId}`)
//           this.socket!.emit('join-match', matchId)
//         }
//       })
//     }
//   }

//   leaveMatch(matchId: string) {
//     if (this.socket?.connected) {
//       console.log(`🚪 Leaving match room: ${matchId}`)
//       this.socket.emit('leave-match', matchId)
//     }
//   }

//   async sendMessage(matchId: string, content: string): Promise<boolean> {
//     console.log(`📤 Attempting to send message to match ${matchId}`)

//     // Ensure we're connected
//     if (!this.isConnected()) {
//       console.log('🔌 Not connected, attempting to connect...')
//       const connected = await this.connect()
//       if (!connected) {
//         console.error('❌ Failed to connect, cannot send message')
//         return false
//       }
//     }

//     // Send message
//     this.sendMessageInternal(matchId, content)
//     return true
//   }

//   disconnect() {
//     if (this.socket) {
//       console.log('🔌 Disconnecting WebSocket...')
//       this.socket.disconnect()
//       this.socket = null
//       this.isConnecting = false
//       this.messageQueue = []
//       this.onNewMessageCallbacks = []
//       this.connectionListeners = []
//     }
//   }

//   isConnected(): boolean {
//     return this.socket?.connected || false
//   }

//   getSocket(): Socket | null {
//     return this.socket
//   }

//   getConnectionStatus() {
//     return {
//       connected: this.isConnected(),
//       connecting: this.isConnecting,
//       socketId: this.socket?.id,
//       transport: this.socket?.io?.engine?.transport?.name,
//       reconnectAttempts: this.reconnectAttempts,
//     }
//   }
//   onUserStatus(
//     userId: string,
//     callback: (status: 'online' | 'offline') => void
//   ) {
//     this.onUserStatusCallbacks.push({ userId, callback })
//     return () => {
//       const index = this.onUserStatusCallbacks.findIndex(
//         (item) => item.userId === userId && item.callback === callback
//       )
//       if (index > -1) this.onUserStatusCallbacks.splice(index, 1)
//     }
//   }

//   onTyping(
//     callback: (data: {
//       matchId: string
//       userId: string
//       isTyping: boolean
//     }) => void
//   ) {
//     this.onTypingCallbacks.push(callback)
//     return () => {
//       const index = this.onTypingCallbacks.indexOf(callback)
//       if (index > -1) this.onTypingCallbacks.splice(index, 1)
//     }
//   }

//   onReadReceipt(
//     callback: (data: {
//       matchId: string
//       userId: string
//       messageIds: string[]
//     }) => void
//   ) {
//     this.onReadReceiptCallbacks.push(callback)
//     return () => {
//       const index = this.onReadReceiptCallbacks.indexOf(callback)
//       if (index > -1) this.onReadReceiptCallbacks.splice(index, 1)
//     }
//   }

//   // Add methods to emit events:
//   sendTypingIndicator(matchId: string, isTyping: boolean) {
//     if (this.socket?.connected) {
//       this.socket.emit('typing', { matchId, isTyping })
//     }
//   }

//   sendReadReceipt(matchId: string, messageIds: string[]) {
//     if (this.socket?.connected) {
//       this.socket.emit('mark-read', { matchId, messageIds })
//     }
//   }

//   // Track online users
//   private onlineUsers = new Set<string>()

//   getOnlineStatus(userId: string): boolean {
//     return this.onlineUsers.has(userId)
//   }
// }

// export const webSocketService = new WebSocketService()

// import { io, Socket } from 'socket.io-client'
// import { store } from '../store'
// import {
//   newMessageReceived,
//   setTypingIndicator,
//   setOnlineStatus,
//   setOnlineStatusBatch,
//   replaceOptimisticMessage,
// } from '../slices/messageSlice'

// class WebSocketService {
//   private socket: Socket | null = null
//   private listeners: Map<string, Function[]> = new Map()
//   private reconnectAttempts = 0
//   private maxReconnectAttempts = 5
//   private connectionCallbacks: ((connected: boolean) => void)[] = []
//   private typingTimeouts = new Map<string, NodeJS.Timeout>()
//   private heartbeatInterval: NodeJS.Timeout | null = null

//   constructor() {
//     this.setupEventListeners()
//   }

//   async connect(): Promise<boolean> {
//     return new Promise((resolve) => {
//       try {
//         if (this.socket?.connected) {
//           console.log('✅ WebSocket already connected')
//           resolve(true)
//           return
//         }

//         const token = this.getToken()
//         const serverUrl =
//           process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

//         console.log('🔌 Connecting to WebSocket...', { serverUrl })

//         this.socket = io(serverUrl, {
//           transports: ['websocket', 'polling'],
//           auth: { token },
//           query: { token },
//           reconnection: true,
//           reconnectionAttempts: this.maxReconnectAttempts,
//           reconnectionDelay: 1000,
//           reconnectionDelayMax: 5000,
//           timeout: 10000,
//           forceNew: true,
//         })

//         this.socket.on('connect', () => {
//           console.log('✅ WebSocket connected successfully:', {
//             socketId: this.socket?.id,
//             connected: this.socket?.connected,
//           })
//           this.reconnectAttempts = 0
//           this.notifyConnectionChange(true)
//           this.startHeartbeat()
//           resolve(true)
//         })

//         this.socket.on('connect_error', (error) => {
//           console.error('❌ WebSocket connection error:', error.message)
//           this.notifyConnectionChange(false)
//           this.reconnectAttempts++

//           if (this.reconnectAttempts >= this.maxReconnectAttempts) {
//             console.log('⚠️ Max reconnection attempts reached')
//             this.socket?.disconnect()
//           }

//           resolve(false)
//         })

//         this.socket.on('disconnect', (reason) => {
//           console.log('❌ WebSocket disconnected:', reason)
//           this.notifyConnectionChange(false)
//           this.stopHeartbeat()

//           if (reason === 'io server disconnect') {
//             // Server initiated disconnect, try to reconnect
//             setTimeout(() => {
//               if (!this.socket?.connected) {
//                 this.connect()
//               }
//             }, 1000)
//           }
//         })

//         // Setup event listeners
//         this.setupSocketListeners()
//       } catch (error) {
//         console.error('❌ WebSocket connection error:', error)
//         resolve(false)
//       }
//     })
//   }

//   private getToken(): string {
//     if (typeof document !== 'undefined') {
//       const cookies = document.cookie.split(';')
//       const tokenCookie = cookies.find((c) => c.trim().startsWith('token='))
//       return tokenCookie ? tokenCookie.split('=')[1] : ''
//     }
//     return ''
//   }

//   private setupSocketListeners() {
//     if (!this.socket) return

//     // Listen for new messages
//     this.socket.on('new-message', (message: any) => {
//       console.log('📩 WebSocket: Received new message:', {
//         id: message._id,
//         tempId: message.tempId,
//         matchId: message.matchId,
//         sender: message.sender,
//       })

//       // If this is a real message replacing an optimistic one
//       if (message.tempId) {
//         store.dispatch(
//           replaceOptimisticMessage({
//             tempId: message.tempId,
//             realMessage: message,
//           })
//         )
//       } else {
//         store.dispatch(newMessageReceived(message))
//       }

//       this.triggerEvent('new-message', message)
//     })

//     // Listen for typing indicators
//     this.socket.on('user-typing', (data: any) => {
//       console.log('✍️ WebSocket: User typing:', data)
//       store.dispatch(
//         setTypingIndicator({
//           userId: data.userId,
//           matchId: data.matchId,
//           isTyping: data.isTyping,
//           name: data.name,
//           user: data.user,
//           timestamp: data.timestamp,
//         })
//       )
//       this.triggerEvent('user-typing', data)
//     })

//     // Listen for online status updates
//     this.socket.on('user-status', (data: any) => {
//       console.log('📡 WebSocket: User status changed:', data)
//       store.dispatch(
//         setOnlineStatus({
//           userId: data.userId,
//           isOnline: data.status === 'online',
//           lastSeen: data.lastSeen,
//           user: data.user,
//         })
//       )
//       this.triggerEvent('user-status', data)
//     })

//     // Listen for online status batch
//     this.socket.on('online-status-batch', (statuses: any) => {
//       store.dispatch(setOnlineStatusBatch(statuses))
//       this.triggerEvent('online-status-batch', statuses)
//     })

//     // Listen for online users list
//     this.socket.on('online-users', (userIds: string[]) => {
//       console.log('👥 WebSocket: Online users:', userIds.length)
//       this.triggerEvent('online-users', userIds)

//       // Request batch status for these users
//       if (userIds.length > 0) {
//         this.checkOnlineStatusBatch(userIds)
//       }
//     })

//     // Listen for room joined confirmation
//     this.socket.on('room-joined', (data: any) => {
//       console.log('🚪 WebSocket: Room joined:', data.room)
//       this.triggerEvent('room-joined', data)
//     })

//     // Listen for message sent confirmation
//     this.socket.on('message-sent', (data: any) => {
//       console.log('✅ WebSocket: Message sent confirmation:', data.tempId)
//       this.triggerEvent('message-sent', data)
//     })

//     // Listen for message error
//     this.socket.on('message-error', (error: any) => {
//       console.error('❌ WebSocket: Message error:', error)
//       this.triggerEvent('message-error', error)
//     })

//     // Listen for messages read
//     this.socket.on('messages-read', (data: any) => {
//       console.log('📖 WebSocket: Messages read:', data.messageIds.length)
//       this.triggerEvent('messages-read', data)
//     })

//     // Listen for welcome
//     this.socket.on('welcome', (data: any) => {
//       console.log('👋 WebSocket:', data.message)
//       this.triggerEvent('welcome', data)
//     })
//   }

//   // Typing indicator methods
//   sendTypingIndicator(matchId: string, isTyping: boolean): boolean {
//     if (!this.socket?.connected) {
//       console.log('⚠️ WebSocket not connected, cannot send typing indicator')
//       return false
//     }

//     try {
//       this.socket.emit('typing', { matchId, isTyping })
//       console.log(
//         `✍️ Sent typing indicator: ${isTyping ? 'started' : 'stopped'}`
//       )

//       // Clear previous timeout if exists
//       if (this.typingTimeouts.has(matchId)) {
//         clearTimeout(this.typingTimeouts.get(matchId)!)
//       }

//       // Set timeout to auto-send "stopped typing" after 2 seconds
//       if (isTyping) {
//         const timeout = setTimeout(() => {
//           this.sendTypingIndicator(matchId, false)
//         }, 2000)
//         this.typingTimeouts.set(matchId, timeout)
//       } else {
//         this.typingTimeouts.delete(matchId)
//       }

//       return true
//     } catch (error) {
//       console.error('❌ Error sending typing indicator:', error)
//       return false
//     }
//   }

//   // Online status methods
//   checkOnlineStatus(userId: string): boolean {
//     if (!this.socket?.connected) {
//       console.log('⚠️ WebSocket not connected, cannot check online status')
//       return false
//     }

//     this.socket.emit('check-online', userId)
//     return true
//   }

//   checkOnlineStatusBatch(userIds: string[]): boolean {
//     if (!this.socket?.connected) {
//       console.log(
//         '⚠️ WebSocket not connected, cannot check online status batch'
//       )
//       return false
//     }

//     if (!Array.isArray(userIds) || userIds.length === 0) {
//       return false
//     }

//     this.socket.emit('check-online-batch', userIds)
//     return true
//   }

//   // Match room methods
//   joinMatch(matchId: string): boolean {
//     if (!this.socket?.connected) {
//       console.log('⚠️ WebSocket not connected, cannot join match')
//       return false
//     }

//     try {
//       this.socket.emit('join-match', matchId)
//       console.log(`🚪 Joining match room: ${matchId}`)
//       return true
//     } catch (error) {
//       console.error('❌ Error joining match room:', error)
//       return false
//     }
//   }

//   leaveMatch(matchId: string): boolean {
//     if (!this.socket?.connected) {
//       console.log('⚠️ WebSocket not connected, cannot leave match')
//       return false
//     }

//     try {
//       this.socket.emit('leave-match', matchId)
//       console.log(`🚪 Leaving match room: ${matchId}`)

//       // Clear typing timeout for this match
//       if (this.typingTimeouts.has(matchId)) {
//         clearTimeout(this.typingTimeouts.get(matchId)!)
//         this.typingTimeouts.delete(matchId)
//       }

//       return true
//     } catch (error) {
//       console.error('❌ Error leaving match room:', error)
//       return false
//     }
//   }

//   // Message sending
//   async sendMessage(
//     matchId: string,
//     content: string,
//     tempId?: string
//   ): Promise<boolean> {
//     if (!this.socket?.connected) {
//       console.error('❌ WebSocket not connected')
//       return false
//     }

//     return new Promise((resolve) => {
//       try {
//         const messageData = { matchId, content, tempId }
//         this.socket?.emit('send-message', messageData)

//         // Set up confirmation listener
//         const onMessageSent = (data: any) => {
//           if (data.success) {
//             console.log(
//               '✅ Message sent via WebSocket:',
//               data.tempId || 'no tempId'
//             )
//             resolve(true)
//           } else {
//             console.log('❌ Message send failed')
//             resolve(false)
//           }
//           // Clean up listeners
//           this.socket?.off('message-sent', onMessageSent)
//           this.socket?.off('message-error', onMessageError)
//         }

//         const onMessageError = (error: any) => {
//           console.error('❌ Message send error:', error)
//           resolve(false)
//           // Clean up listeners
//           this.socket?.off('message-sent', onMessageSent)
//           this.socket?.off('message-error', onMessageError)
//         }

//         this.socket?.on('message-sent', onMessageSent)
//         this.socket?.on('message-error', onMessageError)

//         // Timeout after 5 seconds
//         setTimeout(() => {
//           this.socket?.off('message-sent', onMessageSent)
//           this.socket?.off('message-error', onMessageError)
//           console.log('⏰ Message send timeout')
//           resolve(false)
//         }, 5000)
//       } catch (error) {
//         console.error('❌ Error sending message:', error)
//         resolve(false)
//       }
//     })
//   }

//   // Mark messages as read
//   markMessagesAsRead(matchId: string, messageIds: string[]): boolean {
//     if (
//       !this.socket?.connected ||
//       !Array.isArray(messageIds) ||
//       messageIds.length === 0
//     ) {
//       return false
//     }

//     try {
//       this.socket.emit('mark-read', { matchId, messageIds })
//       return true
//     } catch (error) {
//       console.error('❌ Error marking messages as read:', error)
//       return false
//     }
//   }

//   // Heartbeat for connection monitoring
//   private startHeartbeat() {
//     this.stopHeartbeat() // Clear any existing interval

//     this.heartbeatInterval = setInterval(() => {
//       if (this.socket?.connected) {
//         this.socket.emit('heartbeat')
//       } else {
//         this.stopHeartbeat()
//       }
//     }, 30000) // Every 30 seconds
//   }

//   private stopHeartbeat() {
//     if (this.heartbeatInterval) {
//       clearInterval(this.heartbeatInterval)
//       this.heartbeatInterval = null
//     }
//   }

//   // Event system
//   on(event: string, callback: Function) {
//     if (!this.listeners.has(event)) {
//       this.listeners.set(event, [])
//     }
//     this.listeners.get(event)?.push(callback)
//   }

//   off(event: string, callback: Function) {
//     const callbacks = this.listeners.get(event)
//     if (callbacks) {
//       const index = callbacks.indexOf(callback)
//       if (index > -1) {
//         callbacks.splice(index, 1)
//       }
//     }
//   }

//   private triggerEvent(event: string, data: any) {
//     const callbacks = this.listeners.get(event) || []
//     callbacks.forEach((callback) => {
//       try {
//         callback(data)
//       } catch (error) {
//         console.error(`Error in ${event} callback:`, error)
//       }
//     })
//   }

//   // Connection status
//   onConnectionChange(callback: (connected: boolean) => void) {
//     this.connectionCallbacks.push(callback)
//   }

//   private notifyConnectionChange(connected: boolean) {
//     this.connectionCallbacks.forEach((callback) => {
//       try {
//         callback(connected)
//       } catch (error) {
//         console.error('Error in connection change callback:', error)
//       }
//     })
//   }

//   isConnected(): boolean {
//     return this.socket?.connected || false
//   }

//   getSocket(): Socket | null {
//     return this.socket
//   }

//   disconnect() {
//     if (this.socket) {
//       this.socket.disconnect()
//       this.socket = null
//       this.notifyConnectionChange(false)
//       this.stopHeartbeat()

//       // Clear all typing timeouts
//       this.typingTimeouts.forEach((timeout) => clearTimeout(timeout))
//       this.typingTimeouts.clear()
//     }
//   }

//   private setupEventListeners() {
//     // Setup window event listeners
//     if (typeof window !== 'undefined') {
//       // Reconnect when window gains focus
//       window.addEventListener('focus', () => {
//         if (!this.isConnected()) {
//           console.log('🔄 Window focused, attempting to reconnect...')
//           this.connect()
//         }
//       })

//       // Handle page visibility
//       document.addEventListener('visibilitychange', () => {
//         if (document.visibilityState === 'visible' && !this.isConnected()) {
//           console.log('🔄 Page visible, attempting to reconnect...')
//           this.connect()
//         }
//       })
//     }
//   }
// }

// export const webSocketService = new WebSocketService()

// import { io, Socket } from 'socket.io-client'
// import { store } from '../store'
// import {
//   newMessageReceived,
//   setTypingIndicator,
//   setOnlineStatus,
//   setOnlineStatusBatch,
//   replaceOptimisticMessage,
// } from '../slices/messageSlice'

// class WebSocketService {
//   private socket: Socket | null = null
//   private listeners: Map<string, Function[]> = new Map()
//   private reconnectAttempts = 0
//   private maxReconnectAttempts = 5
//   private connectionCallbacks: ((connected: boolean) => void)[] = []
//   private typingTimeouts = new Map<string, NodeJS.Timeout>()
//   private heartbeatInterval: NodeJS.Timeout | null = null
//   private clearTypingTimeout(matchId: string) {
//     if (this.typingTimeouts.has(matchId)) {
//       clearTimeout(this.typingTimeouts.get(matchId)!)
//       this.typingTimeouts.delete(matchId)
//     }
//   }
//   constructor() {
//     this.setupEventListeners()
//   }

//   async connect(): Promise<boolean> {
//     return new Promise((resolve) => {
//       try {
//         if (this.socket?.connected) {
//           console.log('✅ WebSocket already connected')
//           resolve(true)
//           return
//         }

//         const token = this.getToken()
//         const serverUrl =
//           process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

//         console.log('🔌 Connecting to WebSocket...', { serverUrl })

//         this.socket = io(serverUrl, {
//           transports: ['websocket', 'polling'],
//           auth: { token },
//           query: { token },
//           reconnection: true,
//           reconnectionAttempts: this.maxReconnectAttempts,
//           reconnectionDelay: 1000,
//           reconnectionDelayMax: 5000,
//           timeout: 10000,
//           forceNew: true,
//         })

//         this.socket.on('connect', () => {
//           console.log('✅ WebSocket connected successfully:', {
//             socketId: this.socket?.id,
//             connected: this.socket?.connected,
//           })
//           this.reconnectAttempts = 0
//           this.notifyConnectionChange(true)
//           this.startHeartbeat()
//           resolve(true)
//         })

//         this.socket.on('connect_error', (error) => {
//           console.error('❌ WebSocket connection error:', error.message)
//           this.notifyConnectionChange(false)
//           this.reconnectAttempts++

//           if (this.reconnectAttempts >= this.maxReconnectAttempts) {
//             console.log('⚠️ Max reconnection attempts reached')
//             this.socket?.disconnect()
//           }

//           resolve(false)
//         })

//         this.socket.on('disconnect', (reason) => {
//           console.log('❌ WebSocket disconnected:', reason)
//           this.notifyConnectionChange(false)
//           this.stopHeartbeat()

//           if (reason === 'io server disconnect') {
//             setTimeout(() => {
//               if (!this.socket?.connected) {
//                 this.connect()
//               }
//             }, 1000)
//           }
//         })

//         // Setup event listeners
//         this.setupSocketListeners()
//       } catch (error) {
//         console.error('❌ WebSocket connection error:', error)
//         resolve(false)
//       }
//     })
//   }

//   private getToken(): string {
//     if (typeof document !== 'undefined') {
//       const cookies = document.cookie.split(';')
//       const tokenCookie = cookies.find((c) => c.trim().startsWith('token='))
//       return tokenCookie ? tokenCookie.split('=')[1] : ''
//     }
//     return ''
//   }

//   private setupSocketListeners() {
//     if (!this.socket) return

//     // Listen for new messages
//     this.socket.on('new-message', (message: any) => {
//       console.log('📩 WebSocket: Received new message:', {
//         id: message._id,
//         tempId: message.tempId,
//         matchId: message.matchId,
//         sender: message.sender,
//       })

//       // If this is a real message replacing an optimistic one
//       if (message.tempId) {
//         console.log(
//           '🔄 Replacing optimistic message with tempId:',
//           message.tempId
//         )
//         store.dispatch(
//           replaceOptimisticMessage({
//             tempId: message.tempId,
//             realMessage: message,
//           })
//         )
//       } else {
//         store.dispatch(newMessageReceived(message))
//       }

//       this.triggerEvent('new-message', message)
//     })

//     // Listen for typing indicators
//     this.socket.on('user-typing', (data: any) => {
//       console.log('✍️ WebSocket: User typing:', data)
//       store.dispatch(
//         setTypingIndicator({
//           userId: data.userId,
//           matchId: data.matchId,
//           isTyping: data.isTyping,
//           name: data.name,
//           user: data.user,
//           timestamp: data.timestamp || new Date().toISOString(),
//         })
//       )
//       this.triggerEvent('user-typing', data)
//     })

//     // Listen for online status updates
//     this.socket.on('user-status', (data: any) => {
//       console.log('📡 WebSocket: User status changed:', data)
//       store.dispatch(
//         setOnlineStatus({
//           userId: data.userId,
//           isOnline: data.status === 'online',
//           lastSeen: data.lastSeen,
//           user: data.user,
//         })
//       )
//       this.triggerEvent('user-status', data)
//     })

//     // Listen for online status batch
//     this.socket.on('online-status-batch', (statuses: any) => {
//       console.log(
//         '👥 WebSocket: Received batch status for',
//         Object.keys(statuses).length,
//         'users'
//       )
//       store.dispatch(setOnlineStatusBatch(statuses))
//       this.triggerEvent('online-status-batch', statuses)
//     })

//     // Listen for online users list
//     this.socket.on('online-users', (userIds: string[]) => {
//       console.log('👥 WebSocket: Online users:', userIds.length)
//       this.triggerEvent('online-users', userIds)

//       if (userIds.length > 0) {
//         this.checkOnlineStatusBatch(userIds)
//       }
//     })

//     // Listen for room joined confirmation
//     this.socket.on('room-joined', (data: any) => {
//       console.log('🚪 WebSocket: Room joined:', data.room)
//       this.triggerEvent('room-joined', data)
//     })

//     // Listen for message sent confirmation
//     this.socket.on('message-sent', (data: any) => {
//       console.log('✅ WebSocket: Message sent confirmation:', data.tempId)
//       this.triggerEvent('message-sent', data)
//     })

//     // Listen for message error
//     this.socket.on('message-error', (error: any) => {
//       console.error('❌ WebSocket: Message error:', error)
//       this.triggerEvent('message-error', error)
//     })

//     // Listen for messages read
//     this.socket.on('messages-read', (data: any) => {
//       console.log('📖 WebSocket: Messages read:', data.messageIds.length)
//       this.triggerEvent('messages-read', data)
//     })

//     // Listen for welcome
//     this.socket.on('welcome', (data: any) => {
//       console.log('👋 WebSocket:', data.message)
//       this.triggerEvent('welcome', data)
//     })
//   }

//   sendTypingIndicator(matchId: string, isTyping: boolean): boolean {
//     if (!this.socket?.connected) {
//       console.log('⚠️ WebSocket not connected, cannot send typing indicator')
//       return false
//     }

//     try {
//       console.log(
//         `✍️ Sending typing indicator: ${
//           isTyping ? 'started' : 'stopped'
//         } for match ${matchId}`
//       )

//       // Clear previous timeout
//       this.clearTypingTimeout(matchId)

//       this.socket.emit('typing', { matchId, isTyping })

//       // Set timeout to auto-send "stopped typing" after 3 seconds (more generous)
//       if (isTyping) {
//         const timeout = setTimeout(() => {
//           console.log('⏰ Auto-stopping typing indicator after timeout')
//           this.sendTypingIndicator(matchId, false)
//         }, 3000) // Increased to 3 seconds
//         this.typingTimeouts.set(matchId, timeout)
//       }

//       return true
//     } catch (error) {
//       console.error('❌ Error sending typing indicator:', error)
//       return false
//     }
//   }

//   // Online status methods
//   checkOnlineStatus(userId: string): boolean {
//     if (!this.socket?.connected) {
//       console.log('⚠️ WebSocket not connected, cannot check online status')
//       return false
//     }

//     this.socket.emit('check-online', userId)
//     return true
//   }

//   checkOnlineStatusBatch(userIds: string[]): boolean {
//     if (!this.socket?.connected) {
//       console.log(
//         '⚠️ WebSocket not connected, cannot check online status batch'
//       )
//       return false
//     }

//     if (!Array.isArray(userIds) || userIds.length === 0) {
//       return false
//     }

//     console.log('👥 Checking online status for batch:', userIds.length, 'users')
//     this.socket.emit('check-online-batch', userIds)
//     return true
//   }

//   // Match room methods
//   joinMatch(matchId: string): boolean {
//     if (!this.socket?.connected) {
//       console.log('⚠️ WebSocket not connected, cannot join match')
//       return false
//     }

//     try {
//       this.socket.emit('join-match', matchId)
//       console.log(`🚪 Joining match room: ${matchId}`)
//       return true
//     } catch (error) {
//       console.error('❌ Error joining match room:', error)
//       return false
//     }
//   }

//   leaveMatch(matchId: string): boolean {
//     if (!this.socket?.connected) {
//       console.log('⚠️ WebSocket not connected, cannot leave match')
//       return false
//     }

//     try {
//       this.socket.emit('leave-match', matchId)
//       console.log(`🚪 Leaving match room: ${matchId}`)

//       // Clear typing timeout for this match
//       if (this.typingTimeouts.has(matchId)) {
//         clearTimeout(this.typingTimeouts.get(matchId)!)
//         this.typingTimeouts.delete(matchId)
//       }

//       return true
//     } catch (error) {
//       console.error('❌ Error leaving match room:', error)
//       return false
//     }
//   }

//   // Message sending
//   async sendMessage(
//     matchId: string,
//     content: string,
//     tempId?: string
//   ): Promise<boolean> {
//     if (!this.socket?.connected) {
//       console.error('❌ WebSocket not connected')
//       return false
//     }

//     return new Promise((resolve) => {
//       try {
//         const messageData = { matchId, content, tempId }
//         console.log('📤 Sending message via WebSocket:', {
//           matchId,
//           tempId,
//           contentLength: content.length,
//         })
//         this.socket?.emit('send-message', messageData)

//         // Set up confirmation listener
//         const onMessageSent = (data: any) => {
//           console.log('✅ WebSocket message sent confirmation:', data)
//           if (data.success) {
//             resolve(true)
//           } else {
//             resolve(false)
//           }
//           // Clean up listeners
//           this.socket?.off('message-sent', onMessageSent)
//           this.socket?.off('message-error', onMessageError)
//         }

//         const onMessageError = (error: any) => {
//           console.error('❌ WebSocket message send error:', error)
//           resolve(false)
//           // Clean up listeners
//           this.socket?.off('message-sent', onMessageSent)
//           this.socket?.off('message-error', onMessageError)
//         }

//         this.socket?.on('message-sent', onMessageSent)
//         this.socket?.on('message-error', onMessageError)

//         // Timeout after 5 seconds
//         setTimeout(() => {
//           this.socket?.off('message-sent', onMessageSent)
//           this.socket?.off('message-error', onMessageError)
//           console.log('⏰ Message send timeout')
//           resolve(false)
//         }, 5000)
//       } catch (error) {
//         console.error('❌ Error sending message:', error)
//         resolve(false)
//       }
//     })
//   }

//   // Mark messages as read
//   markMessagesAsRead(matchId: string, messageIds: string[]): boolean {
//     if (
//       !this.socket?.connected ||
//       !Array.isArray(messageIds) ||
//       messageIds.length === 0
//     ) {
//       return false
//     }

//     try {
//       this.socket.emit('mark-read', { matchId, messageIds })
//       return true
//     } catch (error) {
//       console.error('❌ Error marking messages as read:', error)
//       return false
//     }
//   }

//   // Heartbeat for connection monitoring
//   private startHeartbeat() {
//     this.stopHeartbeat()

//     this.heartbeatInterval = setInterval(() => {
//       if (this.socket?.connected) {
//         this.socket.emit('heartbeat')
//       } else {
//         this.stopHeartbeat()
//       }
//     }, 30000)
//   }

//   private stopHeartbeat() {
//     if (this.heartbeatInterval) {
//       clearInterval(this.heartbeatInterval)
//       this.heartbeatInterval = null
//     }
//   }

//   // Event system
//   on(event: string, callback: Function) {
//     if (!this.listeners.has(event)) {
//       this.listeners.set(event, [])
//     }
//     this.listeners.get(event)?.push(callback)
//   }

//   off(event: string, callback: Function) {
//     const callbacks = this.listeners.get(event)
//     if (callbacks) {
//       const index = callbacks.indexOf(callback)
//       if (index > -1) {
//         callbacks.splice(index, 1)
//       }
//     }
//   }

//   private triggerEvent(event: string, data: any) {
//     const callbacks = this.listeners.get(event) || []
//     callbacks.forEach((callback) => {
//       try {
//         callback(data)
//       } catch (error) {
//         console.error(`Error in ${event} callback:`, error)
//       }
//     })
//   }

//   // Connection status
//   onConnectionChange(callback: (connected: boolean) => void) {
//     this.connectionCallbacks.push(callback)
//   }

//   private notifyConnectionChange(connected: boolean) {
//     this.connectionCallbacks.forEach((callback) => {
//       try {
//         callback(connected)
//       } catch (error) {
//         console.error('Error in connection change callback:', error)
//       }
//     })
//   }

//   isConnected(): boolean {
//     return this.socket?.connected || false
//   }

//   getSocket(): Socket | null {
//     return this.socket
//   }

//   disconnect() {
//     if (this.socket) {
//       this.socket.disconnect()
//       this.socket = null
//       this.notifyConnectionChange(false)
//       this.stopHeartbeat()

//       // Clear all typing timeouts
//       this.typingTimeouts.forEach((timeout) => clearTimeout(timeout))
//       this.typingTimeouts.clear()
//     }
//   }

//   private setupEventListeners() {
//     if (typeof window !== 'undefined') {
//       window.addEventListener('focus', () => {
//         if (!this.isConnected()) {
//           console.log('🔄 Window focused, attempting to reconnect...')
//           this.connect()
//         }
//       })

//       document.addEventListener('visibilitychange', () => {
//         if (document.visibilityState === 'visible' && !this.isConnected()) {
//           console.log('🔄 Page visible, attempting to reconnect...')
//           this.connect()
//         }
//       })
//     }
//   }
// }

// export const webSocketService = new WebSocketService()

import { io, Socket } from 'socket.io-client'
import { store } from '../store'
import {
  newMessageReceived,
  setTypingIndicator,
  setOnlineStatus,
  setOnlineStatusBatch,
  replaceOptimisticMessage,
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
        }

        const onMessageError = (error: any) => {
          console.error('❌ WebSocket message send error:', error)
          resolve(false)
          // Clean up listeners
          this.socket?.off('message-sent', onMessageSent)
          this.socket?.off('message-error', onMessageError)
        }

        this.socket?.on('message-sent', onMessageSent)
        this.socket?.on('message-error', onMessageError)

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
