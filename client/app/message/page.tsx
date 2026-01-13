// // app/messages/page.tsx - COMPLETELY FIXED VERSION
// 'use client'

// import React, { useState, useEffect, useRef, useCallback } from 'react'
// import { useDispatch, useSelector } from 'react-redux'
// import Head from 'next/head'
// import { useSearchParams, useRouter } from 'next/navigation'
// import {
//   getMatchesRequest,
//   getMessagesRequest,
//   sendMessageRequest,
//   sendMessageOptimistic,
//   setCurrentMatch,
//   markMessagesReadRequest,
//   clearError,
//   newMessageReceived,
// } from '../../store/slices/messageSlice'
// import { RootState, AppDispatch } from '../../store/store'
// import { checkAuthRequest } from '../../store/slices/authSlice'
// import { webSocketService } from '../../store/services/websocket'

// const MessagesPage: React.FC = () => {
//   const searchParams = useSearchParams()
//   const router = useRouter()
//   const dispatch = useDispatch<AppDispatch>()

//   const { matches, currentMatch, messages, loading, error } = useSelector(
//     (state: RootState) => state.messages
//   )

//   const { user: authUser, checkingAuth } = useSelector(
//     (state: RootState) => state.auth
//   )

//   const currentUserId =
//     authUser?.id?.toString() || authUser?._id?.toString() || ''

//   console.log('🔵 Messages Page - Current User ID:', currentUserId)

//   const [messageInput, setMessageInput] = useState('')
//   const [sendingMessages, setSendingMessages] = useState<{
//     [key: string]: boolean
//   }>({})
//   const messagesEndRef = useRef<HTMLDivElement>(null)

//   // WebSocket state
//   const [webSocketConnected, setWebSocketConnected] = useState(false)
//   const [webSocketId, setWebSocketId] = useState<string | null>(null)
//   const [connectionStatus, setConnectionStatus] = useState('disconnected')

//   // Polling refs
//   const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
//   const initialMessagesLoadedRef = useRef<string | null>(null)
//   const isPollingRef = useRef(false)

//   const matchIdFromUrl = searchParams.get('matchId')

//   // ============ WEBSOCKET MANAGEMENT ============
//   useEffect(() => {
//     if (!authUser || checkingAuth) return

//     console.log('🔌 Setting up WebSocket...')

//     // Initialize WebSocket connection
//     const initWebSocket = async () => {
//       try {
//         setConnectionStatus('connecting')
//         const connected = await webSocketService.connect()

//         if (connected) {
//           setConnectionStatus('connected')
//           setWebSocketConnected(true)
//           setWebSocketId(webSocketService.getSocket()?.id || null)
//         } else {
//           setConnectionStatus('failed')
//           setWebSocketConnected(false)
//           // Start polling as fallback
//           if (currentMatch) {
//             startPolling(currentMatch._id)
//           }
//         }
//       } catch (error) {
//         console.error('❌ WebSocket initialization error:', error)
//         setConnectionStatus('error')
//         setWebSocketConnected(false)
//       }
//     }

//     initWebSocket()

//     // Listen for WebSocket connection changes
//     const unsubscribeConnection = webSocketService.onConnectionChange(
//       (connected: any) => {
//         console.log('🔌 WebSocket connection changed:', connected)
//         setWebSocketConnected(connected)
//         setWebSocketId(webSocketService.getSocket()?.id || null)
//         setConnectionStatus(connected ? 'connected' : 'disconnected')

//         if (connected) {
//           // Stop polling when WebSocket connects
//           stopPolling()

//           // Join current match room
//           if (currentMatch) {
//             webSocketService.joinMatch(currentMatch._id)
//           }
//         } else if (currentMatch) {
//           // Start polling when WebSocket disconnects
//           startPolling(currentMatch._id)
//         }
//       }
//     )

//     // Listen for new messages
//     const unsubscribeMessages = webSocketService.onNewMessage((message) => {
//       console.log('📩 Received WebSocket message:', {
//         id: message._id,
//         matchId: message.matchId,
//         sender: message.sender,
//       })

//       dispatch(newMessageReceived(message))

//       // Scroll to bottom
//       scrollToBottom()
//     })

//     return () => {
//       console.log('🧹 Cleaning up WebSocket listeners')
//       unsubscribeConnection()
//       unsubscribeMessages()
//       stopPolling()
//     }
//   }, [authUser, checkingAuth, currentMatch, dispatch])

//   // Join/leave match room when currentMatch changes
//   useEffect(() => {
//     if (!currentMatch || !webSocketConnected) return

//     console.log(`🚪 Auto-joining match room: ${currentMatch._id}`)
//     webSocketService.joinMatch(currentMatch._id)

//     return () => {
//       console.log(`🚪 Auto-leaving match room: ${currentMatch._id}`)
//       webSocketService.leaveMatch(currentMatch._id)
//     }
//   }, [currentMatch?._id, webSocketConnected])

//   // ============ AUTHENTICATION ============
//   useEffect(() => {
//     if (!authUser && !checkingAuth) {
//       console.log('🔐 Checking authentication...')
//       dispatch(checkAuthRequest())
//     }
//   }, [dispatch, authUser, checkingAuth])

//   // ============ LOAD MATCHES ============
//   useEffect(() => {
//     if (authUser && !checkingAuth) {
//       console.log('📨 Loading matches...')
//       dispatch(getMatchesRequest())
//     }
//   }, [dispatch, authUser, checkingAuth])

//   // ============ HANDLE URL MATCH ID ============
//   useEffect(() => {
//     if (matchIdFromUrl && matches.length > 0) {
//       const match = matches.find((m) => m._id === matchIdFromUrl)
//       if (match && (!currentMatch || currentMatch._id !== matchIdFromUrl)) {
//         console.log('🎯 Selecting match from URL:', matchIdFromUrl)
//         dispatch(setCurrentMatch(match))
//       }
//     }
//   }, [matchIdFromUrl, matches, dispatch, currentMatch])

//   // ============ LOAD INITIAL MESSAGES ============
//   useEffect(() => {
//     if (
//       currentMatch &&
//       authUser &&
//       initialMessagesLoadedRef.current !== currentMatch._id
//     ) {
//       console.log(`📱 Loading initial messages for match: ${currentMatch._id}`)

//       initialMessagesLoadedRef.current = currentMatch._id

//       // Load messages
//       dispatch(getMessagesRequest({ matchId: currentMatch._id }))
//       dispatch(markMessagesReadRequest(currentMatch._id))

//       // Update URL
//       const params = new URLSearchParams(searchParams.toString())
//       params.set('matchId', currentMatch._id)
//       router.replace(`?${params.toString()}`, { scroll: false })

//       // Start polling only if WebSocket is not connected
//       if (!webSocketConnected) {
//         console.log('🔄 WebSocket not connected, starting polling...')
//         startPolling(currentMatch._id)
//       }
//     }
//   }, [
//     currentMatch,
//     authUser,
//     dispatch,
//     router,
//     searchParams,
//     webSocketConnected,
//   ])

//   // ============ POLLING FUNCTIONS (FALLBACK) ============
//   const stopPolling = useCallback(() => {
//     if (pollIntervalRef.current) {
//       console.log('🛑 Stopping polling')
//       clearInterval(pollIntervalRef.current)
//       pollIntervalRef.current = null
//       isPollingRef.current = false
//     }
//   }, [])

//   const startPolling = useCallback(
//     (matchId: string) => {
//       if (!matchId || isPollingRef.current) return

//       console.log(`🔄 Starting polling for match: ${matchId}`)
//       isPollingRef.current = true

//       const pollMessages = async () => {
//         try {
//           const response = await fetch(
//             `${
//               process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
//             }/messages/${matchId}`,
//             {
//               credentials: 'include',
//               headers: { 'Content-Type': 'application/json' },
//             }
//           )

//           if (response.ok) {
//             const data = await response.json()
//             if (data.success && data.messages) {
//               // Find new messages
//               const existingIds = new Set(messages.map((msg) => msg._id))
//               const newMessages = data.messages.filter(
//                 (msg: any) =>
//                   !existingIds.has(msg._id) &&
//                   !msg._id?.startsWith('temp-') &&
//                   !msg._id?.startsWith('socket-')
//               )

//               if (newMessages.length > 0) {
//                 console.log(
//                   `📩 Found ${newMessages.length} new messages via polling`
//                 )
//                 newMessages.forEach((msg: any) => {
//                   dispatch(newMessageReceived(msg))
//                 })
//                 scrollToBottom()
//               }
//             }
//           }
//         } catch (error) {
//           console.error('❌ Polling error:', error)
//         }
//       }

//       // Poll immediately and then every 5 seconds
//       pollMessages()
//       pollIntervalRef.current = setInterval(pollMessages, 5000)
//     },
//     [messages, dispatch]
//   )

//   // const sendMessage = async () => {
//   //   if (!messageInput.trim() || !currentMatch || !currentUserId || !authUser)
//   //     return

//   //   const content = messageInput.trim()
//   //   setMessageInput('')

//   //   const tempId = `temp-${Date.now()}-${Math.random()
//   //     .toString(36)
//   //     .substr(2, 9)}`

//   //   console.log(`💬 Sending message with temp ID: ${tempId}`)

//   //   // Mark this message as sending
//   //   setSendingMessages((prev) => ({ ...prev, [tempId]: true }))

//   //   // 1. IMMEDIATELY: Add optimistic message to Redux (shows instantly)
//   //   dispatch(
//   //     sendMessageOptimistic({
//   //       tempId,
//   //       matchId: currentMatch._id,
//   //       content,
//   //       sender: currentUserId,
//   //       senderId: {
//   //         _id: currentUserId,
//   //         name: authUser.name || 'You',
//   //         photos: authUser.photos || [],
//   //         age: authUser.age,
//   //       },
//   //     })
//   //   )

//   //   // 2. AFTER UI UPDATE: Scroll to bottom
//   //   scrollToBottom()

//   //   try {
//   //     // 3. Try to send via WebSocket first (REAL-TIME)
//   //     if (webSocketService.isConnected()) {
//   //       console.log('📤 Sending via WebSocket...')
//   //       const success = await webSocketService.sendMessage(
//   //         currentMatch._id,
//   //         content
//   //       )

//   //       if (success) {
//   //         console.log('✅ Message sent via WebSocket')
//   //       } else {
//   //         throw new Error('WebSocket send failed')
//   //       }
//   //     } else {
//   //       console.log('⚠️ WebSocket not connected, sending via HTTP...')
//   //       // Fallback to HTTP
//   //       dispatch(
//   //         sendMessageRequest({
//   //           matchId: currentMatch._id,
//   //           content,
//   //         })
//   //       )
//   //     }

//   //     // Mark as not sending after delay (optimistic)
//   //     setTimeout(() => {
//   //       setSendingMessages((prev) => ({ ...prev, [tempId]: false }))
//   //     }, 2000)
//   //   } catch (error: any) {
//   //     console.error('❌ Failed to send message:', error)

//   //     // Mark as failed
//   //     setSendingMessages((prev) => ({ ...prev, [tempId]: false }))

//   //     // Try HTTP as final fallback
//   //     console.log('🔄 Trying HTTP as fallback...')
//   //     dispatch(
//   //       sendMessageRequest({
//   //         matchId: currentMatch._id,
//   //         content,
//   //       })
//   //     )
//   //   }
//   // }

//   // SIMPLIFIED sendMessage function (no optimistic messages)
//   const sendMessage = async () => {
//     if (!messageInput.trim() || !currentMatch || !currentUserId || !authUser)
//       return

//     const content = messageInput.trim()
//     setMessageInput('')

//     console.log(`💬 Sending message: "${content.substring(0, 30)}..."`)

//     try {
//       // 1. Try to send via WebSocket first
//       if (webSocketService.isConnected()) {
//         console.log('📤 Sending via WebSocket...')
//         const success = await webSocketService.sendMessage(
//           currentMatch._id,
//           content
//         )

//         if (success) {
//           console.log('✅ Message sent via WebSocket')
//           // The WebSocket response will add the message to Redux
//           return
//         }
//       }

//       // 2. Fallback to HTTP
//       console.log('⚠️ Using HTTP fallback...')
//       dispatch(
//         sendMessageRequest({
//           matchId: currentMatch._id,
//           content,
//         })
//       )
//     } catch (error: any) {
//       console.error('❌ Failed to send message:', error)
//     }
//   }

//   // ============ HELPER FUNCTIONS ============
//   const isOptimisticMessage = (message: any) => {
//     return message._id?.startsWith('temp-') || message.isOptimistic
//   }

//   const scrollToBottom = () => {
//     setTimeout(() => {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//     }, 100)
//   }

//   const formatTime = (dateString: string) => {
//     const date = new Date(dateString)
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//   }

//   const handleSelectMatch = (match: any) => {
//     console.log('👆 Selecting match:', match._id)
//     dispatch(setCurrentMatch(match))

//     const params = new URLSearchParams(searchParams.toString())
//     params.set('matchId', match._id)
//     router.replace(`?${params.toString()}`, { scroll: false })
//   }

//   const handleBack = () => {
//     dispatch(setCurrentMatch(null))
//     const params = new URLSearchParams(searchParams.toString())
//     params.delete('matchId')
//     router.replace(`?${params.toString()}`, { scroll: false })
//   }

//   const reconnectWebSocket = async () => {
//     console.log('🔌 Manual WebSocket reconnection...')
//     setConnectionStatus('connecting')

//     const connected = await webSocketService.connect()
//     if (connected) {
//       console.log('✅ Manual reconnection successful')
//       setConnectionStatus('connected')
//     } else {
//       console.log('❌ Manual reconnection failed')
//       setConnectionStatus('failed')
//     }
//   }

//   // ============ RENDER LOGIC ============
//   if (checkingAuth) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Checking authentication...</p>
//         </div>
//       </div>
//     )
//   }

//   if (!authUser) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Please log in to continue...</p>
//           <button
//             onClick={() => router.push('/login')}
//             className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
//           >
//             Go to Login
//           </button>
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='text-red-500 mb-4'>{error}</div>
//           <button
//             onClick={() => dispatch(clearError())}
//             className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     )
//   }

//   // Helper to get other user
//   const getOtherUser = () => {
//     if (!currentMatch) return null
//     if (currentMatch.otherUser) return currentMatch.otherUser
//     if (currentMatch.users) {
//       return currentMatch.users.find(
//         (user: any) => user && user._id && user._id.toString() !== currentUserId
//       )
//     }
//     return null
//   }

//   const otherUser = getOtherUser()

//   return (
//     <>
//       <Head>
//         <title>Messages | Dating App</title>
//         <meta name='description' content='Chat with your matches' />
//       </Head>

//       {/* Connection Status Banner */}
//       <div
//         className={`px-4 py-2 text-center text-sm font-medium ${
//           connectionStatus === 'connected'
//             ? 'bg-green-100 text-green-800'
//             : connectionStatus === 'connecting'
//             ? 'bg-yellow-100 text-yellow-800'
//             : 'bg-red-100 text-red-800'
//         }`}
//       >
//         {connectionStatus === 'connected' && '✅ Live connection (WebSocket)'}
//         {connectionStatus === 'connecting' && '🔄 Connecting to WebSocket...'}
//         {connectionStatus === 'disconnected' &&
//           '⚠️ Disconnected - Using polling'}
//         {connectionStatus === 'failed' &&
//           '❌ Connection failed - Using polling'}

