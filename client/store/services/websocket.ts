// import { io, Socket } from 'socket.io-client'
// import { Message } from '../../types/messaging'
// import { store } from '../store'
// import { newMessageReceived } from '../slices/messageSlice'

// class WebSocketService {
//   private socket: Socket | null = null
//   private reconnectAttempts = 0
//   private maxReconnectAttempts = 5

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

//   // Updated connect method - either use token OR cookies
//   connect(token?: string) {
//     if (this.socket?.connected) {
//       return
//     }

//     const socketOptions: any = {
//       transports: ['websocket', 'polling'],
//       reconnection: true,
//       reconnectionAttempts: this.maxReconnectAttempts,
//       reconnectionDelay: 1000,
//       withCredentials: true, // Important: This sends cookies
//     }

//     // If token is provided, use auth. Otherwise rely on cookies
//     if (token) {
//       socketOptions.auth = { token }
//       console.log('🔌 WebSocket: Connecting with token')
//     } else {
//       console.log('🔌 WebSocket: Connecting with cookies')
//     }

//     this.socket = io(
//       process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000',
//       socketOptions
//     )

//     this.setupEventListeners()
//   }

//   private setupEventListeners() {
//     if (!this.socket) return

//     this.socket.on('connect', () => {
//       console.log('✅ WebSocket connected successfully')
//       this.reconnectAttempts = 0

//       // Join current match room if exists
//       const state = store.getState()
//       const currentMatch = state.messages.currentMatch
//       if (currentMatch) {
//         this.joinMatch(currentMatch._id)
//       }
//     })

//     this.socket.on('disconnect', (reason) => {
//       console.log('❌ WebSocket disconnected:', reason)
//     })

//     this.socket.on('connect_error', (error) => {
//       console.error('❌ WebSocket connection error:', error)
//       this.reconnectAttempts++

//       if (this.reconnectAttempts >= this.maxReconnectAttempts) {
//         console.error('Max reconnection attempts reached')
//       }
//     })

//     // Message events
//     this.socket.on('new-message', (message: Message) => {
//       console.log('📩 WebSocket: New message received:', message)
//       // Dispatch to Redux store
//       store.dispatch(newMessageReceived(message))

//       // Call all registered callbacks
//       this.onNewMessageCallbacks.forEach((callback) => callback(message))
//     })

//     this.socket.on(
//       'user-typing',
//       (data: { matchId: string; userId: string }) => {
//         console.log('⌨️ WebSocket: User typing:', data)
//         // Call all registered callbacks
//         this.onUserTypingCallbacks.forEach((callback) => callback(data))
//       }
//     )

//     this.socket.on(
//       'user-stopped-typing',
//       (data: { matchId: string; userId: string }) => {
//         console.log('💤 WebSocket: User stopped typing:', data)
//         // Call all registered callbacks
//         this.onUserStoppedTypingCallbacks.forEach((callback) => callback(data))
//       }
//     )

//     // Add authentication error handling
//     this.socket.on('auth_error', (error: any) => {
//       console.error('🔐 WebSocket authentication error:', error)
//       // You might want to dispatch an action to show login prompt
//     })
//   }

//   // Register event listeners
//   onNewMessage(callback: (message: Message) => void) {
//     this.onNewMessageCallbacks.push(callback)

//     // Return unsubscribe function
//     return () => {
//       const index = this.onNewMessageCallbacks.indexOf(callback)
//       if (index > -1) {
//         this.onNewMessageCallbacks.splice(index, 1)
//       }
//     }
//   }

//   onUserTyping(callback: (data: { matchId: string; userId: string }) => void) {
//     this.onUserTypingCallbacks.push(callback)

//     // Return unsubscribe function
//     return () => {
//       const index = this.onUserTypingCallbacks.indexOf(callback)
//       if (index > -1) {
//         this.onUserTypingCallbacks.splice(index, 1)
//       }
//     }
//   }

//   onUserStoppedTyping(
//     callback: (data: { matchId: string; userId: string }) => void
//   ) {
//     this.onUserStoppedTypingCallbacks.push(callback)

