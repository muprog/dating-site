// import { io, Socket } from 'socket.io-client'
// import { Message } from '../../types/messaging'
// import { store } from '../store'
// import { newMessageReceived } from '../slices/messageSlice'

// class WebSocketService {
//   private socket: Socket | null = null
//   private reconnectAttempts = 0
//   private maxReconnectAttempts = 5

//   connect(token: string) {
//     if (this.socket?.connected) {
//       return
//     }

//     this.socket = io(
//       process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000',
//       {
//         auth: { token },
//         transports: ['websocket', 'polling'],
//         reconnection: true,
//         reconnectionAttempts: this.maxReconnectAttempts,
//         reconnectionDelay: 1000,
//       }
//     )

//     this.setupEventListeners()
//   }

//   private setupEventListeners() {
//     if (!this.socket) return

//     this.socket.on('connect', () => {
//       console.log('WebSocket connected')
//       this.reconnectAttempts = 0

//       // Join current match room if exists
//       const state = store.getState()
//       const currentMatch = state.messages.currentMatch
//       if (currentMatch) {
//         this.joinMatch(currentMatch._id)
//       }
//     })

//     this.socket.on('disconnect', (reason) => {
//       console.log('WebSocket disconnected:', reason)
//     })

//     this.socket.on('connect_error', (error) => {
//       console.error('WebSocket connection error:', error)
//       this.reconnectAttempts++

//       if (this.reconnectAttempts >= this.maxReconnectAttempts) {
//         console.error('Max reconnection attempts reached')
//       }
//     })

//     // Message events
//     this.socket.on('new-message', (message: Message) => {
//       store.dispatch(newMessageReceived(message))
//     })

//     this.socket.on(
//       'user-typing',
//       (data: { matchId: string; userId: string }) => {
//         // Handle typing indicator
//         console.log('User typing:', data)
//       }
//     )

//     this.socket.on(
//       'user-stopped-typing',
//       (data: { matchId: string; userId: string }) => {
//         // Handle stop typing
//         console.log('User stopped typing:', data)
//       }
//     )
//   }

//   joinMatch(matchId: string) {
//     if (this.socket?.connected) {
//       this.socket.emit('join-match', matchId)
//     }
//   }

//   leaveMatch(matchId: string) {
//     if (this.socket?.connected) {
//       this.socket.emit('leave-match', matchId)
//     }
//   }

//   sendMessage(matchId: string, content: string) {
//     if (this.socket?.connected) {
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
//       this.socket.disconnect()
//       this.socket = null
//     }
//   }

//   isConnected(): boolean {
//     return this.socket?.connected || false
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
  private maxReconnectAttempts = 5

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

  connect(token: string) {
    if (this.socket?.connected) {
      return
    }

    this.socket = io(
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000',
      {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      }
    )

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0

      // Join current match room if exists
      const state = store.getState()
      const currentMatch = state.messages.currentMatch
      if (currentMatch) {
        this.joinMatch(currentMatch._id)
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.reconnectAttempts++

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
      }
    })

    // Message events
    this.socket.on('new-message', (message: Message) => {
      // Dispatch to Redux store
      store.dispatch(newMessageReceived(message))

      // Call all registered callbacks
      this.onNewMessageCallbacks.forEach((callback) => callback(message))
    })

    this.socket.on(
      'user-typing',
      (data: { matchId: string; userId: string }) => {
        // Call all registered callbacks
        this.onUserTypingCallbacks.forEach((callback) => callback(data))
      }
    )

    this.socket.on(
      'user-stopped-typing',
      (data: { matchId: string; userId: string }) => {
        // Call all registered callbacks
        this.onUserStoppedTypingCallbacks.forEach((callback) => callback(data))
      }
    )
  }

  // Register event listeners
  onNewMessage(callback: (message: Message) => void) {
    this.onNewMessageCallbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.onNewMessageCallbacks.indexOf(callback)
      if (index > -1) {
        this.onNewMessageCallbacks.splice(index, 1)
      }
    }
  }

  onUserTyping(callback: (data: { matchId: string; userId: string }) => void) {
    this.onUserTypingCallbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.onUserTypingCallbacks.indexOf(callback)
      if (index > -1) {
        this.onUserTypingCallbacks.splice(index, 1)
      }
    }
  }

  onUserStoppedTyping(
    callback: (data: { matchId: string; userId: string }) => void
  ) {
    this.onUserStoppedTypingCallbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.onUserStoppedTypingCallbacks.indexOf(callback)
      if (index > -1) {
        this.onUserStoppedTypingCallbacks.splice(index, 1)
      }
    }
  }

  joinMatch(matchId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-match', matchId)
    }
  }

  leaveMatch(matchId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-match', matchId)
    }
  }

  sendMessage(matchId: string, content: string) {
    if (this.socket?.connected) {
      this.socket.emit('send-message', { matchId, content })
    }
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
      this.socket.disconnect()
      this.socket = null
      // Clear all callbacks
      this.onNewMessageCallbacks = []
      this.onUserTypingCallbacks = []
      this.onUserStoppedTypingCallbacks = []
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const webSocketService = new WebSocketService()