//         {connectionStatus !== 'connected' && (
//           <button
//             onClick={reconnectWebSocket}
//             className='ml-2 underline hover:no-underline'
//           >
//             Reconnect
//           </button>
//         )}
//       </div>

//       <div className='flex h-screen bg-gray-50'>
//         {/* Left Sidebar - Matches List */}
//         <div className='w-80 bg-white border-r border-gray-200 flex flex-col'>
//           <div className='p-4 border-b'>
//             <h2 className='text-xl font-bold text-gray-800'>Messages</h2>
//             <p className='text-sm text-gray-500 mt-1'>
//               {matches.length}{' '}
//               {matches.length === 1 ? 'conversation' : 'conversations'}
//             </p>
//           </div>

//           <div className='flex-1 overflow-y-auto'>
//             {loading && matches.length === 0 ? (
//               <div className='p-8 text-center'>
//                 <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'></div>
//                 <p className='mt-4 text-gray-600'>Loading conversations...</p>
//               </div>
//             ) : matches.length === 0 ? (
//               <div className='p-8 text-center'>
//                 <div className='text-gray-400 mb-4'>
//                   <svg
//                     className='w-16 h-16 mx-auto'
//                     fill='none'
//                     stroke='currentColor'
//                     viewBox='0 0 24 24'
//                   >
//                     <path
//                       strokeLinecap='round'
//                       strokeLinejoin='round'
//                       strokeWidth={1.5}
//                       d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
//                     />
//                   </svg>
//                 </div>
//                 <p className='text-gray-500'>No matches yet</p>
//                 <p className='text-sm text-gray-400 mt-2'>
//                   Start swiping to find matches!
//                 </p>
//               </div>
//             ) : (
//               matches.map((match: any) => {
//                 const otherUser =
//                   match.otherUser ||
//                   match.users?.find(
//                     (user: any) =>
//                       user && user._id && user._id.toString() !== currentUserId
//                   )

//                 return (
//                   <div
//                     key={match._id}
//                     onClick={() => handleSelectMatch(match)}
//                     className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
//                       currentMatch?._id === match._id
//                         ? 'bg-blue-50'
//                         : 'hover:bg-gray-50'
//                     }`}
//                   >
//                     <div className='flex items-center'>
//                       <div className='relative'>
//                         <img
//                           src={
//                             otherUser?.photos?.[0]
//                               ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${otherUser.photos[0]}`
//                               : '/default-avatar.png'
//                           }
//                           alt={otherUser?.name || 'User'}
//                           className='w-12 h-12 rounded-full object-cover'
//                         />
//                         {match.unreadCount > 0 && (
//                           <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
//                             {match.unreadCount}
//                           </span>
//                         )}
//                       </div>
//                       <div className='ml-3 flex-1 min-w-0'>
//                         <div className='flex justify-between items-start'>
//                           <h3 className='font-semibold text-gray-800 truncate'>
//                             {otherUser?.name || 'Unknown'},{' '}
//                             {otherUser?.age || ''}
//                           </h3>
//                           {match.lastMessageAt && (
//                             <span className='text-xs text-gray-400 whitespace-nowrap'>
//                               {formatTime(match.lastMessageAt)}
//                             </span>
//                           )}
//                         </div>
//                         <p className='text-sm text-gray-600 truncate mt-1'>
//                           {match.lastMessage || 'Start a conversation'}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )
//               })
//             )}
//           </div>
//         </div>

//         {/* Right Side - Chat Area */}
//         <div className='flex-1 flex flex-col'>
//           {currentMatch ? (
//             <>
//               {/* Chat Header */}
//               <div className='bg-white border-b border-gray-200 p-4'>
//                 <div className='flex items-center'>
//                   <button
//                     onClick={handleBack}
//                     className='md:hidden mr-3 text-gray-500 hover:text-gray-700'
//                   >
//                     <svg
//                       className='w-6 h-6'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={2}
//                         d='M15 19l-7-7 7-7'
//                       />
//                     </svg>
//                   </button>
//                   <img
//                     src={
//                       otherUser?.photos?.[0]
//                         ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${otherUser.photos[0]}`
//                         : '/default-avatar.png'
//                     }
//                     alt={otherUser?.name || 'User'}
//                     className='w-10 h-10 rounded-full object-cover'
//                   />
//                   <div className='ml-3'>
//                     <h3 className='font-semibold text-gray-800'>
//                       {otherUser?.name || 'Unknown'}, {otherUser?.age || ''}
//                     </h3>
//                     <div className='flex items-center gap-2'>
//                       <div
//                         className={`w-2 h-2 rounded-full ${
//                           webSocketConnected
//                             ? 'bg-green-500 animate-pulse'
//                             : 'bg-gray-400'
//                         }`}
//                       ></div>
//                       <p className='text-sm text-gray-500'>
//                         {webSocketConnected ? 'Online' : 'Offline'}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Messages Container */}
//               <div className='flex-1 overflow-y-auto p-4 bg-gray-50'>
//                 {loading ? (
//                   <div className='flex items-center justify-center h-full'>
//                     <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
//                   </div>
//                 ) : messages.length === 0 ? (
//                   <div className='flex flex-col items-center justify-center h-full text-center'>
//                     <div className='text-gray-400 mb-4'>
//                       <svg
//                         className='w-16 h-16'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={1.5}
//                           d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
//                         />
//                       </svg>
//                     </div>
//                     <h3 className='text-lg font-semibold text-gray-700 mb-2'>
//                       No messages yet
//                     </h3>
//                     <p className='text-gray-500'>
//                       Send a message to start the conversation!
//                     </p>
//                   </div>
//                 ) : (
//                   <div className='space-y-4'>
//                     {messages.map((message: any, index: number) => {
//                       const isCurrentUser = message.sender === currentUserId
//                       const isWebSocket = message._id?.startsWith('socket-')

//                       return (
//                         <div
//                           key={message._id || index}
//                           className={`flex ${
//                             isCurrentUser ? 'justify-end' : 'justify-start'
//                           }`}
//                         >
//                           <div
//                             className={`max-w-[70%] rounded-2xl px-4 py-3 ${
//                               isCurrentUser
//                                 ? 'bg-blue-500 text-white rounded-br-none'
//                                 : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
//                             }`}
//                           >
//                             {!isCurrentUser && message.senderId?.name && (
//                               <p className='text-xs font-semibold text-gray-600 mb-1'>
//                                 {message.senderId.name}
//                               </p>
//                             )}

//                             <p className='break-words'>{message.content}</p>

//                             <div
//                               className={`text-xs mt-1 flex items-center justify-between ${
//                                 isCurrentUser
//                                   ? 'text-blue-100'
//                                   : 'text-gray-400'
//                               }`}
//                             >
//                               <span>{formatTime(message.createdAt)}</span>
//                               {isCurrentUser && (
//                                 <span className='ml-2'>
//                                   {message.isRead ? '✓✓ Read' : '✓ Sent'}
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       )
//                     })}
//                     <div ref={messagesEndRef} />
//                   </div>
//                 )}
//               </div>

//               {/* Message Input */}
//               <div className='bg-white border-t border-gray-200 p-4'>
//                 <div className='flex items-center'>
//                   <input
//                     type='text'
//                     value={messageInput}
//                     onChange={(e) => setMessageInput(e.target.value)}
//                     onKeyPress={(e) => {
//                       if (e.key === 'Enter' && !e.shiftKey) {
//                         e.preventDefault()
//                         sendMessage()
//                       }
//                     }}
//                     placeholder='Type a message...'
//                     className='flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
//                   />
//                   <button
//                     onClick={sendMessage}
//                     disabled={!messageInput.trim()}
//                     className='ml-3 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
//                   >
//                     <svg
//                       className='w-5 h-5'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={2}
//                         d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
//                       />
//                     </svg>
//                   </button>
//                 </div>
//                 <div className='mt-2 text-xs text-gray-500 text-center'>
//                   {webSocketConnected ? (
//                     <span className='text-green-600'>
//                       ✅ Live WebSocket connection
//                     </span>
//                   ) : (
//                     <span className='text-yellow-600'>
//                       🔄 Using polling (5s intervals)
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </>
//           ) : (
//             <div className='flex-1 flex flex-col items-center justify-center p-8'>
//               <div className='max-w-md text-center'>
//                 <div className='text-gray-400 mb-6'>
//                   <svg
//                     className='w-24 h-24 mx-auto'
//                     fill='none'
//                     stroke='currentColor'
//                     viewBox='0 0 24 24'
//                   >
//                     <path
//                       strokeLinecap='round'
//                       strokeLinejoin='round'
//                       strokeWidth={1.5}
//                       d='M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z'
//                     />
//                   </svg>
//                 </div>
//                 <h2 className='text-2xl font-bold text-gray-700 mb-4'>
//                   Welcome to Messages
//                 </h2>
//                 <p className='text-gray-500 mb-6'>
//                   Select a conversation from the sidebar to start chatting with
//                   your matches.
//                 </p>
//                 <div
//                   className={`p-4 rounded-lg ${
//                     webSocketConnected
//                       ? 'bg-green-50 border border-green-200'
//                       : 'bg-yellow-50 border border-yellow-200'
//                   }`}
//                 >
//                   <p
//                     className={`text-sm ${
//                       webSocketConnected ? 'text-green-700' : 'text-yellow-700'
//                     }`}
//                   >
//                     {webSocketConnected
//                       ? '✅ Real-time chat enabled via WebSocket'
//                       : '🔄 Using polling for messages'}
//                   </p>
//                   {!webSocketConnected && (
//                     <button
//                       onClick={reconnectWebSocket}
//                       className='mt-2 text-sm underline hover:no-underline'
//                     >
//                       Try to connect WebSocket
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   )
// }

// export default MessagesPage

// 'use client'

// import React, { useState, useEffect, useRef, useCallback } from 'react'
// import { useDispatch, useSelector } from 'react-redux'
// import Head from 'next/head'
// import { useSearchParams, useRouter } from 'next/navigation'
// import {
//   getMatchesRequest,
//   getMessagesRequest,
//   sendMessageRequest,
//   sendMessageOptimistic,
//   setCurrentMatch,
//   markMessagesReadRequest,
//   clearError,
//   newMessageReceived,
//   // Add these imports
//   setTypingIndicator,
//   setOnlineStatus,
//   setOnlineStatusBatch,
//   clearTypingIndicator,
// } from '../../store/slices/messageSlice'
// import { RootState, AppDispatch } from '../../store/store'
// import { checkAuthRequest } from '../../store/slices/authSlice'
// import { webSocketService } from '../../store/services/websocket'

// const MessagesPage: React.FC = () => {
//   const searchParams = useSearchParams()
//   const router = useRouter()
//   const dispatch = useDispatch<AppDispatch>()

//   const {
//     matches,
//     currentMatch,
//     messages,
//     loading,
//     error,
//     // Add these from state
//     typingIndicators,
//     onlineStatus,
//   } = useSelector((state: RootState) => state.messages)

//   const { user: authUser, checkingAuth } = useSelector(
//     (state: RootState) => state.auth
//   )

//   const currentUserId =
//     authUser?.id?.toString() || authUser?._id?.toString() || ''

//   const [messageInput, setMessageInput] = useState('')
//   const [isTyping, setIsTyping] = useState(false)
//   const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
//     null
//   )
//   const messagesEndRef = useRef<HTMLDivElement>(null)

//   // WebSocket state
//   const [webSocketConnected, setWebSocketConnected] = useState(false)
//   const [webSocketId, setWebSocketId] = useState<string | null>(null)
//   const [connectionStatus, setConnectionStatus] = useState('disconnected')

//   // Polling refs
//   const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
//   const initialMessagesLoadedRef = useRef<string | null>(null)
//   const isPollingRef = useRef(false)

//   const matchIdFromUrl = searchParams.get('matchId')

//   // Helper to get other user (declare this BEFORE using it)
//   const getOtherUser = () => {
//     if (!currentMatch) return null
//     if (currentMatch.otherUser) return currentMatch.otherUser
//     if (currentMatch.users) {
//       return currentMatch.users.find(
//         (user: any) => user && user._id && user._id.toString() !== currentUserId
//       )
//     }
//     return null
//   }

//   const otherUser = getOtherUser()

//   // Check if other user is typing
//   const isOtherUserTyping = otherUser
//     ? typingIndicators.some(
//         (indicator) =>
//           indicator.userId === otherUser._id &&
//           indicator.matchId === currentMatch?._id &&
//           indicator.isTyping
//       )
//     : false

//   // Get other user's online status
//   const otherUserOnlineStatus = otherUser ? onlineStatus[otherUser._id] : null
//   const isOtherUserOnline = otherUserOnlineStatus?.isOnline || false
//   const otherUserLastSeen =
//     otherUserOnlineStatus?.lastSeen || otherUser?.lastActive

//   // ============ TYPING INDICATOR LOGIC ============
//   const handleTyping = useCallback(() => {
//     if (!currentMatch || !currentUserId || !webSocketService.isConnected())
//       return

//     if (!isTyping) {
//       setIsTyping(true)
//       webSocketService.sendTypingIndicator(currentMatch._id, true)
//     }

//     // Clear previous timeout
//     if (typingTimeout) {
//       clearTimeout(typingTimeout)
//     }

//     // Set new timeout to stop typing indicator after 2 seconds of inactivity
//     const timeout = setTimeout(() => {
//       setIsTyping(false)
//       webSocketService.sendTypingIndicator(currentMatch._id, false)
//     }, 2000)

//     setTypingTimeout(timeout)
//   }, [currentMatch, currentUserId, isTyping, typingTimeout])

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setMessageInput(e.target.value)
//     handleTyping()
//   }

//   // ============ WEBSOCKET MANAGEMENT ============
//   useEffect(() => {
//     if (!authUser || checkingAuth) return

//     console.log('🔌 Setting up WebSocket...')

//     // Initialize WebSocket connection
//     const initWebSocket = async () => {
//       try {
//         setConnectionStatus('connecting')
//         const connected = await webSocketService.connect()

//         if (connected) {
//           setConnectionStatus('connected')
//           setWebSocketConnected(true)
//           setWebSocketId(webSocketService.getSocket()?.id || null)
//         } else {
//           setConnectionStatus('failed')
//           setWebSocketConnected(false)
//           if (currentMatch) {
//             startPolling(currentMatch._id)
//           }
//         }
//       } catch (error) {
//         console.error('❌ WebSocket initialization error:', error)
//         setConnectionStatus('error')
//         setWebSocketConnected(false)
//       }
//     }

//     initWebSocket()

//     // Store unsubscribe callbacks
//     const unsubscribeCallbacks: (() => void)[] = []

//     // Listen for WebSocket connection changes
//     webSocketService.onConnectionChange((connected: boolean) => {
//       console.log('🔌 WebSocket connection changed:', connected)
//       setWebSocketConnected(connected)
//       setWebSocketId(webSocketService.getSocket()?.id || null)
//       setConnectionStatus(connected ? 'connected' : 'disconnected')

//       if (connected) {
//         stopPolling()
//         if (currentMatch) {
//           webSocketService.joinMatch(currentMatch._id)
//         }
//       } else if (currentMatch) {
//         startPolling(currentMatch._id)
//       }
//     })

//     // Listen for new messages
//     const newMessageHandler = (message: any) => {
//       console.log('📩 Received WebSocket message:', {
//         id: message._id,
//         matchId: message.matchId,
//         sender: message.sender,
//       })