//     // Return unsubscribe function
//     return () => {
//       const index = this.onUserStoppedTypingCallbacks.indexOf(callback)
//       if (index > -1) {
//         this.onUserStoppedTypingCallbacks.splice(index, 1)
//       }
//     }
//   }

//   joinMatch(matchId: string) {
//     if (this.socket?.connected) {
//       console.log(`🚪 WebSocket: Joining match room ${matchId}`)
//       this.socket.emit('join-match', matchId)
//     }
//   }

//   leaveMatch(matchId: string) {
//     if (this.socket?.connected) {
//       console.log(`🚪 WebSocket: Leaving match room ${matchId}`)
//       this.socket.emit('leave-match', matchId)
//     }
//   }

//   sendMessage(matchId: string, content: string) {
//     if (this.socket?.connected) {
//       console.log(`💬 WebSocket: Sending message to match ${matchId}`)
//       this.socket.emit('send-message', { matchId, content })
//     }
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
//       console.log('🔌 WebSocket: Disconnecting')
//       this.socket.disconnect()
//       this.socket = null
//       // Clear all callbacks
//       this.onNewMessageCallbacks = []
//       this.onUserTypingCallbacks = []
//       this.onUserStoppedTypingCallbacks = []
//     }
//   }

//   isConnected(): boolean {
//     return this.socket?.connected || false
//   }
// }

// export const webSocketService = new WebSocketService()

// store/services/websocket.ts
// import { io, Socket } from 'socket.io-client'
// import { Message } from '../../types/messaging'
// import { store } from '../store'
// import { newMessageReceived } from '../slices/messageSlice'

// class WebSocketService {
//   private socket: Socket | null = null
//   private reconnectAttempts = 0
//   private maxReconnectAttempts = 5
//   private connectionPromise: Promise<void> | null = null

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
//       // Try to get token from cookies
//       const cookies = document.cookie.split(';')
//       const tokenCookie = cookies.find((c) => c.trim().startsWith('token='))

//       if (tokenCookie) {
//         const token = tokenCookie.split('=')[1]
//         console.log('🔑 Token found in cookies:', token ? 'Yes' : 'No')
//         return token
//       }

//       console.log('🔑 No token found in cookies')
//       return null
//     } catch (error) {
//       console.log('Error getting token from cookies:', error)
//       return null
//     }
//   }

//   connect(): Promise<void> {
//     if (this.socket?.connected) {
//       console.log('✅ WebSocket: Already connected')
//       return Promise.resolve()
//     }

//     if (this.connectionPromise) {
//       console.log('🔄 WebSocket: Connection already in progress')
//       return this.connectionPromise
//     }

//     this.connectionPromise = new Promise((resolve, reject) => {
//       console.log('🔌 WebSocket: Attempting connection...')

//       // Get token
//       const token = this.getToken()

//       if (!token) {
//         const errorMsg = '❌ WebSocket: No token found in cookies'
//         console.log(errorMsg)
//         reject(new Error(errorMsg))
//         this.connectionPromise = null
//         return
//       }

//       console.log('🔑 WebSocket: Using token from cookies')

//       // Log the URL we're connecting to
//       const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000'
//       console.log(`🔗 WebSocket: Connecting to ${wsUrl}`)

//       const socketOptions: any = {
//         auth: {
//           token: token,
//         },
//         transports: ['polling', 'websocket'],
//         reconnection: true,
//         reconnectionAttempts: this.maxReconnectAttempts,
//         reconnectionDelay: 1000,
//         withCredentials: true,
//         timeout: 15000,
//         forceNew: true,
//         path: '/socket.io/',
//       }

//       console.log('⚙️ WebSocket options:', {
//         auth: token ? 'Present' : 'Missing',
//         transports: socketOptions.transports,
//         withCredentials: socketOptions.withCredentials,
//       })

//       try {
//         this.socket = io(wsUrl, socketOptions)
//       } catch (error) {
//         console.log('❌ WebSocket: Failed to create socket:', error)
//         reject(error)
//         this.connectionPromise = null
//         return
//       }

