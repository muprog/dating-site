'use client'

import React, { useEffect } from 'react'
import { webSocketService } from '../store/services/websocket'

const WebSocketDebug: React.FC = () => {
  useEffect(() => {
    console.log('🔧 WebSocket Debug Component Mounted')

    const socket = webSocketService.getSocket()

    if (socket) {
      socket.onAny((event, ...args) => {
        console.log(`🔧 [Debug Socket Event] ${event}`, args)
      })
    }

    const interval = setInterval(() => {
      console.log('🔧 WebSocket Status:', {
        connected: webSocketService.isConnected(),
        socketId: webSocketService.getSocket()?.id,
        hasSocket: !!webSocketService.getSocket(),
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const testConnection = async () => {
    console.log('🔧 Testing WebSocket connection...')

    try {
      await webSocketService.connect()

      const socket = webSocketService.getSocket()
      console.log('🔧 After connect:', {
        connected: webSocketService.isConnected(),
        socketId: socket?.id,
        transport: socket?.io.engine?.transport?.name,
      })
    } catch (error) {
      console.error('🔧 Connection test failed:', error)
    }
  }

  return (
    <div
      style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 1000 }}
    >
      <button
        onClick={testConnection}
        style={{
          padding: '10px',
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Test WS
      </button>
    </div>
  )
}

export default WebSocketDebug