//       dispatch(newMessageReceived(message))
//       scrollToBottom()

//       // Mark messages as read if we're viewing this match
//       if (currentMatch?._id === message.matchId) {
//         const unreadMessageIds = messages
//           .filter((msg) => !msg.isRead && msg.sender !== currentUserId)
//           .map((msg) => msg._id)

//         if (unreadMessageIds.length > 0 && currentMatch) {
//           webSocketService.markMessagesAsRead(
//             currentMatch._id,
//             unreadMessageIds
//           )
//         }
//       }
//     }

//     webSocketService.on('new-message', newMessageHandler)

//     // Listen for typing indicators
//     const typingHandler = (data: any) => {
//       console.log('✍️ Received typing indicator:', data)
//       dispatch(
//         setTypingIndicator({
//           userId: data.userId,
//           matchId: data.matchId,
//           isTyping: data.isTyping,
//           name: data.name,
//           user: data.user,
//           timestamp: data.timestamp,
//         })
//       )
//     }

//     webSocketService.on('user-typing', typingHandler)

//     // Listen for online status updates
//     const statusHandler = (data: any) => {
//       console.log('📡 User status changed:', data)
//       dispatch(
//         setOnlineStatus({
//           userId: data.userId,
//           isOnline: data.status === 'online',
//           lastSeen: data.lastSeen,
//           user: data.user,
//         })
//       )
//     }

//     webSocketService.on('user-status', statusHandler)

//     // Listen for online status batch
//     const statusBatchHandler = (statuses: any) => {
//       dispatch(setOnlineStatusBatch(statuses))
//     }

//     webSocketService.on('online-status-batch', statusBatchHandler)

//     // Listen for online users list
//     const onlineUsersHandler = (userIds: string[]) => {
//       // Request batch status for these users
//       if (userIds.length > 0) {
//         webSocketService.checkOnlineStatusBatch(userIds)
//       }
//     }

//     webSocketService.on('online-users', onlineUsersHandler)

//     return () => {
//       console.log('🧹 Cleaning up WebSocket listeners')

//       // Remove event listeners using webSocketService.off()
//       webSocketService.off('new-message', newMessageHandler)
//       webSocketService.off('user-typing', typingHandler)
//       webSocketService.off('user-status', statusHandler)
//       webSocketService.off('online-status-batch', statusBatchHandler)
//       webSocketService.off('online-users', onlineUsersHandler)

//       stopPolling()

//       // Clear typing timeout
//       if (typingTimeout) {
//         clearTimeout(typingTimeout)
//       }

//       // Send stopped typing if currently typing
//       if (isTyping && currentMatch) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       // Leave current match room
//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       // Clear all unsubscribe callbacks
//       unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
//     }
//   }, [
//     authUser,
//     checkingAuth,
//     currentMatch,
//     dispatch,
//     messages,
//     currentUserId,
//     isTyping,
//     typingTimeout,
//   ])

//   // ============ CHECK ONLINE STATUS ============
//   useEffect(() => {
//     if (!currentMatch || !otherUser) return

//     // Check online status for the other user
//     const checkStatus = async () => {
//       if (webSocketService.isConnected()) {
//         webSocketService.checkOnlineStatus(otherUser._id)
//       } else {
//         // Fallback: Use lastActive from match data
//         const match = matches.find((m) => m._id === currentMatch._id)
//         if (match?.otherUser?.lastActive) {
//           dispatch(
//             setOnlineStatus({
//               userId: otherUser._id,
//               isOnline: false,
//               lastSeen: match.otherUser.lastActive,
//               user: otherUser,
//             })
//           )
//         }
//       }
//     }

//     checkStatus()
//   }, [currentMatch, otherUser, dispatch, matches])

//   // ============ AUTHENTICATION ============
//   useEffect(() => {
//     if (!authUser && !checkingAuth) {
//       console.log('🔐 Checking authentication...')
//       dispatch(checkAuthRequest())
//     }
//   }, [dispatch, authUser, checkingAuth])

//   // ============ LOAD MATCHES ============
//   useEffect(() => {
//     if (authUser && !checkingAuth) {
//       console.log('📨 Loading matches...')
//       dispatch(getMatchesRequest())
//     }
//   }, [dispatch, authUser, checkingAuth])

//   // ============ HANDLE URL MATCH ID ============
//   useEffect(() => {
//     if (matchIdFromUrl && matches.length > 0) {
//       const match = matches.find((m) => m._id === matchIdFromUrl)
//       if (match && (!currentMatch || currentMatch._id !== matchIdFromUrl)) {
//         console.log('🎯 Selecting match from URL:', matchIdFromUrl)
//         dispatch(setCurrentMatch(match))
//       }
//     }
//   }, [matchIdFromUrl, matches, dispatch, currentMatch])

//   // ============ LOAD INITIAL MESSAGES ============
//   useEffect(() => {
//     if (
//       currentMatch &&
//       authUser &&
//       initialMessagesLoadedRef.current !== currentMatch._id
//     ) {
//       console.log(`📱 Loading initial messages for match: ${currentMatch._id}`)

//       initialMessagesLoadedRef.current = currentMatch._id

//       // Load messages
//       dispatch(getMessagesRequest({ matchId: currentMatch._id }))
//       dispatch(markMessagesReadRequest(currentMatch._id))

//       // Update URL
//       const params = new URLSearchParams(searchParams.toString())
//       params.set('matchId', currentMatch._id)
//       router.replace(`?${params.toString()}`, { scroll: false })

//       // Join WebSocket room
//       if (webSocketConnected) {
//         webSocketService.joinMatch(currentMatch._id)
//       } else {
//         console.log('🔄 WebSocket not connected, starting polling...')
//         startPolling(currentMatch._id)
//       }
//     }
//   }, [
//     currentMatch,
//     authUser,
//     dispatch,
//     router,
//     searchParams,
//     webSocketConnected,
//   ])

//   // ============ POLLING FUNCTIONS (FALLBACK) ============
//   const stopPolling = useCallback(() => {
//     if (pollIntervalRef.current) {
//       console.log('🛑 Stopping polling')
//       clearInterval(pollIntervalRef.current)
//       pollIntervalRef.current = null
//       isPollingRef.current = false
//     }
//   }, [])

//   const startPolling = useCallback(
//     (matchId: string) => {
//       if (!matchId || isPollingRef.current) return

//       console.log(`🔄 Starting polling for match: ${matchId}`)
//       isPollingRef.current = true

//       const pollMessages = async () => {
//         try {
//           const response = await fetch(
//             `${
//               process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
//             }/api/messages/${matchId}`,
//             {
//               credentials: 'include',
//               headers: { 'Content-Type': 'application/json' },
//             }
//           )

//           if (response.ok) {
//             const data = await response.json()
//             if (data.success && data.messages) {
//               // Find new messages
//               const existingIds = new Set(messages.map((msg) => msg._id))
//               const newMessages = data.messages.filter(
//                 (msg: any) =>
//                   !existingIds.has(msg._id) &&
//                   !msg._id?.startsWith('temp-') &&
//                   !msg._id?.startsWith('socket-')
//               )

//               if (newMessages.length > 0) {
//                 console.log(
//                   `📩 Found ${newMessages.length} new messages via polling`
//                 )
//                 newMessages.forEach((msg: any) => {
//                   dispatch(newMessageReceived(msg))
//                 })
//                 scrollToBottom()
//               }
//             }
//           }
//         } catch (error) {
//           console.error('❌ Polling error:', error)
//         }
//       }

//       // Poll immediately and then every 5 seconds
//       pollMessages()
//       pollIntervalRef.current = setInterval(pollMessages, 5000)
//     },
//     [messages, dispatch]
//   )

//   // ============ SEND MESSAGE FUNCTION ============
//   const sendMessage = async () => {
//     if (!messageInput.trim() || !currentMatch || !currentUserId || !authUser)
//       return

//     const content = messageInput.trim()
//     setMessageInput('')

//     const tempId = `temp-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`

//     console.log(`💬 Sending message with temp ID: ${tempId}`)

//     // Clear typing indicator
//     if (isTyping) {
//       webSocketService.sendTypingIndicator(currentMatch._id, false)
//       setIsTyping(false)
//       if (typingTimeout) {
//         clearTimeout(typingTimeout)
//         setTypingTimeout(null)
//       }
//     }

//     // 1. IMMEDIATELY: Add optimistic message to Redux (shows instantly)
//     dispatch(
//       sendMessageOptimistic({
//         tempId,
//         matchId: currentMatch._id,
//         content,
//         sender: currentUserId,
//         senderId: {
//           _id: currentUserId,
//           name: authUser.name || 'You',
//           photos: authUser.photos || [],
//           age: authUser.age,
//         },
//       })
//     )

//     // 2. AFTER UI UPDATE: Scroll to bottom
//     scrollToBottom()

//     try {
//       // 3. Try to send via WebSocket first (REAL-TIME)
//       if (webSocketService.isConnected()) {
//         console.log('📤 Sending via WebSocket...')
//         const success = await webSocketService.sendMessage(
//           currentMatch._id,
//           content,
//           tempId
//         )

//         if (success) {
//           console.log('✅ Message sent via WebSocket')
//         } else {
//           throw new Error('WebSocket send failed')
//         }
//       } else {
//         console.log('⚠️ WebSocket not connected, sending via HTTP...')
//         // Fallback to HTTP
//         dispatch(
//           sendMessageRequest({
//             matchId: currentMatch._id,
//             content,
//             tempId,
//           })
//         )
//       }
//     } catch (error: any) {
//       console.error('❌ Failed to send message:', error)

//       // Try HTTP as final fallback
//       console.log('🔄 Trying HTTP as fallback...')
//       dispatch(
//         sendMessageRequest({
//           matchId: currentMatch._id,
//           content,
//           tempId,
//         })
//       )
//     }
//   }

//   // ============ HELPER FUNCTIONS ============
//   const scrollToBottom = () => {
//     setTimeout(() => {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//     }, 100)
//   }

//   const formatTime = (dateString: string) => {
//     const date = new Date(dateString)
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//   }

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString)
//     const now = new Date()
//     const diffMs = now.getTime() - date.getTime()
//     const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

//     if (diffDays === 0) return 'Today'
//     if (diffDays === 1) return 'Yesterday'
//     if (diffDays < 7) return `${diffDays} days ago`

//     return date.toLocaleDateString()
//   }

//   const handleSelectMatch = (match: any) => {
//     console.log('👆 Selecting match:', match._id)

//     // Leave previous match room if exists
//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(match))

//     // Join new match room
//     if (webSocketService.isConnected()) {
//       webSocketService.joinMatch(match._id)
//     }

//     const params = new URLSearchParams(searchParams.toString())
//     params.set('matchId', match._id)
//     router.replace(`?${params.toString()}`, { scroll: false })
//   }

//   const handleBack = () => {
//     // Leave current match room
//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(null))
//     const params = new URLSearchParams(searchParams.toString())
//     params.delete('matchId')
//     router.replace(`?${params.toString()}`, { scroll: false })
//   }

//   const reconnectWebSocket = async () => {
//     console.log('🔌 Manual WebSocket reconnection...')
//     setConnectionStatus('connecting')

//     const connected = await webSocketService.connect()
//     if (connected) {
//       console.log('✅ Manual reconnection successful')
//       setConnectionStatus('connected')
//     } else {
//       console.log('❌ Manual reconnection failed')
//       setConnectionStatus('failed')
//     }
//   }

//   // Format last seen time
//   const formatLastSeen = (timestamp: string | undefined) => {
//     if (!timestamp) return 'recently'

//     const date = new Date(timestamp)
//     const now = new Date()
//     const diffMs = now.getTime() - date.getTime()
//     const diffMins = Math.floor(diffMs / 60000)

//     if (diffMins < 1) return 'just now'
//     if (diffMins < 60) return `${diffMins}m ago`

//     const diffHours = Math.floor(diffMins / 60)
//     if (diffHours < 24) return `${diffHours}h ago`

//     const diffDays = Math.floor(diffHours / 24)
//     if (diffDays < 7) return `${diffDays}d ago`

//     return date.toLocaleDateString()
//   }

//   // Group messages by date
//   const groupMessagesByDate = () => {
//     const groups: { [key: string]: any[] } = {}

//     messages.forEach((message) => {
//       const date = new Date(message.createdAt).toDateString()
//       if (!groups[date]) {
//         groups[date] = []
//       }
//       groups[date].push(message)
//     })

//     return groups
//   }

//   // ============ RENDER LOGIC ============
//   if (checkingAuth) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Checking authentication...</p>
//         </div>
//       </div>
//     )
//   }

//   if (!authUser) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Please log in to continue...</p>
//           <button
//             onClick={() => router.push('/login')}
//             className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
//           >
//             Go to Login
//           </button>
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='text-red-500 mb-4'>{error}</div>
//           <button
//             onClick={() => dispatch(clearError())}
//             className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     )
//   }

//   const groupedMessages = groupMessagesByDate()

//   return (
//     <>
//       <Head>
//         <title>Messages | Dating App</title>
//         <meta name='description' content='Chat with your matches' />
//       </Head>

//       {/* Connection Status Banner */}
//       <div
//         className={`px-4 py-2 text-center text-sm font-medium ${
//           connectionStatus === 'connected'
//             ? 'bg-green-100 text-green-800'
//             : connectionStatus === 'connecting'
//             ? 'bg-yellow-100 text-yellow-800'
//             : 'bg-red-100 text-red-800'
//         }`}
//       >
//         {connectionStatus === 'connected' && (
//           <div className='flex items-center justify-center'>
//             <span className='w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse'></span>
//             Live connection (WebSocket)
//           </div>
//         )}
//         {connectionStatus === 'connecting' && '🔄 Connecting to WebSocket...'}
//         {connectionStatus === 'disconnected' &&
//           '⚠️ Disconnected - Using polling'}
//         {connectionStatus === 'failed' &&
//           '❌ Connection failed - Using polling'}

//         {connectionStatus !== 'connected' && (
//           <button
//             onClick={reconnectWebSocket}
//             className='ml-2 underline hover:no-underline'
//           >
//             Reconnect
//           </button>
//         )}
//       </div>

//       <div className='flex h-screen bg-gray-50'>
//         {/* Left Sidebar - Matches List */}
//         <div className='w-80 bg-white border-r border-gray-200 flex flex-col'>
//           <div className='p-4 border-b'>
//             <h2 className='text-xl font-bold text-gray-800'>Messages</h2>
//             <p className='text-sm text-gray-500 mt-1'>
//               {matches.length}{' '}
//               {matches.length === 1 ? 'conversation' : 'conversations'}
//             </p>
//           </div>

//           <div className='flex-1 overflow-y-auto'>
//             {loading && matches.length === 0 ? (
//               <div className='p-8 text-center'>
//                 <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'></div>
//                 <p className='mt-4 text-gray-600'>Loading conversations...</p>
//               </div>
//             ) : matches.length === 0 ? (
//               <div className='p-8 text-center'>
//                 <div className='text-gray-400 mb-4'>
//                   <svg
//                     className='w-16 h-16 mx-auto'
//                     fill='none'
//                     stroke='currentColor'
//                     viewBox='0 0 24 24'
//                   >
//                     <path
//                       strokeLinecap='round'
//                       strokeLinejoin='round'
//                       strokeWidth={1.5}
//                       d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
//                     />
//                   </svg>
//                 </div>
//                 <p className='text-gray-500'>No matches yet</p>
//                 <p className='text-sm text-gray-400 mt-2'>
//                   Start swiping to find matches!
//                 </p>
//               </div>
//             ) : (
//               matches.map((match: any) => {
//                 const matchOtherUser =
//                   match.otherUser ||
//                   match.users?.find(
//                     (user: any) =>
//                       user && user._id && user._id.toString() !== currentUserId
//                   )

