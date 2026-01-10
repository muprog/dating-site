// import { io, Socket } from 'socket.io-client'
// import { Message } from '../../types/messaging'
// import { store } from '../store'
// import { newMessageReceived } from '../slices/messageSlice'

// class WebSocketService {
//   private socket: Socket | null = null
//   private reconnectAttempts = 0
//   private maxReconnectAttempts = 10
//   private connectionPromise: Promise<void> | null = null
//   private messageQueue: Array<{ matchId: string; content: string }> = []
//   private isConnecting = false

//   // Event listeners
//   private onNewMessageCallbacks: ((message: Message) => void)[] = []
//   private onUserTypingCallbacks: ((data: {
//     matchId: string
//     userId: string
//   }) => void)[] = []
//   private onUserStoppedTypingCallbacks: ((data: {
//     matchId: string
//     userId: string
//   }) => void)[] = []

//   // Get token from cookies
//   private getToken(): string | null {
//     if (typeof window === 'undefined') return null

//     try {
//       const cookies = document.cookie.split(';')
//       const tokenCookie = cookies.find((c) => c.trim().startsWith('token='))

//       if (tokenCookie) {
//         return tokenCookie.split('=')[1]
//       }

//       return null
//     } catch {
//       return null
//     }
//   }

//   async connect(): Promise<void> {
//     if (this.socket?.connected) {
//       console.log('🔌 WebSocket already connected')
//       return Promise.resolve()
//     }

//     // If connecting in progress, return that promise
//     if (this.isConnecting && this.connectionPromise) {
//       return this.connectionPromise
//     }

//     this.isConnecting = true
//     this.connectionPromise = new Promise((resolve, reject) => {
//       const token = this.getToken()

//       console.log('🔌 Connecting WebSocket...', {
//         hasToken: !!token,
//         tokenLength: token?.length,
//       })

//       // Use the same URL as your API
//       const wsUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
//       console.log('🔌 Connecting to:', wsUrl)

//       const socketOptions: any = {
//         auth: { token: token || '' },
//         transports: ['polling', 'websocket'], // Polling first, then upgrade to websocket
//         reconnection: true,
//         reconnectionAttempts: this.maxReconnectAttempts,
//         reconnectionDelay: 1000,
//         reconnectionDelayMax: 5000,
//         timeout: 20000,
//         forceNew: true,
//         withCredentials: true,
//         query: token ? { token } : {},
//       }

//       try {
//         console.log('🔌 Creating socket with options:', socketOptions)
//         this.socket = io(wsUrl, socketOptions)
//       } catch (error) {
//         console.error('❌ Failed to create socket:', error)
//         this.isConnecting = false
//         this.connectionPromise = null
//         resolve()
//         return
//       }

//       const connectionTimeout = setTimeout(() => {
//         console.warn('⚠️ WebSocket connection timeout')
//         this.isConnecting = false
//         this.connectionPromise = null
//         resolve()
//       }, 15000)

//       this.socket.on('connect', () => {
//         clearTimeout(connectionTimeout)
//         this.isConnecting = false
//         this.reconnectAttempts = 0
//         console.log('✅ WebSocket connected successfully!', {
//           socketId: this.socket?.id,
//           connected: this.socket?.connected,
//           transport: this.socket?.io.engine.transport.name,
//         })

//         // Process queued messages
//         this.processMessageQueue()

//         // Re-join current match if exists
//         const state = store.getState()
//         const currentMatch = state.messages.currentMatch
//         if (currentMatch) {
//           console.log(`🚪 Re-joining match room: ${currentMatch._id}`)
//           this.joinMatch(currentMatch._id)
//         }

//         resolve()
//       })

//       this.socket.on('connect_error', (error) => {
//         console.error('❌ WebSocket connection error:', error.message)

//         // Don't clear timeout here, let it continue trying
//         this.reconnectAttempts++

//         if (this.reconnectAttempts >= this.maxReconnectAttempts) {
//           clearTimeout(connectionTimeout)
//           console.warn('⚠️ Max reconnection attempts reached')
//           this.isConnecting = false
//           this.connectionPromise = null
//           resolve()
//         }
//       })

//       this.socket.on('disconnect', (reason) => {
//         console.log('🔌 WebSocket disconnected:', reason)
//         if (reason === 'io server disconnect') {
//           // Server disconnected, try to reconnect
//           this.socket?.connect()
//         }
//       })

//       this.socket.on('welcome', (data) => {
//         console.log('👋 WebSocket welcome:', data)
//       })

//       this.socket.on('joined-room', (data) => {
//         console.log('🚪 Joined room:', data)
//       })