//       // Set up timeout for connection
//       const timeout = setTimeout(() => {
//         if (!this.socket?.connected) {
//           console.log('❌ WebSocket: Connection timeout after 15s')
//           reject(new Error('Connection timeout'))
//           this.connectionPromise = null
//           this.disconnect()
//         }
//       }, 15000)

//       this.socket.on('connect', () => {
//         console.log('✅ WebSocket: Connected successfully')
//         clearTimeout(timeout)
//         this.reconnectAttempts = 0

//         // Join current match room if exists
//         const state = store.getState()
//         const currentMatch = state.messages.currentMatch
//         if (currentMatch) {
//           console.log(
//             `🚪 WebSocket: Auto-joining match room ${currentMatch._id}`
//           )
//           this.joinMatch(currentMatch._id)
//         }

//         resolve()
//       })

//       this.socket.on('connect_error', (error) => {
//         // console.error('❌ WebSocket: Connection error details:', {
//         //   message: error.message,
//         //   // description: error.description,
//         //   // context: error.context,
//         //   // type: error.type
//         // })
//         clearTimeout(timeout)
//         this.reconnectAttempts++

//         if (this.reconnectAttempts >= this.maxReconnectAttempts) {
//           console.log('❌ WebSocket: Max reconnection attempts reached')
//           reject(
//             new Error('Max reconnection attempts reached: ' + error.message)
//           )
//           this.connectionPromise = null
//         } else {
//           console.log(
//             `🔄 WebSocket: Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
//           )
//         }
//       })

//       this.setupEventListeners()
//     })

//     return this.connectionPromise
//   }

//   private setupEventListeners() {
//     if (!this.socket) return

//     this.socket.on('disconnect', (reason) => {
//       console.log('❌ WebSocket: Disconnected - Reason:', reason)
//       this.connectionPromise = null
//       if (reason === 'io server disconnect') {
//         setTimeout(() => this.connect(), 1000)
//       }
//     })

//     this.socket.on('error', (error) => {
//       console.log('❌ WebSocket: Socket error:', error)
//     })

//     this.socket.on('new-message', (message: Message) => {
//       console.log('📩 WebSocket: New message received:', {
//         matchId: message.matchId,
//         sender: message.sender,
//         contentLength: message.content?.length,
//       })
//       store.dispatch(newMessageReceived(message))
//       this.onNewMessageCallbacks.forEach((callback) => callback(message))
//     })

//     this.socket.on(
//       'user-typing',
//       (data: { matchId: string; userId: string }) => {
//         console.log('⌨️ WebSocket: User typing event:', data)
//         this.onUserTypingCallbacks.forEach((callback) => callback(data))
//       }
//     )

//     this.socket.on(
//       'user-stopped-typing',
//       (data: { matchId: string; userId: string }) => {
//         console.log('💤 WebSocket: User stopped typing event:', data)
//         this.onUserStoppedTypingCallbacks.forEach((callback) => callback(data))
//       }
//     )

//     this.socket.on('auth_error', (error: any) => {
//       console.log('🔐 WebSocket: Authentication error:', error)
//     })
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
//       console.log(`🚪 WebSocket: Joining match room ${matchId}`)
//       this.socket.emit('join-match', matchId)
//     }
//   }

//   leaveMatch(matchId: string) {
//     if (this.socket?.connected) {
//       console.log(`🚪 WebSocket: Leaving match room ${matchId}`)
//       this.socket.emit('leave-match', matchId)
//     }
//   }

//   sendMessage(matchId: string, content: string) {
//     if (this.socket?.connected) {
//       console.log(`💬 WebSocket: Sending message to match ${matchId}`, content)
//       this.socket.emit('send-message', { matchId, content })
//     } else {
//       console.log('❌ WebSocket: Cannot send message - not connected')
//     }
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
//       console.log('🔌 WebSocket: Disconnecting')
//       this.socket.disconnect()
//       this.socket = null
//       this.connectionPromise = null
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