//                 const isOnline = matchOtherUser
//                   ? onlineStatus[matchOtherUser._id]?.isOnline
//                   : false
//                 const isTypingInMatch = typingIndicators.some(
//                   (indicator) =>
//                     indicator.userId === matchOtherUser?._id &&
//                     indicator.matchId === match._id &&
//                     indicator.isTyping
//                 )

//                 return (
//                   <div
//                     key={match._id}
//                     onClick={() => handleSelectMatch(match)}
//                     className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
//                       currentMatch?._id === match._id
//                         ? 'bg-blue-50'
//                         : 'hover:bg-gray-50'
//                     }`}
//                   >
//                     <div className='flex items-center'>
//                       <div className='relative'>
//                         <img
//                           src={
//                             matchOtherUser?.photos?.[0]
//                               ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${matchOtherUser.photos[0]}`
//                               : '/default-avatar.png'
//                           }
//                           alt={matchOtherUser?.name || 'User'}
//                           className='w-12 h-12 rounded-full object-cover'
//                         />
//                         {/* Online status indicator */}
//                         {isOnline && (
//                           <span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></span>
//                         )}
//                         {match.unreadCount > 0 && (
//                           <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
//                             {match.unreadCount}
//                           </span>
//                         )}
//                       </div>
//                       <div className='ml-3 flex-1 min-w-0'>
//                         <div className='flex justify-between items-start'>
//                           <h3 className='font-semibold text-gray-800 truncate'>
//                             {matchOtherUser?.name || 'Unknown'},{' '}
//                             {matchOtherUser?.age || ''}
//                           </h3>
//                           {match.lastMessageAt && (
//                             <span className='text-xs text-gray-400 whitespace-nowrap'>
//                               {formatTime(match.lastMessageAt)}
//                             </span>
//                           )}
//                         </div>
//                         <p className='text-sm text-gray-600 truncate mt-1'>
//                           {isTypingInMatch ? (
//                             <span className='text-blue-500 italic'>
//                               typing...
//                             </span>
//                           ) : (
//                             match.lastMessage || 'Start a conversation'
//                           )}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )
//               })
//             )}
//           </div>
//         </div>

//         {/* Right Side - Chat Area */}
//         <div className='flex-1 flex flex-col'>
//           {currentMatch ? (
//             <>
//               {/* Chat Header */}
//               <div className='bg-white border-b border-gray-200 p-4'>
//                 <div className='flex items-center justify-between'>
//                   <div className='flex items-center'>
//                     <button
//                       onClick={handleBack}
//                       className='md:hidden mr-3 text-gray-500 hover:text-gray-700'
//                     >
//                       <svg
//                         className='w-6 h-6'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M15 19l-7-7 7-7'
//                         />
//                       </svg>
//                     </button>
//                     <div className='relative'>
//                       <img
//                         src={
//                           otherUser?.photos?.[0]
//                             ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${otherUser.photos[0]}`
//                             : '/default-avatar.png'
//                         }
//                         alt={otherUser?.name || 'User'}
//                         className='w-10 h-10 rounded-full object-cover'
//                       />
//                       {/* Online status indicator in chat header */}
//                       {isOtherUserOnline ? (
//                         <span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></span>
//                       ) : (
//                         <span className='absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white rounded-full'></span>
//                       )}
//                     </div>
//                     <div className='ml-3'>
//                       <h3 className='font-semibold text-gray-800'>
//                         {otherUser?.name || 'Unknown'}, {otherUser?.age || ''}
//                       </h3>
//                       <div className='flex items-center gap-2'>
//                         {isOtherUserTyping ? (
//                           <div className='flex items-center gap-1'>
//                             <div className='flex gap-1'>
//                               <div className='w-1 h-1 bg-gray-500 rounded-full animate-bounce'></div>
//                               <div
//                                 className='w-1 h-1 bg-gray-500 rounded-full animate-bounce'
//                                 style={{ animationDelay: '0.1s' }}
//                               ></div>
//                               <div
//                                 className='w-1 h-1 bg-gray-500 rounded-full animate-bounce'
//                                 style={{ animationDelay: '0.2s' }}
//                               ></div>
//                             </div>
//                             <p className='text-sm text-gray-500'>typing...</p>
//                           </div>
//                         ) : isOtherUserOnline ? (
//                           <div className='flex items-center gap-1'>
//                             <span className='w-2 h-2 bg-green-500 rounded-full'></span>
//                             <p className='text-sm text-green-500'>Online</p>
//                           </div>
//                         ) : (
//                           <p className='text-sm text-gray-500'>
//                             Last active {formatLastSeen(otherUserLastSeen)}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                   <div className='flex items-center gap-2'>
//                     <div
//                       className={`w-2 h-2 rounded-full ${
//                         webSocketConnected
//                           ? 'bg-green-500 animate-pulse'
//                           : 'bg-gray-400'
//                       }`}
//                     ></div>
//                     <p className='text-sm text-gray-500'>
//                       {webSocketConnected ? 'Live' : 'Polling'}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Messages Container */}
//               <div className='flex-1 overflow-y-auto p-4 bg-gray-50'>
//                 {loading ? (
//                   <div className='flex items-center justify-center h-full'>
//                     <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
//                   </div>
//                 ) : messages.length === 0 ? (
//                   <div className='flex flex-col items-center justify-center h-full text-center'>
//                     <div className='text-gray-400 mb-4'>
//                       <svg
//                         className='w-16 h-16'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={1.5}
//                           d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
//                         />
//                       </svg>
//                     </div>
//                     <h3 className='text-lg font-semibold text-gray-700 mb-2'>
//                       No messages yet
//                     </h3>
//                     <p className='text-gray-500'>
//                       Send a message to start the conversation!
//                     </p>
//                   </div>
//                 ) : (
//                   <div className='space-y-6'>
//                     {Object.entries(groupedMessages).map(
//                       ([date, dateMessages]) => (
//                         <div key={date}>
//                           <div className='flex items-center justify-center my-4'>
//                             <div className='bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full'>
//                               {formatDate(dateMessages[0].createdAt)}
//                             </div>
//                           </div>
//                           <div className='space-y-4'>
//                             {dateMessages.map((message: any, index: number) => {
//                               const isCurrentUser =
//                                 message.sender === currentUserId
//                               const isOptimistic =
//                                 message.isOptimistic ||
//                                 message._id?.startsWith('temp-')

//                               return (
//                                 <div
//                                   key={message._id || index}
//                                   className={`flex ${
//                                     isCurrentUser
//                                       ? 'justify-end'
//                                       : 'justify-start'
//                                   }`}
//                                 >
//                                   <div
//                                     className={`max-w-[70%] rounded-2xl px-4 py-3 ${
//                                       isCurrentUser
//                                         ? 'bg-blue-500 text-white rounded-br-none'
//                                         : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
//                                     } ${isOptimistic ? 'opacity-80' : ''}`}
//                                   >
//                                     {!isCurrentUser &&
//                                       message.senderId?.name && (
//                                         <p className='text-xs font-semibold text-gray-600 mb-1'>
//                                           {message.senderId.name}
//                                         </p>
//                                       )}

//                                     <p className='break-words'>
//                                       {message.content}
//                                     </p>

//                                     <div
//                                       className={`text-xs mt-1 flex items-center justify-between ${
//                                         isCurrentUser
//                                           ? 'text-blue-100'
//                                           : 'text-gray-400'
//                                       }`}
//                                     >
//                                       <span>
//                                         {formatTime(message.createdAt)}
//                                       </span>
//                                       {isCurrentUser && (
//                                         <span className='ml-2 flex items-center gap-1'>
//                                           {isOptimistic ? (
//                                             <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
//                                           ) : message.isRead ? (
//                                             '✓✓ Read'
//                                           ) : (
//                                             '✓ Sent'
//                                           )}
//                                         </span>
//                                       )}
//                                     </div>
//                                   </div>
//                                 </div>
//                               )
//                             })}
//                           </div>
//                         </div>
//                       )
//                     )}

//                     {/* Typing indicator bubble */}
//                     {isOtherUserTyping && (
//                       <div className='flex justify-start'>
//                         <div className='max-w-[70%] rounded-2xl px-4 py-3 bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'>
//                           <div className='flex items-center gap-1'>
//                             <div className='flex gap-1'>
//                               <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
//                               <div
//                                 className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
//                                 style={{ animationDelay: '0.1s' }}
//                               ></div>
//                               <div
//                                 className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
//                                 style={{ animationDelay: '0.2s' }}
//                               ></div>
//                             </div>
//                             <span className='text-sm text-gray-500 ml-2'>
//                               typing...
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                     <div ref={messagesEndRef} />
//                   </div>
//                 )}
//               </div>

//               {/* Message Input */}
//               <div className='bg-white border-t border-gray-200 p-4'>
//                 <div className='flex items-center'>
//                   <input
//                     type='text'
//                     value={messageInput}
//                     onChange={handleInputChange}
//                     onKeyPress={(e) => {
//                       if (e.key === 'Enter' && !e.shiftKey) {
//                         e.preventDefault()
//                         sendMessage()
//                       }
//                     }}
//                     onBlur={() => {
//                       if (currentMatch && isTyping) {
//                         webSocketService.sendTypingIndicator(
//                           currentMatch._id,
//                           false
//                         )
//                         setIsTyping(false)
//                         if (typingTimeout) {
//                           clearTimeout(typingTimeout)
//                           setTypingTimeout(null)
//                         }
//                       }
//                     }}
//                     placeholder='Type a message...'
//                     className='flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
//                   />
//                   <button
//                     onClick={sendMessage}
//                     disabled={!messageInput.trim()}
//                     className='ml-3 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
//                   >
//                     <svg
//                       className='w-5 h-5'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={2}
//                         d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
//                       />
//                     </svg>
//                   </button>
//                 </div>
//                 <div className='mt-2 text-xs text-gray-500 text-center'>
//                   {webSocketConnected ? (
//                     <div className='flex items-center justify-center gap-2'>
//                       <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
//                       <span className='text-green-600'>
//                         Live WebSocket connection
//                       </span>
//                     </div>
//                   ) : (
//                     <div className='flex items-center justify-center gap-2'>
//                       <span className='w-2 h-2 bg-yellow-500 rounded-full'></span>
//                       <span className='text-yellow-600'>
//                         Using polling (5s intervals)
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </>
//           ) : (
//             <div className='flex-1 flex flex-col items-center justify-center p-8'>
//               <div className='max-w-md text-center'>
//                 <div className='text-gray-400 mb-6'>
//                   <svg
//                     className='w-24 h-24 mx-auto'
//                     fill='none'
//                     stroke='currentColor'
//                     viewBox='0 0 24 24'
//                   >
//                     <path
//                       strokeLinecap='round'
//                       strokeLinejoin='round'
//                       strokeWidth={1.5}
//                       d='M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z'
//                     />
//                   </svg>
//                 </div>
//                 <h2 className='text-2xl font-bold text-gray-700 mb-4'>
//                   Welcome to Messages
//                 </h2>
//                 <p className='text-gray-500 mb-6'>
//                   Select a conversation from the sidebar to start chatting with
//                   your matches.
//                 </p>
//                 <div
//                   className={`p-4 rounded-lg ${
//                     webSocketConnected
//                       ? 'bg-green-50 border border-green-200'
//                       : 'bg-yellow-50 border border-yellow-200'
//                   }`}
//                 >
//                   <p
//                     className={`text-sm ${
//                       webSocketConnected ? 'text-green-700' : 'text-yellow-700'
//                     }`}
//                   >
//                     {webSocketConnected
//                       ? '✅ Real-time chat enabled via WebSocket'
//                       : '🔄 Using polling for messages'}
//                   </p>
//                   {!webSocketConnected && (
//                     <button
//                       onClick={reconnectWebSocket}
//                       className='mt-2 text-sm underline hover:no-underline'
//                     >
//                       Try to connect WebSocket
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   )
// }

// export default MessagesPage

// 'use client'

// import React, { useState, useEffect, useRef, useCallback } from 'react'
// import { useDispatch, useSelector } from 'react-redux'
// import Head from 'next/head'
// import { useSearchParams, useRouter } from 'next/navigation'
// import {
//   getMatchesRequest,
//   getMessagesRequest,
//   sendMessageRequest,
//   sendMessageOptimistic,
//   setCurrentMatch,
//   markMessagesReadRequest,
//   clearError,
//   newMessageReceived,
//   setTypingIndicator,
//   setOnlineStatus,
//   setOnlineStatusBatch,
//   clearTypingIndicator,
//   clearLoading,
//   markMessageAsRead,
//   markMessagesReadSuccess,
// } from '../../store/slices/messageSlice'
// import { RootState, AppDispatch } from '../../store/store'
// import { checkAuthRequest } from '../../store/slices/authSlice'
// import { webSocketService } from '../../store/services/websocket'

// const MessagesPage: React.FC = () => {
//   const searchParams = useSearchParams()
//   const router = useRouter()
//   const dispatch = useDispatch<AppDispatch>()

//   const {
//     matches,
//     currentMatch,
//     messages,
//     loading,
//     error,
//     typingIndicators,
//     onlineStatus,
//   } = useSelector((state: RootState) => state.messages)

//   const { user: authUser, checkingAuth } = useSelector(
//     (state: RootState) => state.auth
//   )

//   const currentUserId =
//     authUser?.id?.toString() || authUser?._id?.toString() || ''

//   const [messageInput, setMessageInput] = useState('')
//   const messagesEndRef = useRef<HTMLDivElement>(null)

//   // WebSocket state
//   const [webSocketConnected, setWebSocketConnected] = useState(false)
//   const [connectionStatus, setConnectionStatus] = useState('disconnected')

//   // Polling refs
//   const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
//   const initialMessagesLoadedRef = useRef<string | null>(null)
//   const isPollingRef = useRef(false)

//   // Typing refs
//   const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
//   const lastTypingSentRef = useRef<number>(0)
//   const isTypingRef = useRef<boolean>(false)

//   const matchIdFromUrl = searchParams.get('matchId')

//   // Helper to get other user
//   const getOtherUser = () => {
//     if (!currentMatch) return null
//     if (currentMatch.otherUser) return currentMatch.otherUser
//     if (currentMatch.users) {
//       return currentMatch.users.find(
//         (user: any) => user && user._id && user._id.toString() !== currentUserId
//       )
//     }
//     return null
//   }

//   const otherUser = getOtherUser()

//   // Check if other user is typing
//   const isOtherUserTyping = otherUser
//     ? typingIndicators.some(
//         (indicator) =>
//           indicator.userId === otherUser._id &&
//           indicator.matchId === currentMatch?._id &&
//           indicator.isTyping &&
//           // Only show if typing was within last 3 seconds
//           new Date().getTime() - new Date(indicator.timestamp).getTime() < 3000
//       )
//     : false

