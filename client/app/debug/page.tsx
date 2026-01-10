// app/debug/page.tsx - Create this file first
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DebugPage() {
  const router = useRouter()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ])
  }

  useEffect(() => {
    // Collect debug info
    const info: any = {
      location: window.location.href,
      env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NODE_ENV: process.env.NODE_ENV,
      },
      cookies: document.cookie.split(';').map((c) => c.trim()),
      localStorage: {
        token: localStorage.getItem('token'),
        auth: localStorage.getItem('auth'),
      },
    }

    // Test WebSocket directly
    const testWebSocket = () => {
      addLog('🔍 Testing WebSocket connection...')

      try {
        const socketUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        addLog(`🔗 Connecting to: ${socketUrl}`)

        // Create simple WebSocket (not Socket.IO)
        const ws = new WebSocket(
          socketUrl.replace('http', 'ws') +
            '/socket.io/?EIO=4&transport=websocket'
        )

        ws.onopen = () => {
          addLog('✅ WebSocket (native) connected!')
          info.websocket = { native: 'connected' }
          setDebugInfo(info)
          ws.close()
        }

        ws.onerror = (error) => {
          addLog('❌ WebSocket (native) error')
          info.websocket = { native: 'failed', error: error.toString() }
          setDebugInfo(info)
        }

        ws.onclose = () => {
          addLog('🔌 WebSocket (native) closed')
        }

        // Also test Socket.IO
        import('socket.io-client').then(({ io }) => {
          addLog('🔍 Testing Socket.IO...')
          const socket = io(socketUrl, {
            transports: ['websocket'],
            timeout: 5000,
          })

          socket.on('connect', () => {
            addLog('✅ Socket.IO connected!')
            info.socketio = { connected: true, id: socket.id }
            setDebugInfo(info)
            socket.disconnect()
          })

          socket.on('connect_error', (err: any) => {
            addLog(`❌ Socket.IO error: ${err.message || 'Unknown error'}`)
            info.socketio = { connected: false, error: err.message }
            setDebugInfo(info)
          })

          setTimeout(() => {
            if (!socket.connected) {
              addLog('⚠️ Socket.IO timeout')
              socket.disconnect()
            }
          }, 5000)
        })
      } catch (error: any) {
        addLog(`💥 Critical error: ${error.message}`)
        info.websocket = { error: error.message }
        setDebugInfo(info)
      }
    }

    setDebugInfo(info)
    testWebSocket()
  }, [])

  const copyToClipboard = () => {
    const text = JSON.stringify(
      {
        debugInfo,
        logs,
      },
      null,
      2
    )
    navigator.clipboard.writeText(text)
    addLog('📋 Copied debug info to clipboard')
  }

  return (
    <div className='min-h-screen bg-gray-900 text-white p-4'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-2xl font-bold mb-6'>WebSocket Debugger</h1>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Debug Info Panel */}
          <div className='bg-gray-800 rounded-lg p-4'>
            <h2 className='text-lg font-semibold mb-3'>Debug Information</h2>
            <pre className='text-sm bg-gray-900 p-3 rounded overflow-auto max-h-96'>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
            <button
              onClick={copyToClipboard}
              className='mt-3 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded'
            >
              Copy Debug Info
            </button>
          </div>

          {/* Logs Panel */}
          <div className='bg-gray-800 rounded-lg p-4'>
            <h2 className='text-lg font-semibold mb-3'>Logs</h2>
            <div className='text-sm bg-gray-900 p-3 rounded overflow-auto max-h-96'>
              {logs.map((log, index) => (
                <div key={index} className='mb-1 font-mono'>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Tests */}
        <div className='mt-6 bg-gray-800 rounded-lg p-4'>
          <h2 className='text-lg font-semibold mb-3'>Quick Tests</h2>
          <div className='flex gap-3'>
            <button
              onClick={() => {
                fetch(process.env.NEXT_PUBLIC_API_URL + '/health', {
                  credentials: 'include',
                })
                  .then((res) => res.json())
                  .then((data) => addLog(`✅ Health: ${JSON.stringify(data)}`))
                  .catch((err) => addLog(`❌ Health error: ${err.message}`))
              }}
              className='bg-green-600 hover:bg-green-700 px-4 py-2 rounded'
            >
              Test API Health
            </button>

            <button
              onClick={() => router.push('/messages')}
              className='bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded'
            >
              Go to Messages
            </button>

            <button
              onClick={() => window.location.reload()}
              className='bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded'
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