//       this.socket.on('message-sent', (data) => {
//         console.log('✅ Message sent confirmation:', data)
//       })

//       this.setupEventListeners()
//     })

//     return this.connectionPromise
//   }

//   private setupEventListeners() {
//     if (!this.socket) return

//     this.socket.on('new-message', (message: Message) => {
//       console.log('📩 WebSocket: Received new-message event:', {
//         messageId: message._id,
//         matchId: message.matchId,
//         sender: message.sender,
//         content: message.content.substring(0, 50) + '...',
//       })

//       // Dispatch to Redux
//       store.dispatch(newMessageReceived(message))

//       // Notify callbacks
//       this.onNewMessageCallbacks.forEach((callback) => callback(message))
//     })

//     this.socket.on(
//       'user-typing',
//       (data: { matchId: string; userId: string }) => {
//         console.log('⌨️ WebSocket: User typing:', data)
//         this.onUserTypingCallbacks.forEach((callback) => callback(data))
//       }
//     )

//     this.socket.on(
//       'user-stopped-typing',
//       (data: { matchId: string; userId: string }) => {
//         console.log('💤 WebSocket: User stopped typing:', data)
//         this.onUserStoppedTypingCallbacks.forEach((callback) => callback(data))
//       }
//     )

//     // Debug: Log all events
//     this.socket.onAny((event, ...args) => {
//       if (event !== 'pong' && event !== 'ping') {
//         // Filter out ping/pong noise
//         console.log(
//           `🔵 [WebSocket Event] ${event}`,
//           args.length > 0 ? args[0] : ''
//         )
//       }
//     })
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
//       console.log(`📤 Sending WebSocket message to match ${matchId}`)
//       this.socket.emit('send-message', { matchId, content })
//     } else {
//       console.warn('⚠️ Cannot send WebSocket message: socket not connected')
//       // Queue for later
//       this.messageQueue.push({ matchId, content })
//     }
//   }

//   // Register event listeners
//   onNewMessage(callback: (message: Message) => void) {
//     this.onNewMessageCallbacks.push(callback)
//     return () => {
//       const index = this.onNewMessageCallbacks.indexOf(callback)
//       if (index > -1) this.onNewMessageCallbacks.splice(index, 1)
//     }
//   }

//   onUserTyping(callback: (data: { matchId: string; userId: string }) => void) {
//     this.onUserTypingCallbacks.push(callback)
//     return () => {
//       const index = this.onUserTypingCallbacks.indexOf(callback)
//       if (index > -1) this.onUserTypingCallbacks.splice(index, 1)
//     }
//   }

//   onUserStoppedTyping(
//     callback: (data: { matchId: string; userId: string }) => void
//   ) {
//     this.onUserStoppedTypingCallbacks.push(callback)
//     return () => {
//       const index = this.onUserStoppedTypingCallbacks.indexOf(callback)
//       if (index > -1) this.onUserStoppedTypingCallbacks.splice(index, 1)
//     }
//   }

//   joinMatch(matchId: string) {
//     if (this.socket?.connected) {
//       console.log(`🚪 Joining match room via WebSocket: ${matchId}`)
//       this.socket.emit('join-match', matchId)
//     } else {
//       console.warn('⚠️ Cannot join match: socket not connected')
//       // Try to connect first
//       this.connect().then(() => {
//         if (this.socket?.connected) {
//           this.socket.emit('join-match', matchId)
//         }
//       })
//     }
//   }

//   leaveMatch(matchId: string) {
//     if (this.socket?.connected) {
//       console.log(`🚪 Leaving match room via WebSocket: ${matchId}`)
//       this.socket.emit('leave-match', matchId)
//     }
//   }

//   async sendMessage(matchId: string, content: string): Promise<void> {
//     console.log(`📤 Sending WebSocket message for match ${matchId}`)

//     // Ensure we're connected
//     if (!this.isConnected()) {
//       console.log('⚠️ WebSocket not connected, trying to connect...')
//       await this.connect()
//     }

//     // Send immediately
//     this.sendMessageInternal(matchId, content)
//   }

//   typing(matchId: string) {
//     if (this.socket?.connected) {
//       this.socket.emit('typing', matchId)
//     }
//   }

//   stopTyping(matchId: string) {
//     if (this.socket?.connected) {
//       this.socket.emit('stop-typing', matchId)
//     }
//   }

//   disconnect() {
//     if (this.socket) {
//       console.log('🔌 Disconnecting WebSocket...')
//       this.socket.disconnect()
//       this.socket = null
//       this.isConnecting = false
//       this.connectionPromise = null
//       this.messageQueue = []
//       this.onNewMessageCallbacks = []
//       this.onUserTypingCallbacks = []
//       this.onUserStoppedTypingCallbacks = []
//     }
//   }