//   // Get other user's online status
//   const otherUserOnlineStatus = otherUser ? onlineStatus[otherUser._id] : null
//   const isOtherUserOnline = otherUserOnlineStatus?.isOnline || false
//   const otherUserLastSeen =
//     otherUserOnlineStatus?.lastSeen || otherUser?.lastActive

//   // ============ TYPING INDICATOR LOGIC ============
//   const sendTypingIndicator = useCallback(
//     (isTypingValue: boolean) => {
//       if (!currentMatch || !currentUserId || !webSocketService.isConnected())
//         return

//       // Throttle typing events (max once per second)
//       const now = Date.now()
//       if (isTypingValue && now - lastTypingSentRef.current < 1000) {
//         return
//       }

//       console.log('✍️ Sending typing indicator:', {
//         isTyping: isTypingValue,
//         matchId: currentMatch._id,
//       })

//       webSocketService.sendTypingIndicator(currentMatch._id, isTypingValue)
//       lastTypingSentRef.current = now
//       isTypingRef.current = isTypingValue
//     },
//     [currentMatch, currentUserId]
//   )

//   const handleTyping = useCallback(() => {
//     if (!currentMatch || !currentUserId) return

//     // Clear any existing timeout
//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current)
//     }

//     // Send "typing started" if not already typing
//     if (!isTypingRef.current) {
//       sendTypingIndicator(true)
//     }

//     // Set timeout to send "typing stopped" after 2 seconds of inactivity
//     typingTimeoutRef.current = setTimeout(() => {
//       if (isTypingRef.current) {
//         sendTypingIndicator(false)
//       }
//     }, 2000)
//   }, [currentMatch, currentUserId, sendTypingIndicator])

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value
//     setMessageInput(value)

//     // Only trigger typing if there's content
//     if (value.trim().length > 0) {
//       handleTyping()
//     } else if (isTypingRef.current) {
//       // If input is cleared, stop typing
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   // ============ WEBSOCKET MANAGEMENT ============
//   useEffect(() => {
//     if (!authUser || checkingAuth) return

//     console.log('🔌 Setting up WebSocket...')

//     // Initialize WebSocket connection
//     const initWebSocket = async () => {
//       try {
//         setConnectionStatus('connecting')
//         const connected = await webSocketService.connect()

//         if (connected) {
//           setConnectionStatus('connected')
//           setWebSocketConnected(true)

//           // Join current match if exists
//           if (currentMatch) {
//             webSocketService.joinMatch(currentMatch._id)
//           }
//         } else {
//           setConnectionStatus('failed')
//           setWebSocketConnected(false)
//           if (currentMatch) {
//             startPolling(currentMatch._id)
//           }
//         }
//       } catch (error) {
//         console.error('❌ WebSocket initialization error:', error)
//         setConnectionStatus('error')
//         setWebSocketConnected(false)
//       }
//     }

//     initWebSocket()

//     // Store unsubscribe callbacks
//     const unsubscribeCallbacks: (() => void)[] = []

//     // Listen for WebSocket connection changes
//     webSocketService.onConnectionChange((connected: boolean) => {
//       console.log('🔌 WebSocket connection changed:', connected)
//       setWebSocketConnected(connected)
//       setConnectionStatus(connected ? 'connected' : 'disconnected')

//       if (connected) {
//         stopPolling()
//         if (currentMatch) {
//           webSocketService.joinMatch(currentMatch._id)
//         }
//       } else if (currentMatch) {
//         startPolling(currentMatch._id)
//       }
//     })

//     // Listen for new messages
//     const newMessageHandler = (message: any) => {
//       console.log('📩 Received WebSocket message:', {
//         id: message._id,
//         tempId: message.tempId,
//         matchId: message.matchId,
//         sender: message.sender,
//         isRead: message.isRead,
//       })

//       dispatch(newMessageReceived(message))
//       scrollToBottom()

//       // Mark message as read if we're the receiver
//       if (
//         currentMatch?._id === message.matchId &&
//         message.sender !== currentUserId &&
//         !message.isRead &&
//         currentMatch
//       ) {
//         console.log('👁️ Marking message as read:', message._id)
//         webSocketService.markMessagesAsRead(currentMatch._id, [message._id])
//         dispatch(
//           markMessageAsRead({
//             messageId: message._id,
//             matchId: message.matchId,
//           })
//         )
//       }
//     }

//     webSocketService.on('new-message', newMessageHandler)

//     // Listen for typing indicators
//     const typingHandler = (data: any) => {
//       console.log('✍️ Received typing indicator:', data)
//       dispatch(
//         setTypingIndicator({
//           userId: data.userId,
//           matchId: data.matchId,
//           isTyping: data.isTyping,
//           name: data.name,
//           user: data.user,
//           timestamp: data.timestamp || new Date().toISOString(),
//         })
//       )
//     }

//     webSocketService.on('user-typing', typingHandler)

//     // Listen for online status updates
//     const statusHandler = (data: any) => {
//       console.log('📡 User status changed:', data)
//       dispatch(
//         setOnlineStatus({
//           userId: data.userId,
//           isOnline: data.status === 'online',
//           lastSeen: data.lastSeen,
//           user: data.user,
//         })
//       )
//     }

//     webSocketService.on('user-status', statusHandler)

//     // Listen for online status batch
//     const statusBatchHandler = (statuses: any) => {
//       dispatch(setOnlineStatusBatch(statuses))
//     }

//     webSocketService.on('online-status-batch', statusBatchHandler)

//     // Listen for messages read confirmation
//     const messagesReadHandler = (data: any) => {
//       console.log('📖 Messages read confirmation:', data)
//       if (data.userId !== currentUserId && data.matchId === currentMatch?._id) {
//         // Other user read our messages
//         const ourMessages = messages.filter(
//           (msg) => msg.sender === currentUserId && !msg.isRead
//         )
//         if (ourMessages.length > 0) {
//           dispatch(
//             markMessagesReadSuccess({
//               matchId: data.matchId,
//               messageIds: ourMessages.map((msg) => msg._id),
//             })
//           )
//         }
//       }
//     }

//     webSocketService.on('messages-read', messagesReadHandler)

//     // Listen for online users list
//     const onlineUsersHandler = (userIds: string[]) => {
//       if (userIds.length > 0) {
//         webSocketService.checkOnlineStatusBatch(userIds)
//       }
//     }

//     webSocketService.on('online-users', onlineUsersHandler)

//     return () => {
//       console.log('🧹 Cleaning up WebSocket listeners')

//       // Remove event listeners
//       webSocketService.off('new-message', newMessageHandler)
//       webSocketService.off('user-typing', typingHandler)
//       webSocketService.off('user-status', statusHandler)
//       webSocketService.off('online-status-batch', statusBatchHandler)
//       webSocketService.off('messages-read', messagesReadHandler)
//       webSocketService.off('online-users', onlineUsersHandler)

//       stopPolling()

//       // Clear typing timers
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       // Send stopped typing if currently typing
//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       // Leave current match room
//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       // Clear unsubscribe callbacks
//       unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
//     }
//   }, [authUser, checkingAuth, currentMatch, dispatch, messages, currentUserId])

//   // ============ MARK MESSAGES AS READ ============
//   useEffect(() => {
//     if (!currentMatch || !messages.length || !webSocketService.isConnected()) {
//       return
//     }

//     // Get unread messages from other user
//     const unreadMessages = messages.filter(
//       (msg) =>
//         msg.matchId === currentMatch._id &&
//         msg.sender !== currentUserId &&
//         !msg.isRead
//     )

//     if (unreadMessages.length > 0) {
//       const messageIds = unreadMessages.map((msg) => msg._id)
//       console.log('👁️ Marking messages as read:', messageIds.length)

//       webSocketService.markMessagesAsRead(currentMatch._id, messageIds)

//       // Update local state immediately
//       unreadMessages.forEach((msg) => {
//         dispatch(
//           markMessageAsRead({
//             messageId: msg._id,
//             matchId: currentMatch._id,
//           })
//         )
//       })
//     }
//   }, [currentMatch, messages, currentUserId, dispatch, webSocketConnected])

//   // ============ CHECK ONLINE STATUS ============
//   useEffect(() => {
//     if (!currentMatch || !otherUser) return

//     const checkStatus = async () => {
//       if (webSocketService.isConnected()) {
//         webSocketService.checkOnlineStatus(otherUser._id)
//       } else {
//         // Fallback: Use lastActive from match data
//         const match = matches.find((m) => m._id === currentMatch._id)
//         if (match?.otherUser?.lastActive) {
//           dispatch(
//             setOnlineStatus({
//               userId: otherUser._id,
//               isOnline: false,
//               lastSeen: match.otherUser.lastActive,
//               user: otherUser,
//             })
//           )
//         }
//       }
//     }

//     checkStatus()
//   }, [currentMatch, otherUser, dispatch, matches])

//   // ============ AUTHENTICATION ============
//   useEffect(() => {
//     if (!authUser && !checkingAuth) {
//       console.log('🔐 Checking authentication...')
//       dispatch(checkAuthRequest())
//     }
//   }, [dispatch, authUser, checkingAuth])

//   // ============ LOAD MATCHES ============
//   useEffect(() => {
//     if (authUser && !checkingAuth) {
//       console.log('📨 Loading matches...')
//       dispatch(getMatchesRequest())
//     }
//   }, [dispatch, authUser, checkingAuth])

//   // ============ HANDLE URL MATCH ID ============
//   useEffect(() => {
//     if (matchIdFromUrl && matches.length > 0) {
//       const match = matches.find((m) => m._id === matchIdFromUrl)
//       if (match && (!currentMatch || currentMatch._id !== matchIdFromUrl)) {
//         console.log('🎯 Selecting match from URL:', matchIdFromUrl)
//         dispatch(setCurrentMatch(match))
//       }
//     }
//   }, [matchIdFromUrl, matches, dispatch, currentMatch])

//   // ============ LOAD INITIAL MESSAGES ============
//   useEffect(() => {
//     if (
//       currentMatch &&
//       authUser &&
//       initialMessagesLoadedRef.current !== currentMatch._id
//     ) {
//       console.log(`📱 Loading initial messages for match: ${currentMatch._id}`)

//       initialMessagesLoadedRef.current = currentMatch._id

//       // Load messages
//       dispatch(getMessagesRequest({ matchId: currentMatch._id }))
//       dispatch(markMessagesReadRequest(currentMatch._id))

//       // Update URL
//       const params = new URLSearchParams(searchParams.toString())
//       params.set('matchId', currentMatch._id)
//       router.replace(`?${params.toString()}`, { scroll: false })

//       // Join WebSocket room
//       if (webSocketConnected) {
//         webSocketService.joinMatch(currentMatch._id)
//       } else {
//         console.log('🔄 WebSocket not connected, starting polling...')
//         startPolling(currentMatch._id)
//       }
//     }
//   }, [
//     currentMatch,
//     authUser,
//     dispatch,
//     router,
//     searchParams,
//     webSocketConnected,
//   ])

//   // ============ POLLING FUNCTIONS (FALLBACK) ============
//   const stopPolling = useCallback(() => {
//     if (pollIntervalRef.current) {
//       console.log('🛑 Stopping polling')
//       clearInterval(pollIntervalRef.current)
//       pollIntervalRef.current = null
//       isPollingRef.current = false
//     }
//   }, [])

//   const startPolling = useCallback(
//     (matchId: string) => {
//       if (!matchId || isPollingRef.current) return

//       console.log(`🔄 Starting polling for match: ${matchId}`)
//       isPollingRef.current = true

//       const pollMessages = async () => {
//         try {
//           const response = await fetch(
//             `${
//               process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
//             }/api/messages/${matchId}`,
//             {
//               credentials: 'include',
//               headers: { 'Content-Type': 'application/json' },
//             }
//           )

//           if (response.ok) {
//             const data = await response.json()
//             if (data.success && data.messages) {
//               const existingIds = new Set(messages.map((msg) => msg._id))
//               const newMessages = data.messages.filter(
//                 (msg: any) =>
//                   !existingIds.has(msg._id) && !msg._id?.startsWith('temp-')
//               )

//               if (newMessages.length > 0) {
//                 console.log(
//                   `📩 Found ${newMessages.length} new messages via polling`
//                 )
//                 newMessages.forEach((msg: any) => {
//                   dispatch(newMessageReceived(msg))
//                 })
//                 scrollToBottom()
//               }
//             }
//           }
//         } catch (error) {
//           console.error('❌ Polling error:', error)
//         }
//       }

//       pollMessages()
//       pollIntervalRef.current = setInterval(pollMessages, 5000)
//     },
//     [messages, dispatch]
//   )

//   // ============ SEND MESSAGE FUNCTION ============
//   const sendMessage = async () => {
//     if (!messageInput.trim() || !currentMatch || !currentUserId || !authUser) {
//       console.log('❌ Cannot send message: missing requirements')
//       return
//     }

//     const content = messageInput.trim()
//     setMessageInput('')

//     const tempId = `temp-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`

//     console.log(`💬 Sending message with temp ID: ${tempId}`, {
//       content,
//       matchId: currentMatch._id,
//       currentUserId,
//     })

//     // Clear typing indicator
//     if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     // 1. IMMEDIATELY: Add optimistic message to Redux
//     dispatch(
//       sendMessageOptimistic({
//         tempId,
//         matchId: currentMatch._id,
//         content,
//         sender: currentUserId,
//         senderId: {
//           _id: currentUserId,
//           name: authUser.name || 'You',
//           photos: authUser.photos || [],
//           age: authUser.age,
//         },
//       })
//     )

//     // 2. AFTER UI UPDATE: Scroll to bottom
//     scrollToBottom()

//     try {
//       // 3. Try to send via WebSocket first
//       if (webSocketService.isConnected()) {
//         console.log('📤 Sending via WebSocket...')
//         const success = await webSocketService.sendMessage(
//           currentMatch._id,
//           content,
//           tempId
//         )

//         if (success) {
//           console.log('✅ Message sent via WebSocket')
//         } else {
//           console.log('❌ WebSocket send failed, trying HTTP...')
//           dispatch(
//             sendMessageRequest({
//               matchId: currentMatch._id,
//               content,
//               tempId,
//             })
//           )
//         }
//       } else {
//         console.log('⚠️ WebSocket not connected, sending via HTTP...')
//         dispatch(
//           sendMessageRequest({
//             matchId: currentMatch._id,
//             content,
//             tempId,
//           })
//         )
//       }
//     } catch (error: any) {
//       console.error('❌ Failed to send message:', error)

//       dispatch(
//         sendMessageRequest({
//           matchId: currentMatch._id,
//           content,
//           tempId,
//         })
//       )
//     }
//   }

//   // ============ HELPER FUNCTIONS ============
//   const scrollToBottom = () => {
//     setTimeout(() => {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//     }, 100)
//   }

//   const formatTime = (dateString: string) => {
//     const date = new Date(dateString)
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//   }

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString)
//     const now = new Date()
//     const diffMs = now.getTime() - date.getTime()
//     const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

//     if (diffDays === 0) return 'Today'
//     if (diffDays === 1) return 'Yesterday'
//     if (diffDays < 7) return `${diffDays} days ago`

//     return date.toLocaleDateString()
//   }

//   const handleSelectMatch = (match: any) => {
//     console.log('👆 Selecting match:', match._id)

//     // Clear typing indicator for current match
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     // Leave previous match room if exists
//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(match))

//     // Join new match room
//     if (webSocketService.isConnected()) {
//       webSocketService.joinMatch(match._id)
//     }