//   testConnection(): void {
//     console.log('🧪 Testing WebSocket connection...')
//     console.log('Environment variables:')
//     console.log('- NEXT_PUBLIC_WS_URL:', process.env.NEXT_PUBLIC_WS_URL)
//     console.log('- NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)

//     const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000'
//     console.log(`Testing connection to: ${wsUrl}`)

//     // Test with a simple fetch to check server availability
//     fetch(wsUrl)
//       .then((response) => {
//         console.log('✅ Server is reachable via HTTP')
//       })
//       .catch((error) => {
//         console.log('❌ Server is not reachable:', error.message)
//       })
//   }
// }

// export const webSocketService = new WebSocketService()
import { io, Socket } from 'socket.io-client'
import { Message } from '../../types/messaging'
import { store } from '../store'
import { newMessageReceived } from '../slices/messageSlice'

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private connectionPromise: Promise<void> | null = null
  private messageQueue: Array<{ matchId: string; content: string }> = []
  private isConnecting = false

  // Event listeners
  private onNewMessageCallbacks: ((message: Message) => void)[] = []
  private onUserTypingCallbacks: ((data: {
    matchId: string
    userId: string
  }) => void)[] = []
  private onUserStoppedTypingCallbacks: ((data: {
    matchId: string
    userId: string
  }) => void)[] = []

  // Get token from cookies
  private getToken(): string | null {
    if (typeof window === 'undefined') return null

    try {
      const cookies = document.cookie.split(';')
      const tokenCookie = cookies.find((c) => c.trim().startsWith('token='))

      if (tokenCookie) {
        return tokenCookie.split('=')[1]
      }

      return null
    } catch {
      return null
    }
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('🔌 WebSocket already connected')
      return Promise.resolve()
    }

    // If connecting in progress, return that promise
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise
    }

    this.isConnecting = true
    this.connectionPromise = new Promise((resolve, reject) => {
      const token = this.getToken()

      console.log('🔌 Connecting WebSocket...', {
        hasToken: !!token,
        tokenLength: token?.length,
      })

      // Use the same URL as your API
      const wsUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      console.log('🔌 Connecting to:', wsUrl)

      const socketOptions: any = {
        auth: { token: token || '' },
        transports: ['polling', 'websocket'], // Polling first, then upgrade to websocket
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
        withCredentials: true,
        query: token ? { token } : {},
      }

      try {
        console.log('🔌 Creating socket with options:', socketOptions)
        this.socket = io(wsUrl, socketOptions)
      } catch (error) {
        console.error('❌ Failed to create socket:', error)
        this.isConnecting = false
        this.connectionPromise = null
        resolve()
        return
      }

      const connectionTimeout = setTimeout(() => {
        console.warn('⚠️ WebSocket connection timeout')
        this.isConnecting = false
        this.connectionPromise = null
        resolve()
      }, 15000)

      this.socket.on('connect', () => {
        clearTimeout(connectionTimeout)
        this.isConnecting = false
        this.reconnectAttempts = 0
        console.log('✅ WebSocket connected successfully!', {
          socketId: this.socket?.id,
          connected: this.socket?.connected,
          transport: this.socket?.io.engine.transport.name,
        })

        // Process queued messages
        this.processMessageQueue()

        // Re-join current match if exists
        const state = store.getState()
        const currentMatch = state.messages.currentMatch
        if (currentMatch) {
          console.log(`🚪 Re-joining match room: ${currentMatch._id}`)
          this.joinMatch(currentMatch._id)
        }

        resolve()
      })

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error.message)

        // Don't clear timeout here, let it continue trying
        this.reconnectAttempts++

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          clearTimeout(connectionTimeout)
          console.warn('⚠️ Max reconnection attempts reached')
          this.isConnecting = false
          this.connectionPromise = null
          resolve()
        }
      })

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason)
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.socket?.connect()
        }
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

      this.setupEventListeners()
    })

    return this.connectionPromise
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('new-message', (message: Message) => {
      console.log('📩 WebSocket: Received new-message event:', {
        messageId: message._id,
        matchId: message.matchId,
        sender: message.sender,
        content: message.content.substring(0, 50) + '...',
      })

      // Dispatch to Redux
      store.dispatch(newMessageReceived(message))

      // Notify callbacks
      this.onNewMessageCallbacks.forEach((callback) => callback(message))
    })

    this.socket.on(
      'user-typing',
      (data: { matchId: string; userId: string }) => {
        console.log('⌨️ WebSocket: User typing:', data)
        this.onUserTypingCallbacks.forEach((callback) => callback(data))
      }
    )

    this.socket.on(
      'user-stopped-typing',
      (data: { matchId: string; userId: string }) => {
        console.log('💤 WebSocket: User stopped typing:', data)
        this.onUserStoppedTypingCallbacks.forEach((callback) => callback(data))
      }
    )

    // Debug: Log all events
    this.socket.onAny((event, ...args) => {
      if (event !== 'pong' && event !== 'ping') {
        // Filter out ping/pong noise
        console.log(
          `🔵 [WebSocket Event] ${event}`,
          args.length > 0 ? args[0] : ''
        )
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
      console.log(`📤 Sending WebSocket message to match ${matchId}`)
      this.socket.emit('send-message', { matchId, content })
    } else {
      console.warn('⚠️ Cannot send WebSocket message: socket not connected')
      // Queue for later
      this.messageQueue.push({ matchId, content })
    }
  }

  // Register event listeners
  onNewMessage(callback: (message: Message) => void) {
    this.onNewMessageCallbacks.push(callback)
    return () => {
      const index = this.onNewMessageCallbacks.indexOf(callback)
      if (index > -1) this.onNewMessageCallbacks.splice(index, 1)
    }
  }

  onUserTyping(callback: (data: { matchId: string; userId: string }) => void) {
    this.onUserTypingCallbacks.push(callback)
    return () => {
      const index = this.onUserTypingCallbacks.indexOf(callback)
      if (index > -1) this.onUserTypingCallbacks.splice(index, 1)
    }
  }

  onUserStoppedTyping(
    callback: (data: { matchId: string; userId: string }) => void
  ) {
    this.onUserStoppedTypingCallbacks.push(callback)
    return () => {
      const index = this.onUserStoppedTypingCallbacks.indexOf(callback)
      if (index > -1) this.onUserStoppedTypingCallbacks.splice(index, 1)
    }
  }

  joinMatch(matchId: string) {
    if (this.socket?.connected) {
      console.log(`🚪 Joining match room via WebSocket: ${matchId}`)
      this.socket.emit('join-match', matchId)
    } else {
      console.warn('⚠️ Cannot join match: socket not connected')
      // Try to connect first
      this.connect().then(() => {
        if (this.socket?.connected) {
          this.socket.emit('join-match', matchId)
        }
      })
    }
  }

  leaveMatch(matchId: string) {
    if (this.socket?.connected) {
      console.log(`🚪 Leaving match room via WebSocket: ${matchId}`)
      this.socket.emit('leave-match', matchId)
    }
  }

  async sendMessage(matchId: string, content: string): Promise<void> {
    console.log(`📤 Sending WebSocket message for match ${matchId}`)

    // Ensure we're connected
    if (!this.isConnected()) {
      console.log('⚠️ WebSocket not connected, trying to connect...')
      await this.connect()
    }

    // Send immediately
    this.sendMessageInternal(matchId, content)
  }

  typing(matchId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing', matchId)
    }
  }

  stopTyping(matchId: string) {
    if (this.socket?.connected) {
      this.socket.emit('stop-typing', matchId)
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...')
      this.socket.disconnect()
      this.socket = null
      this.isConnecting = false
      this.connectionPromise = null
      this.messageQueue = []
      this.onNewMessageCallbacks = []
      this.onUserTypingCallbacks = []
      this.onUserStoppedTypingCallbacks = []
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getSocket(): Socket | null {
    return this.socket
  }
}

export const webSocketService = new WebSocketService()