//   isConnected(): boolean {
//     return this.socket?.connected || false
//   }

//   getSocket(): Socket | null {
//     return this.socket
//   }
// }

// export const webSocketService = new WebSocketService()

// services/websocket.ts - COMPLETELY FIXED VERSION
import { io, Socket } from 'socket.io-client'
import { Message } from '../../types/messaging'
import { store } from '../store'
import { newMessageReceived } from '../slices/messageSlice'
import { logDebugInfo } from '../../utils/debugUtils'

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private messageQueue: Array<{ matchId: string; content: string }> = []
  private isConnecting = false
  private connectionListeners: Array<(connected: boolean) => void> = []

  // Event listeners
  private onNewMessageCallbacks: ((message: Message) => void)[] = []

  // Get token from multiple sources
  private getToken(): string | null {
    if (typeof window === 'undefined') return null

    try {
      // 1. Try cookies first
      const cookies = document.cookie.split(';')
      const tokenCookie = cookies.find((c) => c.trim().startsWith('token='))
      if (tokenCookie) {
        const token = tokenCookie.split('=')[1]
        if (token && token !== 'undefined' && token !== 'null') {
          console.log('🔑 Found token in cookies')
          return token
        }
      }

      // 2. Try localStorage as fallback
      const localStorageToken = localStorage.getItem('token')
      if (
        localStorageToken &&
        localStorageToken !== 'undefined' &&
        localStorageToken !== 'null'
      ) {
        console.log('🔑 Found token in localStorage')
        return localStorageToken
      }

      // 3. Try Redux store
      const state = store.getState()
      const userToken = state.auth.user?.token
      if (userToken) {
        console.log('🔑 Found token in Redux store')
        return userToken
      }

      console.warn('⚠️ No token found in any storage')
      return null
    } catch (error) {
      console.error('❌ Error getting token:', error)
      return null
    }
  }

  async connect(): Promise<boolean> {
    // Log debug info
    logDebugInfo()

    if (this.socket?.connected) {
      console.log('🔌 WebSocket already connected')
      return true
    }

    if (this.isConnecting) {
      console.log('🔌 WebSocket connection in progress...')
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkInterval)
            resolve(true)
          }
          if (!this.isConnecting) {
            clearInterval(checkInterval)
            resolve(false)
          }
        }, 100)
      })
    }

    this.isConnecting = true
    console.log('🔌 Starting WebSocket connection...')

    const token = this.getToken()
    console.log('🔑 Token status:', token ? 'Available' : 'Missing')

    // Use the same URL as your API
    const wsUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    console.log('🔌 Connecting to WebSocket server:', wsUrl)

    // FIXED: Simplified socket options
    const socketOptions: any = {
      transports: ['websocket'], // Use ONLY websocket, no polling
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true,
      forceNew: true,
      withCredentials: true,
      auth: token ? { token } : undefined,
      query: token ? { token } : undefined,
    }

    try {
      console.log('🔌 Creating socket with options:', {
        ...socketOptions,
        auth: token ? { token: '***' } : 'none',
        query: token ? { token: '***' } : 'none',
      })

      this.socket = io(wsUrl, socketOptions)
      this.setupEventListeners()

      return new Promise((resolve) => {
        const connectionTimeout = setTimeout(() => {
          console.warn('⚠️ WebSocket connection timeout')
          this.isConnecting = false
          resolve(false)
        }, 10000)

        this.socket!.on('connect', () => {
          clearTimeout(connectionTimeout)
          this.isConnecting = false
          this.reconnectAttempts = 0
          console.log('✅ WebSocket CONNECTED successfully!', {
            socketId: this.socket?.id,
            transport: this.socket?.io?.engine?.transport?.name,
          })

          // Notify connection listeners
          this.connectionListeners.forEach((listener) => listener(true))

          // Process queued messages
          this.processMessageQueue()

          // Join current match if exists
          const state = store.getState()
          const currentMatch = state.messages.currentMatch
          if (currentMatch) {
            console.log(`🚪 Auto-joining match room: ${currentMatch._id}`)
            this.joinMatch(currentMatch._id)
          }

          resolve(true)
        })

        this.socket!.on('connect_error', (error: any) => {
          console.error('❌ WebSocket CONNECTION ERROR:', {
            message: error.message,
            description: error.description,
            type: error.type,
            context: error.context,
          })

          this.isConnecting = false
          clearTimeout(connectionTimeout)

          // Try reconnection
          this.reconnectAttempts++
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(
              `🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
            )
            setTimeout(() => {
              if (this.socket && !this.socket.connected) {
                this.socket.connect()
              }
            }, 2000)
          } else {
            console.warn('⚠️ Max reconnection attempts reached')
            resolve(false)
          }
        })
      })
    } catch (error: any) {
      console.error('❌ CRITICAL: Failed to create socket:', error)
      this.isConnecting = false
      this.socket = null
      return false
    }
  }

  private setupEventListeners() {
    if (!this.socket) return

    // Remove all existing listeners first
    this.socket.removeAllListeners()

    // Basic connection events
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason)
      this.connectionListeners.forEach((listener) => listener(false))

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            console.log('🔄 Attempting to reconnect after server disconnect...')
            this.socket.connect()
          }
        }, 1000)
      }
    })

    // Application events
    this.socket.on('new-message', (message: Message) => {
      console.log('📩 WebSocket: Received new-message:', {
        messageId: message._id,
        matchId: message.matchId,
        sender: message.sender,
        content: message.content.substring(0, 30) + '...',
      })

      // Dispatch to Redux
      store.dispatch(newMessageReceived(message))

      // Notify callbacks
      this.onNewMessageCallbacks.forEach((callback) => callback(message))
    })

    this.socket.on('welcome', (data) => {
      console.log('👋 WebSocket welcome:', data)
    })

    this.socket.on('joined-room', (data) => {
      console.log('🚪 Joined room:', data)
    })

    this.socket.on('message-sent', (data) => {
      console.log('✅ Message sent confirmation:', data)
    })

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error)
    })

    // Debug: Log all events
    this.socket.onAny((event, ...args) => {
      if (!['ping', 'pong'].includes(event)) {
        console.log(`🔵 [WS Event: ${event}]`, args.length > 0 ? args[0] : '')
      }
    })
  }

  private processMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`📤 Processing ${this.messageQueue.length} queued messages`)
      const queueCopy = [...this.messageQueue]
      this.messageQueue = []

      queueCopy.forEach(({ matchId, content }) => {
        this.sendMessageInternal(matchId, content)
      })
    }
  }

  private sendMessageInternal(matchId: string, content: string) {
    if (this.socket?.connected) {
      console.log(
        `📤 Sending WebSocket message to match ${matchId}:`,
        content.substring(0, 30) + '...'
      )
      this.socket.emit('send-message', { matchId, content })
    } else {
      console.warn('⚠️ Cannot send WebSocket message: socket not connected')
      // Queue for later
      this.messageQueue.push({ matchId, content })
    }
  }

  // Public API
  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionListeners.push(callback)
    return () => {
      const index = this.connectionListeners.indexOf(callback)
      if (index > -1) this.connectionListeners.splice(index, 1)
    }
  }

  onNewMessage(callback: (message: Message) => void) {
    this.onNewMessageCallbacks.push(callback)
    return () => {
      const index = this.onNewMessageCallbacks.indexOf(callback)
      if (index > -1) this.onNewMessageCallbacks.splice(index, 1)
    }
  }

  joinMatch(matchId: string) {
    if (this.socket?.connected) {
      console.log(`🚪 Joining match room: ${matchId}`)
      this.socket.emit('join-match', matchId)
    } else {
      console.warn('⚠️ Cannot join match: socket not connected, queuing...')
      // Connect first, then join
      this.connect().then((connected) => {
        if (connected) {
          console.log(`🚪 Joining match room after connection: ${matchId}`)
          this.socket!.emit('join-match', matchId)
        }
      })
    }
  }

  leaveMatch(matchId: string) {
    if (this.socket?.connected) {
      console.log(`🚪 Leaving match room: ${matchId}`)
      this.socket.emit('leave-match', matchId)
    }
  }

  async sendMessage(matchId: string, content: string): Promise<boolean> {
    console.log(`📤 Attempting to send message to match ${matchId}`)

    // Ensure we're connected
    if (!this.isConnected()) {
      console.log('🔌 Not connected, attempting to connect...')
      const connected = await this.connect()
      if (!connected) {
        console.error('❌ Failed to connect, cannot send message')
        return false
      }
    }

    // Send message
    this.sendMessageInternal(matchId, content)
    return true
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...')
      this.socket.disconnect()
      this.socket = null
      this.isConnecting = false
      this.messageQueue = []
      this.onNewMessageCallbacks = []
      this.connectionListeners = []
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getSocket(): Socket | null {
    return this.socket
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      socketId: this.socket?.id,
      transport: this.socket?.io?.engine?.transport?.name,
      reconnectAttempts: this.reconnectAttempts,
    }
  }
}

export const webSocketService = new WebSocketService()