//     const params = new URLSearchParams(searchParams.toString())
//     params.set('matchId', match._id)
//     router.replace(`?${params.toString()}`, { scroll: false })
//   }

//   const handleBack = () => {
//     // Clear typing indicator
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     // Leave current match room
//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(null))
//     const params = new URLSearchParams(searchParams.toString())
//     params.delete('matchId')
//     router.replace(`?${params.toString()}`, { scroll: false })
//   }

//   const reconnectWebSocket = async () => {
//     console.log('🔌 Manual WebSocket reconnection...')
//     setConnectionStatus('connecting')

//     const connected = await webSocketService.connect()
//     if (connected) {
//       console.log('✅ Manual reconnection successful')
//       setConnectionStatus('connected')
//     } else {
//       console.log('❌ Manual reconnection failed')
//       setConnectionStatus('failed')
//     }
//   }

//   // Format last seen time
//   const formatLastSeen = (timestamp: string | undefined) => {
//     if (!timestamp) return 'recently'

//     const date = new Date(timestamp)
//     const now = new Date()
//     const diffMs = now.getTime() - date.getTime()
//     const diffMins = Math.floor(diffMs / 60000)

//     if (diffMins < 1) return 'just now'
//     if (diffMins < 60) return `${diffMins}m ago`

//     const diffHours = Math.floor(diffMins / 60)
//     if (diffHours < 24) return `${diffHours}h ago`

//     const diffDays = Math.floor(diffHours / 24)
//     if (diffDays < 7) return `${diffDays}d ago`

//     return date.toLocaleDateString()
//   }

//   // Group messages by date
//   const groupMessagesByDate = () => {
//     const groups: { [key: string]: any[] } = {}

//     messages.forEach((message) => {
//       const date = new Date(message.createdAt).toDateString()
//       if (!groups[date]) {
//         groups[date] = []
//       }
//       groups[date].push(message)
//     })

//     return groups
//   }

//   // Clear input focus typing
//   const handleInputBlur = () => {
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   // Check message read status
//   const getMessageReadStatus = (message: any) => {
//     if (message.sender !== currentUserId) return null

//     // If message is optimistic, show loading
//     if (message.isOptimistic || message._id?.startsWith('temp-')) {
//       return 'loading'
//     }

//     // Check if message is read
//     if (message.isRead) {
//       return 'read'
//     }

//     return 'sent'
//   }

//   // ============ RENDER LOGIC ============
//   if (checkingAuth) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Checking authentication...</p>
//         </div>
//       </div>
//     )
//   }

//   if (!authUser) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Please log in to continue...</p>
//           <button
//             onClick={() => router.push('/login')}
//             className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
//           >
//             Go to Login
//           </button>
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='text-red-500 mb-4'>{error}</div>
//           <button
//             onClick={() => dispatch(clearError())}
//             className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     )
//   }

//   const groupedMessages = groupMessagesByDate()

//   return (
//     <>
//       <Head>
//         <title>Messages | Dating App</title>
//         <meta name='description' content='Chat with your matches' />
//       </Head>

//       {/* Connection Status Banner */}
//       <div
//         className={`px-4 py-2 text-center text-sm font-medium ${
//           connectionStatus === 'connected'
//             ? 'bg-green-100 text-green-800'
//             : connectionStatus === 'connecting'
//             ? 'bg-yellow-100 text-yellow-800'
//             : 'bg-red-100 text-red-800'
//         }`}
//       >
//         {connectionStatus === 'connected' && (
//           <div className='flex items-center justify-center'>
//             <span className='w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse'></span>
//             Live connection (WebSocket)
//           </div>
//         )}
//         {connectionStatus === 'connecting' && '🔄 Connecting to WebSocket...'}
//         {connectionStatus === 'disconnected' &&
//           '⚠️ Disconnected - Using polling'}
//         {connectionStatus === 'failed' &&
//           '❌ Connection failed - Using polling'}

//         {connectionStatus !== 'connected' && (
//           <button
//             onClick={reconnectWebSocket}
//             className='ml-2 underline hover:no-underline'
//           >
//             Reconnect
//           </button>
//         )}
//       </div>

//       <div className='flex h-screen bg-gray-50'>
//         {/* Left Sidebar - Matches List */}
//         <div className='w-80 bg-white border-r border-gray-200 flex flex-col'>
//           <div className='p-4 border-b'>
//             <h2 className='text-xl font-bold text-gray-800'>Messages</h2>
//             <p className='text-sm text-gray-500 mt-1'>
//               {matches.length}{' '}
//               {matches.length === 1 ? 'conversation' : 'conversations'}
//             </p>
//           </div>

//           <div className='flex-1 overflow-y-auto'>
//             {loading && matches.length === 0 ? (
//               <div className='p-8 text-center'>
//                 <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'></div>
//                 <p className='mt-4 text-gray-600'>Loading conversations...</p>
//               </div>
//             ) : matches.length === 0 ? (
//               <div className='p-8 text-center'>
//                 <div className='text-gray-400 mb-4'>
//                   <svg
//                     className='w-16 h-16 mx-auto'
//                     fill='none'
//                     stroke='currentColor'
//                     viewBox='0 0 24 24'
//                   >
//                     <path
//                       strokeLinecap='round'
//                       strokeLinejoin='round'
//                       strokeWidth={1.5}
//                       d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
//                     />
//                   </svg>
//                 </div>
//                 <p className='text-gray-500'>No matches yet</p>
//                 <p className='text-sm text-gray-400 mt-2'>
//                   Start swiping to find matches!
//                 </p>
//               </div>
//             ) : (
//               matches.map((match: any) => {
//                 const matchOtherUser =
//                   match.otherUser ||
//                   match.users?.find(
//                     (user: any) =>
//                       user && user._id && user._id.toString() !== currentUserId
//                   )

//                 const isOnline = matchOtherUser
//                   ? onlineStatus[matchOtherUser._id]?.isOnline
//                   : false
//                 const isTypingInMatch = typingIndicators.some(
//                   (indicator) =>
//                     indicator.userId === matchOtherUser?._id &&
//                     indicator.matchId === match._id &&
//                     indicator.isTyping &&
//                     new Date().getTime() -
//                       new Date(indicator.timestamp).getTime() <
//                       3000
//                 )

//                 return (
//                   <div
//                     key={match._id}
//                     onClick={() => handleSelectMatch(match)}
//                     className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
//                       currentMatch?._id === match._id
//                         ? 'bg-blue-50'
//                         : 'hover:bg-gray-50'
//                     }`}
//                   >
//                     <div className='flex items-center'>
//                       <div className='relative'>
//                         <img
//                           src={
//                             matchOtherUser?.photos?.[0]
//                               ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${matchOtherUser.photos[0]}`
//                               : '/default-avatar.png'
//                           }
//                           alt={matchOtherUser?.name || 'User'}
//                           className='w-12 h-12 rounded-full object-cover'
//                         />
//                         {/* Online status indicator */}
//                         {isOnline && (
//                           <span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></span>
//                         )}
//                         {match.unreadCount > 0 && (
//                           <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
//                             {match.unreadCount}
//                           </span>
//                         )}
//                       </div>
//                       <div className='ml-3 flex-1 min-w-0'>
//                         <div className='flex justify-between items-start'>
//                           <h3 className='font-semibold text-gray-800 truncate'>
//                             {matchOtherUser?.name || 'Unknown'},{' '}
//                             {matchOtherUser?.age || ''}
//                           </h3>
//                           {match.lastMessageAt && (
//                             <span className='text-xs text-gray-400 whitespace-nowrap'>
//                               {formatTime(match.lastMessageAt)}
//                             </span>
//                           )}
//                         </div>
//                         <p className='text-sm text-gray-600 truncate mt-1'>
//                           {isTypingInMatch ? (
//                             <span className='text-blue-500 italic'>
//                               typing...
//                             </span>
//                           ) : (
//                             match.lastMessage || 'Start a conversation'
//                           )}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )
//               })
//             )}
//           </div>
//         </div>

//         {/* Right Side - Chat Area */}
//         <div className='flex-1 flex flex-col'>
//           {currentMatch ? (
//             <>
//               {/* Chat Header */}
//               <div className='bg-white border-b border-gray-200 p-4'>
//                 <div className='flex items-center justify-between'>
//                   <div className='flex items-center'>
//                     <button
//                       onClick={handleBack}
//                       className='md:hidden mr-3 text-gray-500 hover:text-gray-700'
//                     >
//                       <svg
//                         className='w-6 h-6'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M15 19l-7-7 7-7'
//                         />
//                       </svg>
//                     </button>
//                     <div className='relative'>
//                       <img
//                         src={
//                           otherUser?.photos?.[0]
//                             ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${otherUser.photos[0]}`
//                             : '/default-avatar.png'
//                         }
//                         alt={otherUser?.name || 'User'}
//                         className='w-10 h-10 rounded-full object-cover'
//                       />
//                       {isOtherUserOnline ? (
//                         <span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></span>
//                       ) : (
//                         <span className='absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white rounded-full'></span>
//                       )}
//                     </div>
//                     <div className='ml-3'>
//                       <h3 className='font-semibold text-gray-800'>
//                         {otherUser?.name || 'Unknown'}, {otherUser?.age || ''}
//                       </h3>
//                       <div className='flex items-center gap-2'>
//                         {isOtherUserTyping ? (
//                           <div className='flex items-center gap-1'>
//                             <div className='flex gap-1'>
//                               <div className='w-1 h-1 bg-gray-500 rounded-full animate-bounce'></div>
//                               <div
//                                 className='w-1 h-1 bg-gray-500 rounded-full animate-bounce'
//                                 style={{ animationDelay: '0.1s' }}
//                               ></div>
//                               <div
//                                 className='w-1 h-1 bg-gray-500 rounded-full animate-bounce'
//                                 style={{ animationDelay: '0.2s' }}
//                               ></div>
//                             </div>
//                             <p className='text-sm text-gray-500'>typing...</p>
//                           </div>
//                         ) : isOtherUserOnline ? (
//                           <div className='flex items-center gap-1'>
//                             <span className='w-2 h-2 bg-green-500 rounded-full'></span>
//                             <p className='text-sm text-green-500'>Online</p>
//                           </div>
//                         ) : (
//                           <p className='text-sm text-gray-500'>
//                             Last active {formatLastSeen(otherUserLastSeen)}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                   <div className='flex items-center gap-2'>
//                     <div
//                       className={`w-2 h-2 rounded-full ${
//                         webSocketConnected
//                           ? 'bg-green-500 animate-pulse'
//                           : 'bg-gray-400'
//                       }`}
//                     ></div>
//                     <p className='text-sm text-gray-500'>
//                       {webSocketConnected ? 'Live' : 'Polling'}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Messages Container */}
//               <div className='flex-1 overflow-y-auto p-4 bg-gray-50'>
//                 {loading ? (
//                   <div className='flex items-center justify-center h-full'>
//                     <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
//                   </div>
//                 ) : messages.length === 0 ? (
//                   <div className='flex flex-col items-center justify-center h-full text-center'>
//                     <div className='text-gray-400 mb-4'>
//                       <svg
//                         className='w-16 h-16'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={1.5}
//                           d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
//                         />
//                       </svg>
//                     </div>
//                     <h3 className='text-lg font-semibold text-gray-700 mb-2'>
//                       No messages yet
//                     </h3>
//                     <p className='text-gray-500'>
//                       Send a message to start the conversation!
//                     </p>
//                   </div>
//                 ) : (
//                   <div className='space-y-6'>
//                     {Object.entries(groupedMessages).map(
//                       ([date, dateMessages]) => (
//                         <div key={date}>
//                           <div className='flex items-center justify-center my-4'>
//                             <div className='bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full'>
//                               {formatDate(dateMessages[0].createdAt)}
//                             </div>
//                           </div>
//                           <div className='space-y-4'>
//                             {dateMessages.map((message: any, index: number) => {
//                               const isCurrentUser =
//                                 message.sender === currentUserId
//                               const isOptimistic =
//                                 message.isOptimistic ||
//                                 message._id?.startsWith('temp-')
//                               const readStatus = getMessageReadStatus(message)

//                               return (
//                                 <div
//                                   key={message._id || index}
//                                   className={`flex ${
//                                     isCurrentUser
//                                       ? 'justify-end'
//                                       : 'justify-start'
//                                   }`}
//                                 >
//                                   <div
//                                     className={`max-w-[70%] rounded-2xl px-4 py-3 ${
//                                       isCurrentUser
//                                         ? 'bg-blue-500 text-white rounded-br-none'
//                                         : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
//                                     } ${isOptimistic ? 'opacity-80' : ''}`}
//                                   >
//                                     {!isCurrentUser &&
//                                       message.senderId?.name && (
//                                         <p className='text-xs font-semibold text-gray-600 mb-1'>
//                                           {message.senderId.name}
//                                         </p>
//                                       )}

//                                     <p className='break-words'>
//                                       {message.content}
//                                     </p>

//                                     <div
//                                       className={`text-xs mt-1 flex items-center justify-between ${
//                                         isCurrentUser
//                                           ? 'text-blue-100'
//                                           : 'text-gray-400'
//                                       }`}
//                                     >
//                                       <span>
//                                         {formatTime(message.createdAt)}
//                                       </span>
//                                       {isCurrentUser && (
//                                         <span className='ml-2 flex items-center gap-1'>
//                                           {readStatus === 'loading' ? (
//                                             <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
//                                           ) : readStatus === 'read' ? (
//                                             <>
//                                               <span>✓✓</span>
//                                               <span className='ml-1'>Read</span>
//                                             </>
//                                           ) : (
//                                             '✓ Sent'
//                                           )}
//                                         </span>
//                                       )}
//                                     </div>
//                                   </div>
//                                 </div>
//                               )
//                             })}
//                           </div>
//                         </div>
//                       )
//                     )}

//                     {/* Typing indicator bubble */}
//                     {isOtherUserTyping && (
//                       <div className='flex justify-start'>
//                         <div className='max-w-[70%] rounded-2xl px-4 py-3 bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'>
//                           <div className='flex items-center gap-1'>
//                             <div className='flex gap-1'>
//                               <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
//                               <div
//                                 className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
//                                 style={{ animationDelay: '0.1s' }}
//                               ></div>
//                               <div
//                                 className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
//                                 style={{ animationDelay: '0.2s' }}
//                               ></div>
//                             </div>
//                             <span className='text-sm text-gray-500 ml-2'>
//                               typing...
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                     <div ref={messagesEndRef} />
//                   </div>
//                 )}
//               </div>

//               {/* Message Input */}
//               <div className='bg-white border-t border-gray-200 p-4'>
//                 <div className='flex items-center'>
//                   <input
//                     type='text'
//                     value={messageInput}
//                     onChange={handleInputChange}
//                     onBlur={handleInputBlur}
//                     onKeyPress={(e) => {
//                       if (e.key === 'Enter' && !e.shiftKey) {
//                         e.preventDefault()
//                         sendMessage()
//                       }
//                     }}
//                     placeholder='Type a message...'
//                     className='flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
//                   />
//                   <button
//                     onClick={sendMessage}
//                     disabled={!messageInput.trim()}
//                     className='ml-3 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
//                   >
//                     <svg
//                       className='w-5 h-5'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={2}
//                         d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
//                       />
//                     </svg>
//                   </button>
//                 </div>
//                 <div className='mt-2 text-xs text-gray-500 text-center'>
//                   {webSocketConnected ? (
//                     <div className='flex items-center justify-center gap-2'>
//                       <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
//                       <span className='text-green-600'>
//                         Live WebSocket connection
//                       </span>
//                     </div>
//                   ) : (
//                     <div className='flex items-center justify-center gap-2'>
//                       <span className='w-2 h-2 bg-yellow-500 rounded-full'></span>
//                       <span className='text-yellow-600'>
//                         Using polling (5s intervals)
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </>
//           ) : (
//             <div className='flex-1 flex flex-col items-center justify-center p-8'>
//               <div className='max-w-md text-center'>
//                 <div className='text-gray-400 mb-6'>
//                   <svg
//                     className='w-24 h-24 mx-auto'
//                     fill='none'
//                     stroke='currentColor'
//                     viewBox='0 0 24 24'
//                   >
//                     <path
//                       strokeLinecap='round'
//                       strokeLinejoin='round'
//                       strokeWidth={1.5}
//                       d='M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z'
//                     />
//                   </svg>
//                 </div>
//                 <h2 className='text-2xl font-bold text-gray-700 mb-4'>
//                   Welcome to Messages
//                 </h2>
//                 <p className='text-gray-500 mb-6'>
//                   Select a conversation from the sidebar to start chatting with
//                   your matches.
//                 </p>
//                 <div
//                   className={`p-4 rounded-lg ${
//                     webSocketConnected
//                       ? 'bg-green-50 border border-green-200'
//                       : 'bg-yellow-50 border border-yellow-200'
//                   }`}
//                 >
//                   <p
//                     className={`text-sm ${
//                       webSocketConnected ? 'text-green-700' : 'text-yellow-700'
//                     }`}
//                   >
//                     {webSocketConnected
//                       ? '✅ Real-time chat enabled via WebSocket'
//                       : '🔄 Using polling for messages'}
//                   </p>
//                   {!webSocketConnected && (
//                     <button
//                       onClick={reconnectWebSocket}
//                       className='mt-2 text-sm underline hover:no-underline'
//                     >
//                       Try to connect WebSocket
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   )
// }

// export default MessagesPage

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Head from 'next/head'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  getMatchesRequest,
  getMessagesRequest,
  sendMessageRequest,
  sendMessageOptimistic,
  setCurrentMatch,
  markMessagesReadRequest,
  clearError,
  newMessageReceived,
  setTypingIndicator,
  setOnlineStatus,
  setOnlineStatusBatch,
  clearTypingIndicator,
  clearLoading,
  markMessageAsRead,
  markMessagesReadSuccess,
} from '../../store/slices/messageSlice'
import { RootState, AppDispatch } from '../../store/store'
import { checkAuthRequest } from '../../store/slices/authSlice'
import { webSocketService } from '../../store/services/websocket'

const MessagesPage: React.FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const {
    matches,
    currentMatch,
    messages,
    loading,
    error,
    typingIndicators,
    onlineStatus,
  } = useSelector((state: RootState) => state.messages)

  const { user: authUser, checkingAuth } = useSelector(
    (state: RootState) => state.auth
  )

  const currentUserId =
    authUser?.id?.toString() || authUser?._id?.toString() || ''

  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // WebSocket state
  const [webSocketConnected, setWebSocketConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  // Polling refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialMessagesLoadedRef = useRef<string | null>(null)
  const isPollingRef = useRef(false)

  // Typing refs
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingSentRef = useRef<number>(0)
  const isTypingRef = useRef<boolean>(false)

  // Auth state
  const [authInitialized, setAuthInitialized] = useState(false)
  const [authRetryCount, setAuthRetryCount] = useState(0)
  const [checkingAuthLocally, setCheckingAuthLocally] = useState(true)

  const matchIdFromUrl = searchParams.get('matchId')

  // ============ AUTHENTICATION FIX - OPTIMIZED ============
  useEffect(() => {
    // Check if we have a token in cookies
    const checkTokenInCookies = () => {
      const cookies = document.cookie.split('; ')
      const tokenCookie = cookies.find((row) => row.startsWith('token='))
      return !!tokenCookie
    }

    const initializeAuth = async () => {
      // First, check if we're already checking auth
      if (checkingAuth || authUser) {
        setCheckingAuthLocally(false)
        return
      }

      // Check if we have a token in cookies first
      const hasToken = checkTokenInCookies()

      if (!hasToken) {
        console.log('🚫 No token found in cookies, redirecting to login')
        setCheckingAuthLocally(false)
        router.push('/login')
        return
      }

      // We have a token, but no authUser - try to check auth
      try {
        console.log('🔐 Token found, checking authentication...')
        setCheckingAuthLocally(true)

        // Dispatch check auth with retry logic
        await dispatch(checkAuthRequest())

        // Wait a moment for the auth check to complete
        setTimeout(() => {
          setCheckingAuthLocally(false)
          setAuthInitialized(true)
        }, 1000)
      } catch (error) {
        console.error('❌ Auth check error:', error)
        setCheckingAuthLocally(false)
      }
    }

    // Only run once on mount
    if (!authInitialized) {
      initializeAuth()
    }
  }, [dispatch, router, authInitialized])

  // Handle auth state changes
  useEffect(() => {
    // If auth check is complete and we have no user, try one retry
    if (
      !checkingAuth &&
      !checkingAuthLocally &&
      !authUser &&
      authRetryCount < 2
    ) {
      const timer = setTimeout(() => {
        console.log(`🔄 Retry auth check (${authRetryCount + 1}/2)`)
        setAuthRetryCount((prev) => prev + 1)
        dispatch(checkAuthRequest())
      }, 1000)

      return () => clearTimeout(timer)
    }

    // If still no user after retries, redirect to login
    if (
      !checkingAuth &&
      !checkingAuthLocally &&
      !authUser &&
      authRetryCount >= 2
    ) {
      console.log('🚫 Auth failed after retries, redirecting to login')

      const timer = setTimeout(() => {
        router.push('/login')
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [
    checkingAuth,
    checkingAuthLocally,
    authUser,
    authRetryCount,
    dispatch,
    router,
  ])

  // ============ LOAD MATCHES WHEN AUTHENTICATED ============
  useEffect(() => {
    if (authUser && !checkingAuth && !checkingAuthLocally) {
      console.log('✅ User authenticated, loading matches...')
      dispatch(getMatchesRequest())
    }
  }, [authUser, checkingAuth, checkingAuthLocally, dispatch])

  // Helper to get other user
  const getOtherUser = () => {
    if (!currentMatch) return null
    if (currentMatch.otherUser) return currentMatch.otherUser
    if (currentMatch.users) {
      return currentMatch.users.find(
        (user: any) => user && user._id && user._id.toString() !== currentUserId
      )
    }
    return null
  }

  const otherUser = getOtherUser()

  // Check if other user is typing
  const isOtherUserTyping = otherUser
    ? typingIndicators.some(
        (indicator) =>
          indicator.userId === otherUser._id &&
          indicator.matchId === currentMatch?._id &&
          indicator.isTyping &&
          new Date().getTime() - new Date(indicator.timestamp).getTime() < 3000
      )
    : false

  // Get other user's online status
  const otherUserOnlineStatus = otherUser ? onlineStatus[otherUser._id] : null
  const isOtherUserOnline = otherUserOnlineStatus?.isOnline || false
  const otherUserLastSeen =
    otherUserOnlineStatus?.lastSeen || otherUser?.lastActive

  // ============ TYPING INDICATOR LOGIC ============
  const sendTypingIndicator = useCallback(
    (isTypingValue: boolean) => {
      if (!currentMatch || !currentUserId || !webSocketService.isConnected())
        return

      const now = Date.now()
      if (isTypingValue && now - lastTypingSentRef.current < 1000) {
        return
      }

      webSocketService.sendTypingIndicator(currentMatch._id, isTypingValue)
      lastTypingSentRef.current = now
      isTypingRef.current = isTypingValue
    },
    [currentMatch, currentUserId]
  )

  const handleTyping = useCallback(() => {
    if (!currentMatch || !currentUserId) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (!isTypingRef.current) {
      sendTypingIndicator(true)
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        sendTypingIndicator(false)
      }
    }, 2000)
  }, [currentMatch, currentUserId, sendTypingIndicator])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessageInput(value)

    if (value.trim().length > 0) {
      handleTyping()
    } else if (isTypingRef.current) {
      sendTypingIndicator(false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  // ============ WEBSOCKET MANAGEMENT ============
  useEffect(() => {
    if (!authUser || checkingAuth) return

    console.log('🔌 Setting up WebSocket...')

    const initWebSocket = async () => {
      try {
        setConnectionStatus('connecting')
        const connected = await webSocketService.connect()

        if (connected) {
          setConnectionStatus('connected')
          setWebSocketConnected(true)

          if (currentMatch) {
            webSocketService.joinMatch(currentMatch._id)
          }
        } else {
          setConnectionStatus('failed')
          setWebSocketConnected(false)
          if (currentMatch) {
            startPolling(currentMatch._id)
          }
        }
      } catch (error) {
        console.error('❌ WebSocket initialization error:', error)
        setConnectionStatus('error')
        setWebSocketConnected(false)
      }
    }

    initWebSocket()

    const unsubscribeCallbacks: (() => void)[] = []

    webSocketService.onConnectionChange((connected: boolean) => {
      setWebSocketConnected(connected)
      setConnectionStatus(connected ? 'connected' : 'disconnected')

      if (connected) {
        stopPolling()
        if (currentMatch) {
          webSocketService.joinMatch(currentMatch._id)
        }
      } else if (currentMatch) {
        startPolling(currentMatch._id)
      }
    })

    const newMessageHandler = (message: any) => {
      dispatch(newMessageReceived(message))
      scrollToBottom()

      if (
        currentMatch?._id === message.matchId &&
        message.sender !== currentUserId &&
        !message.isRead &&
        currentMatch
      ) {
        webSocketService.markMessagesAsRead(currentMatch._id, [message._id])
        dispatch(
          markMessageAsRead({
            messageId: message._id,
            matchId: message.matchId,
          })
        )
      }
    }

    webSocketService.on('new-message', newMessageHandler)

    const typingHandler = (data: any) => {
      dispatch(
        setTypingIndicator({
          userId: data.userId,
          matchId: data.matchId,
          isTyping: data.isTyping,
          name: data.name,
          user: data.user,
          timestamp: data.timestamp || new Date().toISOString(),
        })
      )
    }

    webSocketService.on('user-typing', typingHandler)

    const statusHandler = (data: any) => {
      dispatch(
        setOnlineStatus({
          userId: data.userId,
          isOnline: data.status === 'online',
          lastSeen: data.lastSeen,
          user: data.user,
        })
      )
    }

    webSocketService.on('user-status', statusHandler)

    const statusBatchHandler = (statuses: any) => {
      dispatch(setOnlineStatusBatch(statuses))
    }

    webSocketService.on('online-status-batch', statusBatchHandler)

    const messagesReadHandler = (data: any) => {
      if (data.userId !== currentUserId && data.matchId === currentMatch?._id) {
        const ourMessages = messages.filter(
          (msg) => msg.sender === currentUserId && !msg.isRead
        )
        if (ourMessages.length > 0) {
          dispatch(
            markMessagesReadSuccess({
              matchId: data.matchId,
              messageIds: ourMessages.map((msg) => msg._id),
            })
          )
        }
      }
    }

    webSocketService.on('messages-read', messagesReadHandler)

    const onlineUsersHandler = (userIds: string[]) => {
      if (userIds.length > 0) {
        webSocketService.checkOnlineStatusBatch(userIds)
      }
    }

    webSocketService.on('online-users', onlineUsersHandler)

    return () => {
      stopPolling()

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      if (
        isTypingRef.current &&
        currentMatch &&
        webSocketService.isConnected()
      ) {
        webSocketService.sendTypingIndicator(currentMatch._id, false)
      }

      if (currentMatch && webSocketService.isConnected()) {
        webSocketService.leaveMatch(currentMatch._id)
      }

      webSocketService.off('new-message', newMessageHandler)
      webSocketService.off('user-typing', typingHandler)
      webSocketService.off('user-status', statusHandler)
      webSocketService.off('online-status-batch', statusBatchHandler)
      webSocketService.off('messages-read', messagesReadHandler)
      webSocketService.off('online-users', onlineUsersHandler)

      unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
    }
  }, [authUser, checkingAuth, currentMatch, dispatch, messages, currentUserId])

  // ============ MARK MESSAGES AS READ ============
  useEffect(() => {
    if (!currentMatch || !messages.length || !webSocketService.isConnected()) {
      return
    }

    const unreadMessages = messages.filter(
      (msg) =>
        msg.matchId === currentMatch._id &&
        msg.sender !== currentUserId &&
        !msg.isRead
    )

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((msg) => msg._id)
      webSocketService.markMessagesAsRead(currentMatch._id, messageIds)

      unreadMessages.forEach((msg) => {
        dispatch(
          markMessageAsRead({
            messageId: msg._id,
            matchId: currentMatch._id,
          })
        )
      })
    }
  }, [currentMatch, messages, currentUserId, dispatch, webSocketConnected])

  // ============ CHECK ONLINE STATUS ============
  useEffect(() => {
    if (!currentMatch || !otherUser) return

    const checkStatus = async () => {
      if (webSocketService.isConnected()) {
        webSocketService.checkOnlineStatus(otherUser._id)
      } else {
        const match = matches.find((m) => m._id === currentMatch._id)
        if (match?.otherUser?.lastActive) {
          dispatch(
            setOnlineStatus({
              userId: otherUser._id,
              isOnline: false,
              lastSeen: match.otherUser.lastActive,
              user: otherUser,
            })
          )
        }
      }
    }

    checkStatus()
  }, [currentMatch, otherUser, dispatch, matches])

  // ============ HANDLE URL MATCH ID ============
  useEffect(() => {
    if (matchIdFromUrl && matches.length > 0) {
      const match = matches.find((m) => m._id === matchIdFromUrl)
      if (match && (!currentMatch || currentMatch._id !== matchIdFromUrl)) {
        dispatch(setCurrentMatch(match))
      }
    }
  }, [matchIdFromUrl, matches, dispatch, currentMatch])

  // ============ LOAD INITIAL MESSAGES ============
  useEffect(() => {
    if (
      currentMatch &&
      authUser &&
      initialMessagesLoadedRef.current !== currentMatch._id
    ) {
      initialMessagesLoadedRef.current = currentMatch._id

      dispatch(getMessagesRequest({ matchId: currentMatch._id }))
      dispatch(markMessagesReadRequest(currentMatch._id))

      const params = new URLSearchParams(searchParams.toString())
      params.set('matchId', currentMatch._id)
      router.replace(`?${params.toString()}`, { scroll: false })

      if (webSocketConnected) {
        webSocketService.joinMatch(currentMatch._id)
      } else {
        startPolling(currentMatch._id)
      }
    }
  }, [
    currentMatch,
    authUser,
    dispatch,
    router,
    searchParams,
    webSocketConnected,
  ])

  // ============ POLLING FUNCTIONS ============
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
      isPollingRef.current = false
    }
  }, [])

  const startPolling = useCallback(
    (matchId: string) => {
      if (!matchId || isPollingRef.current) return

      isPollingRef.current = true

      const pollMessages = async () => {
        try {
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
            }/api/messages/${matchId}`,
            {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            }
          )

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.messages) {
              const existingIds = new Set(messages.map((msg) => msg._id))
              const newMessages = data.messages.filter(
                (msg: any) =>
                  !existingIds.has(msg._id) && !msg._id?.startsWith('temp-')
              )

              if (newMessages.length > 0) {
                newMessages.forEach((msg: any) => {
                  dispatch(newMessageReceived(msg))
                })
                scrollToBottom()
              }
            }
          }
        } catch (error) {
          console.error('❌ Polling error:', error)
        }
      }

      pollMessages()
      pollIntervalRef.current = setInterval(pollMessages, 5000)
    },
    [messages, dispatch]
  )

  // ============ SEND MESSAGE FUNCTION ============
  const sendMessage = async () => {
    if (!messageInput.trim() || !currentMatch || !currentUserId || !authUser) {
      return
    }

    const content = messageInput.trim()
    setMessageInput('')

    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`

    if (isTypingRef.current) {
      sendTypingIndicator(false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }

    dispatch(
      sendMessageOptimistic({
        tempId,
        matchId: currentMatch._id,
        content,
        sender: currentUserId,
        senderId: {
          _id: currentUserId,
          name: authUser.name || 'You',
          photos: authUser.photos || [],
          age: authUser.age,
        },
      })
    )

    scrollToBottom()

    try {
      if (webSocketService.isConnected()) {
        const success = await webSocketService.sendMessage(
          currentMatch._id,
          content,
          tempId
        )

        if (!success) {
          dispatch(
            sendMessageRequest({
              matchId: currentMatch._id,
              content,
              tempId,
            })
          )
        }
      } else {
        dispatch(
          sendMessageRequest({
            matchId: currentMatch._id,
            content,
            tempId,
          })
        )
      }
    } catch (error: any) {
      dispatch(
        sendMessageRequest({
          matchId: currentMatch._id,
          content,
          tempId,
        })
      )
    }
  }

  // ============ HELPER FUNCTIONS ============
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString()
  }

  const handleSelectMatch = (match: any) => {
    if (isTypingRef.current && currentMatch) {
      sendTypingIndicator(false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }

    if (currentMatch && webSocketService.isConnected()) {
      webSocketService.leaveMatch(currentMatch._id)
    }

    dispatch(setCurrentMatch(match))

    if (webSocketService.isConnected()) {
      webSocketService.joinMatch(match._id)
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set('matchId', match._id)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const handleBack = () => {
    if (isTypingRef.current && currentMatch) {
      sendTypingIndicator(false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }

    if (currentMatch && webSocketService.isConnected()) {
      webSocketService.leaveMatch(currentMatch._id)
    }

    dispatch(setCurrentMatch(null))
    const params = new URLSearchParams(searchParams.toString())
    params.delete('matchId')
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const reconnectWebSocket = async () => {
    setConnectionStatus('connecting')

    const connected = await webSocketService.connect()
    if (connected) {
      setConnectionStatus('connected')
    } else {
      setConnectionStatus('failed')
    }
  }

  const formatLastSeen = (timestamp: string | undefined) => {
    if (!timestamp) return 'recently'

    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  const groupMessagesByDate = () => {
    const groups: { [key: string]: any[] } = {}

    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })

    return groups
  }

  const handleInputBlur = () => {
    if (isTypingRef.current && currentMatch) {
      sendTypingIndicator(false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  const getMessageReadStatus = (message: any) => {
    if (message.sender !== currentUserId) return null

    if (message.isOptimistic || message._id?.startsWith('temp-')) {
      return 'loading'
    }

    if (message.isRead) {
      return 'read'
    }

    return 'sent'
  }

  // ============ RENDER LOGIC ============
  // Show loading while checking auth
  if ((checkingAuth || checkingAuthLocally) && !authUser) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Checking authentication...</p>
          <p className='text-sm text-gray-400 mt-2'>
            Please wait while we verify your session
          </p>
        </div>
      </div>
    )
  }

  // If not authenticated after all checks
  if (!authUser && !checkingAuth && !checkingAuthLocally) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Session expired</p>
          <p className='text-sm text-gray-400 mt-2'>Redirecting to login...</p>
          <button
            onClick={() => router.push('/login')}
            className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
          >
            Go to Login Now
          </button>
        </div>
      </div>
    )
  }

  // If there's an error in messages slice
  if (error) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='text-red-500 mb-4'>{error}</div>
          <button
            onClick={() => dispatch(clearError())}
            className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const groupedMessages = groupMessagesByDate()

  return (
    <>
      <Head>
        <title>Messages | Dating App</title>
        <meta name='description' content='Chat with your matches' />
      </Head>

      {/* Connection Status Banner */}
      <div
        className={`px-4 py-2 text-center text-sm font-medium ${
          connectionStatus === 'connected'
            ? 'bg-green-100 text-green-800'
            : connectionStatus === 'connecting'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {connectionStatus === 'connected' && (
          <div className='flex items-center justify-center'>
            <span className='w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse'></span>
            Live connection (WebSocket)
          </div>
        )}
        {connectionStatus === 'connecting' && '🔄 Connecting to WebSocket...'}
        {connectionStatus === 'disconnected' &&
          '⚠️ Disconnected - Using polling'}
        {connectionStatus === 'failed' &&
          '❌ Connection failed - Using polling'}

        {connectionStatus !== 'connected' && (
          <button
            onClick={reconnectWebSocket}
            className='ml-2 underline hover:no-underline'
          >
            Reconnect
          </button>
        )}
      </div>

      <div className='flex h-screen bg-gray-50'>
        {/* Left Sidebar - Matches List */}
        <div className='w-80 bg-white border-r border-gray-200 flex flex-col'>
          <div className='p-4 border-b'>
            <h2 className='text-xl font-bold text-gray-800'>Messages</h2>
            <p className='text-sm text-gray-500 mt-1'>
              {matches.length}{' '}
              {matches.length === 1 ? 'conversation' : 'conversations'}
            </p>
          </div>

          <div className='flex-1 overflow-y-auto'>
            {loading && matches.length === 0 ? (
              <div className='p-8 text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'></div>
                <p className='mt-4 text-gray-600'>Loading conversations...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className='p-8 text-center'>
                <div className='text-gray-400 mb-4'>
                  <svg
                    className='w-16 h-16 mx-auto'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                    />
                  </svg>
                </div>
                <p className='text-gray-500'>No matches yet</p>
                <p className='text-sm text-gray-400 mt-2'>
                  Start swiping to find matches!
                </p>
              </div>
            ) : (
              matches.map((match: any) => {
                const matchOtherUser =
                  match.otherUser ||
                  match.users?.find(
                    (user: any) =>
                      user && user._id && user._id.toString() !== currentUserId
                  )

                const isOnline = matchOtherUser
                  ? onlineStatus[matchOtherUser._id]?.isOnline
                  : false
                const isTypingInMatch = typingIndicators.some(
                  (indicator) =>
                    indicator.userId === matchOtherUser?._id &&
                    indicator.matchId === match._id &&
                    indicator.isTyping &&
                    new Date().getTime() -
                      new Date(indicator.timestamp).getTime() <
                      3000
                )

                return (
                  <div
                    key={match._id}
                    onClick={() => handleSelectMatch(match)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                      currentMatch?._id === match._id
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className='flex items-center'>
                      <div className='relative'>
                        <img
                          src={
                            matchOtherUser?.photos?.[0]
                              ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${matchOtherUser.photos[0]}`
                              : '/default-avatar.png'
                          }
                          alt={matchOtherUser?.name || 'User'}
                          className='w-12 h-12 rounded-full object-cover'
                        />
                        {isOnline && (
                          <span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></span>
                        )}
                        {match.unreadCount > 0 && (
                          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                            {match.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className='ml-3 flex-1 min-w-0'>
                        <div className='flex justify-between items-start'>
                          <h3 className='font-semibold text-gray-800 truncate'>
                            {matchOtherUser?.name || 'Unknown'},{' '}
                            {matchOtherUser?.age || ''}
                          </h3>
                          {match.lastMessageAt && (
                            <span className='text-xs text-gray-400 whitespace-nowrap'>
                              {formatTime(match.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <p className='text-sm text-gray-600 truncate mt-1'>
                          {isTypingInMatch ? (
                            <span className='text-blue-500 italic'>
                              typing...
                            </span>
                          ) : (
                            match.lastMessage || 'Start a conversation'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Side - Chat Area */}
        <div className='flex-1 flex flex-col'>
          {currentMatch ? (
            <>
              {/* Chat Header */}
              <div className='bg-white border-b border-gray-200 p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <button
                      onClick={handleBack}
                      className='md:hidden mr-3 text-gray-500 hover:text-gray-700'
                    >
                      <svg
                        className='w-6 h-6'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 19l-7-7 7-7'
                        />
                      </svg>
                    </button>
                    <div className='relative'>
                      <img
                        src={
                          otherUser?.photos?.[0]
                            ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${otherUser.photos[0]}`
                            : '/default-avatar.png'
                        }
                        alt={otherUser?.name || 'User'}
                        className='w-10 h-10 rounded-full object-cover'
                      />
                      {isOtherUserOnline ? (
                        <span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></span>
                      ) : (
                        <span className='absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white rounded-full'></span>
                      )}
                    </div>
                    <div className='ml-3'>
                      <h3 className='font-semibold text-gray-800'>
                        {otherUser?.name || 'Unknown'}, {otherUser?.age || ''}
                      </h3>
                      <div className='flex items-center gap-2'>
                        {isOtherUserTyping ? (
                          <div className='flex items-center gap-1'>
                            <div className='flex gap-1'>
                              <div className='w-1 h-1 bg-gray-500 rounded-full animate-bounce'></div>
                              <div
                                className='w-1 h-1 bg-gray-500 rounded-full animate-bounce'
                                style={{ animationDelay: '0.1s' }}
                              ></div>
                              <div
                                className='w-1 h-1 bg-gray-500 rounded-full animate-bounce'
                                style={{ animationDelay: '0.2s' }}
                              ></div>
                            </div>
                            <p className='text-sm text-gray-500'>typing...</p>
                          </div>
                        ) : isOtherUserOnline ? (
                          <div className='flex items-center gap-1'>
                            <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                            <p className='text-sm text-green-500'>Online</p>
                          </div>
                        ) : (
                          <p className='text-sm text-gray-500'>
                            Last active {formatLastSeen(otherUserLastSeen)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        webSocketConnected
                          ? 'bg-green-500 animate-pulse'
                          : 'bg-gray-400'
                      }`}
                    ></div>
                    <p className='text-sm text-gray-500'>
                      {webSocketConnected ? 'Live' : 'Polling'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className='flex-1 overflow-y-auto p-4 bg-gray-50'>
                {loading ? (
                  <div className='flex items-center justify-center h-full'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className='flex flex-col items-center justify-center h-full text-center'>
                    <div className='text-gray-400 mb-4'>
                      <svg
                        className='w-16 h-16'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={1.5}
                          d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                        />
                      </svg>
                    </div>
                    <h3 className='text-lg font-semibold text-gray-700 mb-2'>
                      No messages yet
                    </h3>
                    <p className='text-gray-500'>
                      Send a message to start the conversation!
                    </p>
                  </div>
                ) : (
                  <div className='space-y-6'>
                    {Object.entries(groupedMessages).map(
                      ([date, dateMessages]) => (
                        <div key={date}>
                          <div className='flex items-center justify-center my-4'>
                            <div className='bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full'>
                              {formatDate(dateMessages[0].createdAt)}
                            </div>
                          </div>
                          <div className='space-y-4'>
                            {dateMessages.map((message: any, index: number) => {
                              const isCurrentUser =
                                message.sender === currentUserId
                              const isOptimistic =
                                message.isOptimistic ||
                                message._id?.startsWith('temp-')
                              const readStatus = getMessageReadStatus(message)

                              return (
                                <div
                                  key={message._id || index}
                                  className={`flex ${
                                    isCurrentUser
                                      ? 'justify-end'
                                      : 'justify-start'
                                  }`}
                                >
                                  <div
                                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                                      isCurrentUser
                                        ? 'bg-blue-500 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
                                    } ${isOptimistic ? 'opacity-80' : ''}`}
                                  >
                                    {!isCurrentUser &&
                                      message.senderId?.name && (
                                        <p className='text-xs font-semibold text-gray-600 mb-1'>
                                          {message.senderId.name}
                                        </p>
                                      )}

                                    <p className='break-words'>
                                      {message.content}
                                    </p>

                                    <div
                                      className={`text-xs mt-1 flex items-center justify-between ${
                                        isCurrentUser
                                          ? 'text-blue-100'
                                          : 'text-gray-400'
                                      }`}
                                    >
                                      <span>
                                        {formatTime(message.createdAt)}
                                      </span>
                                      {isCurrentUser && (
                                        <span className='ml-2 flex items-center gap-1'>
                                          {readStatus === 'loading' ? (
                                            <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                          ) : readStatus === 'read' ? (
                                            <>
                                              <span>✓✓</span>
                                              <span className='ml-1'>Read</span>
                                            </>
                                          ) : (
                                            '✓ Sent'
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    )}

                    {isOtherUserTyping && (
                      <div className='flex justify-start'>
                        <div className='max-w-[70%] rounded-2xl px-4 py-3 bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'>
                          <div className='flex items-center gap-1'>
                            <div className='flex gap-1'>
                              <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                              <div
                                className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                                style={{ animationDelay: '0.1s' }}
                              ></div>
                              <div
                                className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                                style={{ animationDelay: '0.2s' }}
                              ></div>
                            </div>
                            <span className='text-sm text-gray-500 ml-2'>
                              typing...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className='bg-white border-t border-gray-200 p-4'>
                <div className='flex items-center'>
                  <input
                    type='text'
                    value={messageInput}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder='Type a message...'
                    className='flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                    className='ml-3 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
                      />
                    </svg>
                  </button>
                </div>
                <div className='mt-2 text-xs text-gray-500 text-center'>
                  {webSocketConnected ? (
                    <div className='flex items-center justify-center gap-2'>
                      <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></span>
                      <span className='text-green-600'>
                        Live WebSocket connection
                      </span>
                    </div>
                  ) : (
                    <div className='flex items-center justify-center gap-2'>
                      <span className='w-2 h-2 bg-yellow-500 rounded-full'></span>
                      <span className='text-yellow-600'>
                        Using polling (5s intervals)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className='flex-1 flex flex-col items-center justify-center p-8'>
              <div className='max-w-md text-center'>
                <div className='text-gray-400 mb-6'>
                  <svg
                    className='w-24 h-24 mx-auto'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z'
                    />
                  </svg>
                </div>
                <h2 className='text-2xl font-bold text-gray-700 mb-4'>
                  Welcome to Messages
                </h2>
                <p className='text-gray-500 mb-6'>
                  Select a conversation from the sidebar to start chatting with
                  your matches.
                </p>
                <div
                  className={`p-4 rounded-lg ${
                    webSocketConnected
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      webSocketConnected ? 'text-green-700' : 'text-yellow-700'
                    }`}
                  >
                    {webSocketConnected
                      ? '✅ Real-time chat enabled via WebSocket'
                      : '🔄 Using polling for messages'}
                  </p>
                  {!webSocketConnected && (
                    <button
                      onClick={reconnectWebSocket}
                      className='mt-2 text-sm underline hover:no-underline'
                    >
                      Try to connect WebSocket
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default MessagesPage
