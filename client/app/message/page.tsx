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

//   // Auth state
//   const [authInitialized, setAuthInitialized] = useState(false)
//   const [authRetryCount, setAuthRetryCount] = useState(0)
//   const [checkingAuthLocally, setCheckingAuthLocally] = useState(true)

//   const matchIdFromUrl = searchParams.get('matchId')

//   // ============ AUTHENTICATION FIX - OPTIMIZED ============
//   useEffect(() => {
//     // Check if we have a token in cookies
//     const checkTokenInCookies = () => {
//       const cookies = document.cookie.split('; ')
//       const tokenCookie = cookies.find((row) => row.startsWith('token='))
//       return !!tokenCookie
//     }

//     const initializeAuth = async () => {
//       // First, check if we're already checking auth
//       if (checkingAuth || authUser) {
//         setCheckingAuthLocally(false)
//         return
//       }

//       // Check if we have a token in cookies first
//       const hasToken = checkTokenInCookies()

//       if (!hasToken) {
//         console.log('🚫 No token found in cookies, redirecting to login')
//         setCheckingAuthLocally(false)
//         router.push('/login')
//         return
//       }

//       // We have a token, but no authUser - try to check auth
//       try {
//         console.log('🔐 Token found, checking authentication...')
//         setCheckingAuthLocally(true)

//         // Dispatch check auth with retry logic
//         await dispatch(checkAuthRequest())

//         // Wait a moment for the auth check to complete
//         setTimeout(() => {
//           setCheckingAuthLocally(false)
//           setAuthInitialized(true)
//         }, 1000)
//       } catch (error) {
//         console.error('❌ Auth check error:', error)
//         setCheckingAuthLocally(false)
//       }
//     }

//     // Only run once on mount
//     if (!authInitialized) {
//       initializeAuth()
//     }
//   }, [dispatch, router, authInitialized])

//   // Handle auth state changes
//   useEffect(() => {
//     // If auth check is complete and we have no user, try one retry
//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount < 2
//     ) {
//       const timer = setTimeout(() => {
//         console.log(`🔄 Retry auth check (${authRetryCount + 1}/2)`)
//         setAuthRetryCount((prev) => prev + 1)
//         dispatch(checkAuthRequest())
//       }, 1000)

//       return () => clearTimeout(timer)
//     }

//     // If still no user after retries, redirect to login
//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount >= 2
//     ) {
//       console.log('🚫 Auth failed after retries, redirecting to login')

//       const timer = setTimeout(() => {
//         router.push('/login')
//       }, 1500)

//       return () => clearTimeout(timer)
//     }
//   }, [
//     checkingAuth,
//     checkingAuthLocally,
//     authUser,
//     authRetryCount,
//     dispatch,
//     router,
//   ])

//   // ============ LOAD MATCHES WHEN AUTHENTICATED ============
//   useEffect(() => {
//     if (authUser && !checkingAuth && !checkingAuthLocally) {
//       console.log('✅ User authenticated, loading matches...')
//       dispatch(getMatchesRequest())
//     }
//   }, [authUser, checkingAuth, checkingAuthLocally, dispatch])

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

//       const now = Date.now()
//       if (isTypingValue && now - lastTypingSentRef.current < 1000) {
//         return
//       }

//       webSocketService.sendTypingIndicator(currentMatch._id, isTypingValue)
//       lastTypingSentRef.current = now
//       isTypingRef.current = isTypingValue
//     },
//     [currentMatch, currentUserId]
//   )

//   const handleTyping = useCallback(() => {
//     if (!currentMatch || !currentUserId) return

//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current)
//     }

//     if (!isTypingRef.current) {
//       sendTypingIndicator(true)
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       if (isTypingRef.current) {
//         sendTypingIndicator(false)
//       }
//     }, 2000)
//   }, [currentMatch, currentUserId, sendTypingIndicator])

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value
//     setMessageInput(value)

//     if (value.trim().length > 0) {
//       handleTyping()
//     } else if (isTypingRef.current) {
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

//     const initWebSocket = async () => {
//       try {
//         setConnectionStatus('connecting')
//         const connected = await webSocketService.connect()

//         if (connected) {
//           setConnectionStatus('connected')
//           setWebSocketConnected(true)

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

//     const unsubscribeCallbacks: (() => void)[] = []

//     webSocketService.onConnectionChange((connected: boolean) => {
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

//     const newMessageHandler = (message: any) => {
//       dispatch(newMessageReceived(message))
//       scrollToBottom()

//       if (
//         currentMatch?._id === message.matchId &&
//         message.sender !== currentUserId &&
//         !message.isRead &&
//         currentMatch
//       ) {
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

//     const typingHandler = (data: any) => {
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

//     const statusHandler = (data: any) => {
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

//     const statusBatchHandler = (statuses: any) => {
//       dispatch(setOnlineStatusBatch(statuses))
//     }

//     webSocketService.on('online-status-batch', statusBatchHandler)

//     const messagesReadHandler = (data: any) => {
//       if (data.userId !== currentUserId && data.matchId === currentMatch?._id) {
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

//     const onlineUsersHandler = (userIds: string[]) => {
//       if (userIds.length > 0) {
//         webSocketService.checkOnlineStatusBatch(userIds)
//       }
//     }

//     webSocketService.on('online-users', onlineUsersHandler)

//     return () => {
//       stopPolling()

//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       webSocketService.off('new-message', newMessageHandler)
//       webSocketService.off('user-typing', typingHandler)
//       webSocketService.off('user-status', statusHandler)
//       webSocketService.off('online-status-batch', statusBatchHandler)
//       webSocketService.off('messages-read', messagesReadHandler)
//       webSocketService.off('online-users', onlineUsersHandler)

//       unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
//     }
//   }, [authUser, checkingAuth, currentMatch, dispatch, messages, currentUserId])

//   // ============ MARK MESSAGES AS READ ============
//   useEffect(() => {
//     if (!currentMatch || !messages.length || !webSocketService.isConnected()) {
//       return
//     }

//     const unreadMessages = messages.filter(
//       (msg) =>
//         msg.matchId === currentMatch._id &&
//         msg.sender !== currentUserId &&
//         !msg.isRead
//     )

//     if (unreadMessages.length > 0) {
//       const messageIds = unreadMessages.map((msg) => msg._id)
//       webSocketService.markMessagesAsRead(currentMatch._id, messageIds)

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

//   // ============ HANDLE URL MATCH ID ============
//   useEffect(() => {
//     if (matchIdFromUrl && matches.length > 0) {
//       const match = matches.find((m) => m._id === matchIdFromUrl)
//       if (match && (!currentMatch || currentMatch._id !== matchIdFromUrl)) {
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
//       initialMessagesLoadedRef.current = currentMatch._id

//       dispatch(getMessagesRequest({ matchId: currentMatch._id }))
//       dispatch(markMessagesReadRequest(currentMatch._id))

//       const params = new URLSearchParams(searchParams.toString())
//       params.set('matchId', currentMatch._id)
//       router.replace(`?${params.toString()}`, { scroll: false })

//       if (webSocketConnected) {
//         webSocketService.joinMatch(currentMatch._id)
//       } else {
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

//   // ============ POLLING FUNCTIONS ============
//   const stopPolling = useCallback(() => {
//     if (pollIntervalRef.current) {
//       clearInterval(pollIntervalRef.current)
//       pollIntervalRef.current = null
//       isPollingRef.current = false
//     }
//   }, [])

//   const startPolling = useCallback(
//     (matchId: string) => {
//       if (!matchId || isPollingRef.current) return

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
//       return
//     }

//     const content = messageInput.trim()
//     setMessageInput('')

//     const tempId = `temp-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`

//     if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

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

//     scrollToBottom()

//     try {
//       if (webSocketService.isConnected()) {
//         const success = await webSocketService.sendMessage(
//           currentMatch._id,
//           content,
//           tempId
//         )

//         if (!success) {
//           dispatch(
//             sendMessageRequest({
//               matchId: currentMatch._id,
//               content,
//               tempId,
//             })
//           )
//         }
//       } else {
//         dispatch(
//           sendMessageRequest({
//             matchId: currentMatch._id,
//             content,
//             tempId,
//           })
//         )
//       }
//     } catch (error: any) {
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
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(match))

//     if (webSocketService.isConnected()) {
//       webSocketService.joinMatch(match._id)
//     }

//     const params = new URLSearchParams(searchParams.toString())
//     params.set('matchId', match._id)
//     router.replace(`?${params.toString()}`, { scroll: false })
//   }

//   const handleBack = () => {
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(null))
//     const params = new URLSearchParams(searchParams.toString())
//     params.delete('matchId')
//     router.replace(`?${params.toString()}`, { scroll: false })
//   }

//   const reconnectWebSocket = async () => {
//     setConnectionStatus('connecting')

//     const connected = await webSocketService.connect()
//     if (connected) {
//       setConnectionStatus('connected')
//     } else {
//       setConnectionStatus('failed')
//     }
//   }

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

//   const handleInputBlur = () => {
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   const getMessageReadStatus = (message: any) => {
//     if (message.sender !== currentUserId) return null

//     if (message.isOptimistic || message._id?.startsWith('temp-')) {
//       return 'loading'
//     }

//     if (message.isRead) {
//       return 'read'
//     }

//     return 'sent'
//   }

//   // ============ RENDER LOGIC ============
//   // Show loading while checking auth
//   if ((checkingAuth || checkingAuthLocally) && !authUser) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Checking authentication...</p>
//           <p className='text-sm text-gray-400 mt-2'>
//             Please wait while we verify your session
//           </p>
//         </div>
//       </div>
//     )
//   }

//   // If not authenticated after all checks
//   if (!authUser && !checkingAuth && !checkingAuthLocally) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Session expired</p>
//           <p className='text-sm text-gray-400 mt-2'>Redirecting to login...</p>
//           <button
//             onClick={() => router.push('/login')}
//             className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
//           >
//             Go to Login Now
//           </button>
//         </div>
//       </div>
//     )
//   }

//   // If there's an error in messages slice
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
//   editMessageRequest,
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
//   const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
//   const [editMessageContent, setEditMessageContent] = useState('')
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

//   // Auth state
//   const [authInitialized, setAuthInitialized] = useState(false)
//   const [authRetryCount, setAuthRetryCount] = useState(0)
//   const [checkingAuthLocally, setCheckingAuthLocally] = useState(true)

//   // Responsive state
//   const [isMobile, setIsMobile] = useState(false)
//   const [showChat, setShowChat] = useState(false)

//   const matchIdFromUrl = searchParams.get('matchId')

//   // ============ RESPONSIVE HANDLING ============
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768)
//     }

//     checkMobile()
//     window.addEventListener('resize', checkMobile)

//     return () => window.removeEventListener('resize', checkMobile)
//   }, [])

//   // ============ AUTHENTICATION FIX - OPTIMIZED ============
//   useEffect(() => {
//     // Check if we have a token in cookies
//     const checkTokenInCookies = () => {
//       const cookies = document.cookie.split('; ')
//       const tokenCookie = cookies.find((row) => row.startsWith('token='))
//       return !!tokenCookie
//     }

//     const initializeAuth = async () => {
//       // First, check if we're already checking auth
//       if (checkingAuth || authUser) {
//         setCheckingAuthLocally(false)
//         return
//       }

//       // Check if we have a token in cookies first
//       const hasToken = checkTokenInCookies()

//       if (!hasToken) {
//         console.log('🚫 No token found in cookies, redirecting to login')
//         setCheckingAuthLocally(false)
//         router.push('/login')
//         return
//       }

//       // We have a token, but no authUser - try to check auth
//       try {
//         console.log('🔐 Token found, checking authentication...')
//         setCheckingAuthLocally(true)

//         // Dispatch check auth with retry logic
//         await dispatch(checkAuthRequest())

//         // Wait a moment for the auth check to complete
//         setTimeout(() => {
//           setCheckingAuthLocally(false)
//           setAuthInitialized(true)
//         }, 1000)
//       } catch (error) {
//         console.error('❌ Auth check error:', error)
//         setCheckingAuthLocally(false)
//       }
//     }

//     // Only run once on mount
//     if (!authInitialized) {
//       initializeAuth()
//     }
//   }, [dispatch, router, authInitialized])

//   // Handle auth state changes
//   useEffect(() => {
//     // If auth check is complete and we have no user, try one retry
//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount < 2
//     ) {
//       const timer = setTimeout(() => {
//         console.log(`🔄 Retry auth check (${authRetryCount + 1}/2)`)
//         setAuthRetryCount((prev) => prev + 1)
//         dispatch(checkAuthRequest())
//       }, 1000)

//       return () => clearTimeout(timer)
//     }

//     // If still no user after retries, redirect to login
//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount >= 2
//     ) {
//       console.log('🚫 Auth failed after retries, redirecting to login')

//       const timer = setTimeout(() => {
//         router.push('/login')
//       }, 1500)

//       return () => clearTimeout(timer)
//     }
//   }, [
//     checkingAuth,
//     checkingAuthLocally,
//     authUser,
//     authRetryCount,
//     dispatch,
//     router,
//   ])

//   // ============ LOAD MATCHES WHEN AUTHENTICATED ============
//   useEffect(() => {
//     if (authUser && !checkingAuth && !checkingAuthLocally) {
//       console.log('✅ User authenticated, loading matches...')
//       dispatch(getMatchesRequest())
//     }
//   }, [authUser, checkingAuth, checkingAuthLocally, dispatch])

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

//       const now = Date.now()
//       if (isTypingValue && now - lastTypingSentRef.current < 1000) {
//         return
//       }

//       webSocketService.sendTypingIndicator(currentMatch._id, isTypingValue)
//       lastTypingSentRef.current = now
//       isTypingRef.current = isTypingValue
//     },
//     [currentMatch, currentUserId]
//   )

//   const handleTyping = useCallback(() => {
//     if (!currentMatch || !currentUserId) return

//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current)
//     }

//     if (!isTypingRef.current) {
//       sendTypingIndicator(true)
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       if (isTypingRef.current) {
//         sendTypingIndicator(false)
//       }
//     }, 2000)
//   }, [currentMatch, currentUserId, sendTypingIndicator])

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value
//     setMessageInput(value)

//     if (value.trim().length > 0) {
//       handleTyping()
//     } else if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   // ============ MESSAGE EDITING FUNCTIONS ============
//   const startEditingMessage = (message: any) => {
//     if (message.sender !== currentUserId) return

//     setEditingMessageId(message._id)
//     setEditMessageContent(message.content)
//     setMessageInput(message.content)

//     // Focus on input
//     setTimeout(() => {
//       const input = document.querySelector(
//         'input[type="text"]'
//       ) as HTMLInputElement
//       input?.focus()
//     }, 100)
//   }

//   const cancelEditing = () => {
//     setEditingMessageId(null)
//     setEditMessageContent('')
//     setMessageInput('')
//   }

//   const saveEditedMessage = async () => {
//     if (!editingMessageId || !editMessageContent.trim() || !currentMatch) return

//     try {
//       await dispatch(
//         editMessageRequest({
//           messageId: editingMessageId,
//           matchId: currentMatch._id,
//           content: editMessageContent.trim(),
//         })
//       )

//       cancelEditing()
//     } catch (error) {
//       console.error('Failed to edit message:', error)
//     }
//   }

//   // ============ WEBSOCKET MANAGEMENT ============
//   useEffect(() => {
//     if (!authUser || checkingAuth) return

//     console.log('🔌 Setting up WebSocket...')

//     const initWebSocket = async () => {
//       try {
//         setConnectionStatus('connecting')
//         const connected = await webSocketService.connect()

//         if (connected) {
//           setConnectionStatus('connected')
//           setWebSocketConnected(true)

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

//     const unsubscribeCallbacks: (() => void)[] = []

//     webSocketService.onConnectionChange((connected: boolean) => {
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

//     const newMessageHandler = (message: any) => {
//       dispatch(newMessageReceived(message))
//       scrollToBottom()

//       if (
//         currentMatch?._id === message.matchId &&
//         message.sender !== currentUserId &&
//         !message.isRead &&
//         currentMatch
//       ) {
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

//     const typingHandler = (data: any) => {
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

//     const statusHandler = (data: any) => {
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

//     const statusBatchHandler = (statuses: any) => {
//       dispatch(setOnlineStatusBatch(statuses))
//     }

//     webSocketService.on('online-status-batch', statusBatchHandler)

//     const messagesReadHandler = (data: any) => {
//       if (data.userId !== currentUserId && data.matchId === currentMatch?._id) {
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

//     const onlineUsersHandler = (userIds: string[]) => {
//       if (userIds.length > 0) {
//         webSocketService.checkOnlineStatusBatch(userIds)
//       }
//     }

//     webSocketService.on('online-users', onlineUsersHandler)

//     return () => {
//       stopPolling()

//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       webSocketService.off('new-message', newMessageHandler)
//       webSocketService.off('user-typing', typingHandler)
//       webSocketService.off('user-status', statusHandler)
//       webSocketService.off('online-status-batch', statusBatchHandler)
//       webSocketService.off('messages-read', messagesReadHandler)
//       webSocketService.off('online-users', onlineUsersHandler)

//       unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
//     }
//   }, [authUser, checkingAuth, currentMatch, dispatch, messages, currentUserId])

//   // ============ MARK MESSAGES AS READ ============
//   useEffect(() => {
//     if (!currentMatch || !messages.length || !webSocketService.isConnected()) {
//       return
//     }

//     const unreadMessages = messages.filter(
//       (msg) =>
//         msg.matchId === currentMatch._id &&
//         msg.sender !== currentUserId &&
//         !msg.isRead
//     )

//     if (unreadMessages.length > 0) {
//       const messageIds = unreadMessages.map((msg) => msg._id)
//       webSocketService.markMessagesAsRead(currentMatch._id, messageIds)

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

//   // ============ HANDLE URL MATCH ID ============
//   useEffect(() => {
//     if (matchIdFromUrl && matches.length > 0) {
//       const match = matches.find((m) => m._id === matchIdFromUrl)
//       if (match && (!currentMatch || currentMatch._id !== matchIdFromUrl)) {
//         dispatch(setCurrentMatch(match))
//         if (isMobile) {
//           setShowChat(true)
//         }
//       }
//     }
//   }, [matchIdFromUrl, matches, dispatch, currentMatch, isMobile])

//   // ============ LOAD INITIAL MESSAGES ============
//   useEffect(() => {
//     if (
//       currentMatch &&
//       authUser &&
//       initialMessagesLoadedRef.current !== currentMatch._id
//     ) {
//       initialMessagesLoadedRef.current = currentMatch._id

//       dispatch(getMessagesRequest({ matchId: currentMatch._id }))
//       dispatch(markMessagesReadRequest(currentMatch._id))

//       const params = new URLSearchParams(searchParams.toString())
//       params.set('matchId', currentMatch._id)
//       router.replace(`?${params.toString()}`, { scroll: false })

//       if (webSocketConnected) {
//         webSocketService.joinMatch(currentMatch._id)
//       } else {
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

//   // ============ POLLING FUNCTIONS ============
//   const stopPolling = useCallback(() => {
//     if (pollIntervalRef.current) {
//       clearInterval(pollIntervalRef.current)
//       pollIntervalRef.current = null
//       isPollingRef.current = false
//     }
//   }, [])

//   const startPolling = useCallback(
//     (matchId: string) => {
//       if (!matchId || isPollingRef.current) return

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
//               const existingIds = new Set(messages.map((msg) => msg._id))
//               const newMessages = data.messages.filter(
//                 (msg: any) =>
//                   !existingIds.has(msg._id) && !msg._id?.startsWith('temp-')
//               )

//               if (newMessages.length > 0) {
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
//       return
//     }

//     // If editing a message
//     if (editingMessageId) {
//       await saveEditedMessage()
//       return
//     }

//     const content = messageInput.trim()
//     setMessageInput('')

//     const tempId = `temp-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`

//     if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

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

//     scrollToBottom()

//     try {
//       if (webSocketService.isConnected()) {
//         const success = await webSocketService.sendMessage(
//           currentMatch._id,
//           content,
//           tempId
//         )

//         if (!success) {
//           dispatch(
//             sendMessageRequest({
//               matchId: currentMatch._id,
//               content,
//               tempId,
//             })
//           )
//         }
//       } else {
//         dispatch(
//           sendMessageRequest({
//             matchId: currentMatch._id,
//             content,
//             tempId,
//           })
//         )
//       }
//     } catch (error: any) {
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
//     // Toggle chat visibility on mobile
//     if (isMobile) {
//       if (currentMatch?._id === match._id) {
//         // Toggle: if already selected, toggle visibility
//         setShowChat(!showChat)
//       } else {
//         // Select new match and show chat
//         setShowChat(true)
//       }
//     }

//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(match))

//     if (webSocketService.isConnected()) {
//       webSocketService.joinMatch(match._id)
//     }

//     const params = new URLSearchParams(searchParams.toString())
//     params.set('matchId', match._id)
//     router.replace(`?${params.toString()}`, { scroll: false })
//   }

//   const handleBack = () => {
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(null))
//     setShowChat(false)
//     setEditingMessageId(null)
//     setEditMessageContent('')

//     const params = new URLSearchParams(searchParams.toString())
//     params.delete('matchId')
//     router.replace(`?${params.toString()}`, { scroll: false })
//   }

//   const reconnectWebSocket = async () => {
//     setConnectionStatus('connecting')

//     const connected = await webSocketService.connect()
//     if (connected) {
//       setConnectionStatus('connected')
//     } else {
//       setConnectionStatus('failed')
//     }
//   }

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

//   const handleInputBlur = () => {
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   const getMessageReadStatus = (message: any) => {
//     if (message.sender !== currentUserId) return null

//     if (message.isOptimistic || message._id?.startsWith('temp-')) {
//       return 'loading'
//     }

//     if (message.isRead) {
//       return 'read'
//     }

//     return 'sent'
//   }

//   // Determine what to show based on mobile and showChat state
//   const showUserList = !isMobile || !showChat
//   const showChatArea = !isMobile || showChat

//   // ============ RENDER LOGIC ============
//   // Show loading while checking auth
//   if ((checkingAuth || checkingAuthLocally) && !authUser) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Checking authentication...</p>
//           <p className='text-sm text-gray-400 mt-2'>
//             Please wait while we verify your session
//           </p>
//         </div>
//       </div>
//     )
//   }

//   // If not authenticated after all checks
//   if (!authUser && !checkingAuth && !checkingAuthLocally) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Session expired</p>
//           <p className='text-sm text-gray-400 mt-2'>Redirecting to login...</p>
//           <button
//             onClick={() => router.push('/login')}
//             className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
//           >
//             Go to Login Now
//           </button>
//         </div>
//       </div>
//     )
//   }

//   // If there's an error in messages slice
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
//         <div
//           className={`${
//             showUserList ? 'block' : 'hidden'
//           } md:block w-full md:w-80 bg-white border-r border-gray-200 flex flex-col`}
//         >
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
//         <div
//           className={`${
//             showChatArea ? 'block' : 'hidden'
//           } md:block flex-1 flex flex-col`}
//         >
//           {currentMatch ? (
//             <>
//               {/* Chat Header */}
//               <div className='bg-white border-b border-gray-200 p-4'>
//                 <div className='flex items-center justify-between'>
//                   <div className='flex items-center'>
//                     <button
//                       onClick={handleBack}
//                       className={`${
//                         isMobile ? 'block' : 'md:hidden'
//                       } mr-3 text-gray-500 hover:text-gray-700`}
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
//                               const isEditing = editingMessageId === message._id

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
//                                     className={`max-w-[70%] rounded-2xl px-4 py-3 relative group ${
//                                       isCurrentUser
//                                         ? 'bg-blue-500 text-white rounded-br-none'
//                                         : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
//                                     } ${isOptimistic ? 'opacity-80' : ''} ${
//                                       isEditing ? 'ring-2 ring-blue-300' : ''
//                                     }`}
//                                     onDoubleClick={() => {
//                                       if (isCurrentUser) {
//                                         startEditingMessage(message)
//                                       }
//                                     }}
//                                   >
//                                     {!isCurrentUser &&
//                                       message.senderId?.name && (
//                                         <p className='text-xs font-semibold text-gray-600 mb-1'>
//                                           {message.senderId.name}
//                                         </p>
//                                       )}

//                                     {isEditing ? (
//                                       <div className='mb-2'>
//                                         <input
//                                           type='text'
//                                           value={editMessageContent}
//                                           onChange={(e) =>
//                                             setEditMessageContent(
//                                               e.target.value
//                                             )
//                                           }
//                                           className='w-full bg-blue-600 text-white px-3 py-2 rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300'
//                                           onKeyPress={(e) => {
//                                             if (e.key === 'Enter') {
//                                               saveEditedMessage()
//                                             }
//                                             if (e.key === 'Escape') {
//                                               cancelEditing()
//                                             }
//                                           }}
//                                           autoFocus
//                                         />
//                                         <div className='flex gap-2 mt-2'>
//                                           <button
//                                             onClick={saveEditedMessage}
//                                             className='px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600'
//                                           >
//                                             Save
//                                           </button>
//                                           <button
//                                             onClick={cancelEditing}
//                                             className='px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600'
//                                           >
//                                             Cancel
//                                           </button>
//                                         </div>
//                                       </div>
//                                     ) : (
//                                       <>
//                                         <p className='break-words'>
//                                           {message.content}
//                                         </p>
//                                         {isCurrentUser && (
//                                           <button
//                                             onClick={() =>
//                                               startEditingMessage(message)
//                                             }
//                                             className='absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md'
//                                             title='Edit message'
//                                           >
//                                             <svg
//                                               className='w-3 h-3'
//                                               fill='none'
//                                               stroke='currentColor'
//                                               viewBox='0 0 24 24'
//                                             >
//                                               <path
//                                                 strokeLinecap='round'
//                                                 strokeLinejoin='round'
//                                                 strokeWidth={2}
//                                                 d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
//                                               />
//                                             </svg>
//                                           </button>
//                                         )}
//                                       </>
//                                     )}

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
//                 {editingMessageId && (
//                   <div className='mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md'>
//                     <div className='flex items-center justify-between'>
//                       <span className='text-sm text-blue-700'>
//                         <span className='font-medium'>Editing message:</span>{' '}
//                         {editMessageContent.substring(0, 50)}
//                         {editMessageContent.length > 50 ? '...' : ''}
//                       </span>
//                       <button
//                         onClick={cancelEditing}
//                         className='text-blue-700 hover:text-blue-900'
//                       >
//                         <svg
//                           className='w-4 h-4'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M6 18L18 6M6 6l12 12'
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                 )}
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
//                       if (e.key === 'Escape' && editingMessageId) {
//                         cancelEditing()
//                       }
//                     }}
//                     placeholder={
//                       editingMessageId
//                         ? 'Edit your message...'
//                         : 'Type a message...'
//                     }
//                     className='flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
//                   />
//                   <button
//                     onClick={sendMessage}
//                     disabled={!messageInput.trim()}
//                     className={`ml-3 ${
//                       editingMessageId
//                         ? 'bg-green-500 hover:bg-green-600'
//                         : 'bg-blue-500 hover:bg-blue-600'
//                     } text-white rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
//                   >
//                     {editingMessageId ? (
//                       <svg
//                         className='w-5 h-5'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M5 13l4 4L19 7'
//                         />
//                       </svg>
//                     ) : (
//                       <svg
//                         className='w-5 h-5'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
//                         />
//                       </svg>
//                     )}
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
//   editMessageRequest,
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
//   const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
//   const [editMessageContent, setEditMessageContent] = useState('')
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const messagesContainerRef = useRef<HTMLDivElement>(null)
//   const lastUnreadMessageRef = useRef<string | null>(null)

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

//   // Auth state
//   const [authInitialized, setAuthInitialized] = useState(false)
//   const [authRetryCount, setAuthRetryCount] = useState(0)
//   const [checkingAuthLocally, setCheckingAuthLocally] = useState(true)

//   // Responsive state
//   const [isMobile, setIsMobile] = useState(false)
//   const [showChat, setShowChat] = useState(false)

//   // Track previously selected match to prevent toggle behavior
//   const [lastSelectedMatchId, setLastSelectedMatchId] = useState<string | null>(
//     null
//   )

//   const matchIdFromUrl = searchParams.get('matchId')

//   // ============ RESPONSIVE HANDLING ============
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768)
//     }

//     checkMobile()
//     window.addEventListener('resize', checkMobile)

//     return () => window.removeEventListener('resize', checkMobile)
//   }, [])

//   // ============ AUTHENTICATION FIX - OPTIMIZED ============
//   useEffect(() => {
//     // Check if we have a token in cookies
//     const checkTokenInCookies = () => {
//       const cookies = document.cookie.split('; ')
//       const tokenCookie = cookies.find((row) => row.startsWith('token='))
//       return !!tokenCookie
//     }

//     const initializeAuth = async () => {
//       // First, check if we're already checking auth
//       if (checkingAuth || authUser) {
//         setCheckingAuthLocally(false)
//         return
//       }

//       // Check if we have a token in cookies first
//       const hasToken = checkTokenInCookies()

//       if (!hasToken) {
//         console.log('🚫 No token found in cookies, redirecting to login')
//         setCheckingAuthLocally(false)
//         router.push('/login')
//         return
//       }

//       // We have a token, but no authUser - try to check auth
//       try {
//         console.log('🔐 Token found, checking authentication...')
//         setCheckingAuthLocally(true)

//         // Dispatch check auth with retry logic
//         await dispatch(checkAuthRequest())

//         // Wait a moment for the auth check to complete
//         setTimeout(() => {
//           setCheckingAuthLocally(false)
//           setAuthInitialized(true)
//         }, 1000)
//       } catch (error) {
//         console.error('❌ Auth check error:', error)
//         setCheckingAuthLocally(false)
//       }
//     }

//     // Only run once on mount
//     if (!authInitialized) {
//       initializeAuth()
//     }
//   }, [dispatch, router, authInitialized])

//   // Handle auth state changes
//   useEffect(() => {
//     // If auth check is complete and we have no user, try one retry
//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount < 2
//     ) {
//       const timer = setTimeout(() => {
//         console.log(`🔄 Retry auth check (${authRetryCount + 1}/2)`)
//         setAuthRetryCount((prev) => prev + 1)
//         dispatch(checkAuthRequest())
//       }, 1000)

//       return () => clearTimeout(timer)
//     }

//     // If still no user after retries, redirect to login
//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount >= 2
//     ) {
//       console.log('🚫 Auth failed after retries, redirecting to login')

//       const timer = setTimeout(() => {
//         router.push('/login')
//       }, 1500)

//       return () => clearTimeout(timer)
//     }
//   }, [
//     checkingAuth,
//     checkingAuthLocally,
//     authUser,
//     authRetryCount,
//     dispatch,
//     router,
//   ])

//   // ============ LOAD MATCHES WHEN AUTHENTICATED ============
//   useEffect(() => {
//     if (authUser && !checkingAuth && !checkingAuthLocally) {
//       console.log('✅ User authenticated, loading matches...')
//       dispatch(getMatchesRequest())
//     }
//   }, [authUser, checkingAuth, checkingAuthLocally, dispatch])

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

//       const now = Date.now()
//       if (isTypingValue && now - lastTypingSentRef.current < 1000) {
//         return
//       }

//       webSocketService.sendTypingIndicator(currentMatch._id, isTypingValue)
//       lastTypingSentRef.current = now
//       isTypingRef.current = isTypingValue
//     },
//     [currentMatch, currentUserId]
//   )

//   const handleTyping = useCallback(() => {
//     if (!currentMatch || !currentUserId) return

//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current)
//     }

//     if (!isTypingRef.current) {
//       sendTypingIndicator(true)
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       if (isTypingRef.current) {
//         sendTypingIndicator(false)
//       }
//     }, 2000)
//   }, [currentMatch, currentUserId, sendTypingIndicator])

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value
//     setMessageInput(value)

//     if (value.trim().length > 0) {
//       handleTyping()
//     } else if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   // ============ MESSAGE EDITING FUNCTIONS ============
//   const startEditingMessage = (message: any) => {
//     if (message.sender !== currentUserId) return

//     setEditingMessageId(message._id)
//     setEditMessageContent(message.content)
//     setMessageInput(message.content)

//     // Focus on input
//     setTimeout(() => {
//       const input = document.querySelector(
//         'input[type="text"]'
//       ) as HTMLInputElement
//       input?.focus()
//     }, 100)
//   }

//   const cancelEditing = () => {
//     setEditingMessageId(null)
//     setEditMessageContent('')
//     setMessageInput('')
//   }

//   const saveEditedMessage = async () => {
//     if (!editingMessageId || !editMessageContent.trim() || !currentMatch) return

//     try {
//       await dispatch(
//         editMessageRequest({
//           messageId: editingMessageId,
//           matchId: currentMatch._id,
//           content: editMessageContent.trim(),
//         })
//       )

//       cancelEditing()
//     } catch (error) {
//       console.error('Failed to edit message:', error)
//     }
//   }

//   // ============ WEBSOCKET MANAGEMENT ============
//   useEffect(() => {
//     if (!authUser || checkingAuth) return

//     console.log('🔌 Setting up WebSocket...')

//     const initWebSocket = async () => {
//       try {
//         setConnectionStatus('connecting')
//         const connected = await webSocketService.connect()

//         if (connected) {
//           setConnectionStatus('connected')
//           setWebSocketConnected(true)

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

//     const unsubscribeCallbacks: (() => void)[] = []

//     webSocketService.onConnectionChange((connected: boolean) => {
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

//     const newMessageHandler = (message: any) => {
//       dispatch(newMessageReceived(message))

//       // Don't auto-scroll for receiver
//       if (
//         message.sender !== currentUserId &&
//         currentMatch?._id === message.matchId
//       ) {
//         // Track last unread message for scroll-to-unread feature
//         lastUnreadMessageRef.current = message._id
//       } else if (message.sender === currentUserId) {
//         // Auto-scroll only for sender's own messages
//         scrollToBottom()
//       }

//       if (
//         currentMatch?._id === message.matchId &&
//         message.sender !== currentUserId &&
//         !message.isRead &&
//         currentMatch
//       ) {
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

//     const typingHandler = (data: any) => {
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

//     const statusHandler = (data: any) => {
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

//     const statusBatchHandler = (statuses: any) => {
//       dispatch(setOnlineStatusBatch(statuses))
//     }

//     webSocketService.on('online-status-batch', statusBatchHandler)

//     const messagesReadHandler = (data: any) => {
//       if (data.userId !== currentUserId && data.matchId === currentMatch?._id) {
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

//     const onlineUsersHandler = (userIds: string[]) => {
//       if (userIds.length > 0) {
//         webSocketService.checkOnlineStatusBatch(userIds)
//       }
//     }

//     webSocketService.on('online-users', onlineUsersHandler)

//     return () => {
//       stopPolling()

//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       webSocketService.off('new-message', newMessageHandler)
//       webSocketService.off('user-typing', typingHandler)
//       webSocketService.off('user-status', statusHandler)
//       webSocketService.off('online-status-batch', statusBatchHandler)
//       webSocketService.off('messages-read', messagesReadHandler)
//       webSocketService.off('online-users', onlineUsersHandler)

//       unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
//     }
//   }, [authUser, checkingAuth, currentMatch, dispatch, messages, currentUserId])

//   // ============ MARK MESSAGES AS READ ============
//   useEffect(() => {
//     if (!currentMatch || !messages.length || !webSocketService.isConnected()) {
//       return
//     }

//     const unreadMessages = messages.filter(
//       (msg) =>
//         msg.matchId === currentMatch._id &&
//         msg.sender !== currentUserId &&
//         !msg.isRead
//     )

//     if (unreadMessages.length > 0) {
//       const messageIds = unreadMessages.map((msg) => msg._id)
//       webSocketService.markMessagesAsRead(currentMatch._id, messageIds)

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

//   // ============ HANDLE URL MATCH ID ============
//   useEffect(() => {
//     if (matchIdFromUrl && matches.length > 0) {
//       const match = matches.find((m) => m._id === matchIdFromUrl)
//       if (match && (!currentMatch || currentMatch._id !== matchIdFromUrl)) {
//         dispatch(setCurrentMatch(match))
//         setLastSelectedMatchId(match._id)
//         if (isMobile) {
//           setShowChat(true)
//         }
//       }
//     }
//   }, [matchIdFromUrl, matches, dispatch, currentMatch, isMobile])

//   // ============ LOAD INITIAL MESSAGES ============
//   useEffect(() => {
//     if (
//       currentMatch &&
//       authUser &&
//       initialMessagesLoadedRef.current !== currentMatch._id
//     ) {
//       initialMessagesLoadedRef.current = currentMatch._id

//       dispatch(getMessagesRequest({ matchId: currentMatch._id }))
//       dispatch(markMessagesReadRequest(currentMatch._id))

//       const params = new URLSearchParams(searchParams.toString())
//       params.set('matchId', currentMatch._id)
//       router.replace(`?${params.toString()}`, { scroll: false })

//       if (webSocketConnected) {
//         webSocketService.joinMatch(currentMatch._id)
//       } else {
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

//   // ============ POLLING FUNCTIONS ============
//   const stopPolling = useCallback(() => {
//     if (pollIntervalRef.current) {
//       clearInterval(pollIntervalRef.current)
//       pollIntervalRef.current = null
//       isPollingRef.current = false
//     }
//   }, [])

//   const startPolling = useCallback(
//     (matchId: string) => {
//       if (!matchId || isPollingRef.current) return

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
//               const existingIds = new Set(messages.map((msg) => msg._id))
//               const newMessages = data.messages.filter(
//                 (msg: any) =>
//                   !existingIds.has(msg._id) && !msg._id?.startsWith('temp-')
//               )

//               if (newMessages.length > 0) {
//                 newMessages.forEach((msg: any) => {
//                   dispatch(newMessageReceived(msg))
//                 })
//                 // Don't auto-scroll for polled messages
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
//       return
//     }

//     // If editing a message
//     if (editingMessageId) {
//       await saveEditedMessage()
//       return
//     }

//     const content = messageInput.trim()
//     setMessageInput('')

//     const tempId = `temp-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`

//     if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

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

//     scrollToBottom()

//     try {
//       if (webSocketService.isConnected()) {
//         const success = await webSocketService.sendMessage(
//           currentMatch._id,
//           content,
//           tempId
//         )

//         if (!success) {
//           dispatch(
//             sendMessageRequest({
//               matchId: currentMatch._id,
//               content,
//               tempId,
//             })
//           )
//         }
//       } else {
//         dispatch(
//           sendMessageRequest({
//             matchId: currentMatch._id,
//             content,
//             tempId,
//           })
//         )
//       }
//     } catch (error: any) {
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

//   const scrollToUnread = () => {
//     if (lastUnreadMessageRef.current) {
//       const unreadElement = document.getElementById(
//         `message-${lastUnreadMessageRef.current}`
//       )
//       if (unreadElement) {
//         unreadElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
//       }
//     } else {
//       scrollToBottom()
//     }
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

//     // Always show "Today" for today's messages
//     if (diffDays === 0) return 'Today'
//     if (diffDays === 1) return 'Yesterday'
//     if (diffDays < 7) return `${diffDays} days ago`

//     return date.toLocaleDateString()
//   }

//   const handleSelectMatch = (match: any) => {
//     // Telegram-like behavior: If clicking the same user again, do nothing
//     // Only switch if clicking a different user
//     if (currentMatch?._id === match._id) {
//       // Same user clicked - do nothing (no toggle)
//       return
//     }

//     // Different user clicked
//     if (isMobile) {
//       setShowChat(true)
//     }

//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(match))
//     setLastSelectedMatchId(match._id)

//     if (webSocketService.isConnected()) {
//       webSocketService.joinMatch(match._id)
//     }

//     const params = new URLSearchParams(searchParams.toString())
//     params.set('matchId', match._id)
//     router.replace(`?${params.toString()}`, { scroll: false })
//   }

//   const handleBack = () => {
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(null))
//     setShowChat(false)
//     setEditingMessageId(null)
//     setEditMessageContent('')
//     setLastSelectedMatchId(null)

//     const params = new URLSearchParams(searchParams.toString())
//     params.delete('matchId')
//     router.replace(`?${params.toString()}`, { scroll: false })
//   }

//   const reconnectWebSocket = async () => {
//     setConnectionStatus('connecting')

//     const connected = await webSocketService.connect()
//     if (connected) {
//       setConnectionStatus('connected')
//     } else {
//       setConnectionStatus('failed')
//     }
//   }

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

//   const handleInputBlur = () => {
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   const getMessageReadStatus = (message: any) => {
//     if (message.sender !== currentUserId) return null

//     if (message.isOptimistic || message._id?.startsWith('temp-')) {
//       return 'loading'
//     }

//     if (message.isRead) {
//       return 'read'
//     }

//     return 'sent'
//   }

//   // Find first unread message for the current match
//   const findFirstUnreadMessage = () => {
//     if (!currentMatch) return null

//     for (let i = messages.length - 1; i >= 0; i--) {
//       const message = messages[i]
//       if (
//         message.matchId === currentMatch._id &&
//         message.sender !== currentUserId &&
//         !message.isRead
//       ) {
//         return message
//       }
//     }
//     return null
//   }

//   const firstUnreadMessage = findFirstUnreadMessage()

//   // Determine what to show based on mobile and showChat state
//   const showUserList = !isMobile || !showChat
//   const showChatArea = !isMobile || showChat

//   // ============ RENDER LOGIC ============
//   // Show loading while checking auth
//   if ((checkingAuth || checkingAuthLocally) && !authUser) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Checking authentication...</p>
//           <p className='text-sm text-gray-400 mt-2'>
//             Please wait while we verify your session
//           </p>
//         </div>
//       </div>
//     )
//   }

//   // If not authenticated after all checks
//   if (!authUser && !checkingAuth && !checkingAuthLocally) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Session expired</p>
//           <p className='text-sm text-gray-400 mt-2'>Redirecting to login...</p>
//           <button
//             onClick={() => router.push('/login')}
//             className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
//           >
//             Go to Login Now
//           </button>
//         </div>
//       </div>
//     )
//   }

//   // If there's an error in messages slice
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
//         <div
//           className={`${
//             showUserList ? 'block' : 'hidden'
//           } md:block w-full md:w-80 bg-white border-r border-gray-200 flex flex-col`}
//         >
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
//         <div
//           className={`${
//             showChatArea ? 'block' : 'hidden'
//           } md:block flex-1 flex flex-col`}
//           ref={messagesContainerRef}
//         >
//           {currentMatch ? (
//             <>
//               {/* Chat Header */}
//               <div className='bg-white border-b border-gray-200 p-4'>
//                 <div className='flex items-center justify-between'>
//                   <div className='flex items-center'>
//                     <button
//                       onClick={handleBack}
//                       className={`${
//                         isMobile ? 'block' : 'md:hidden'
//                       } mr-3 text-gray-500 hover:text-gray-700`}
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
//                   <div className='flex items-center gap-4'>
//                     {/* Scroll to unread button */}
//                     {firstUnreadMessage && (
//                       <button
//                         onClick={scrollToUnread}
//                         className='px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1'
//                         title='Scroll to unread messages'
//                       >
//                         <span>Unread</span>
//                         <svg
//                           className='w-4 h-4'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M19 14l-7 7m0 0l-7-7m7 7V3'
//                           />
//                         </svg>
//                       </button>
//                     )}
//                     <div className='flex items-center gap-2'>
//                       <div
//                         className={`w-2 h-2 rounded-full ${
//                           webSocketConnected
//                             ? 'bg-green-500 animate-pulse'
//                             : 'bg-gray-400'
//                         }`}
//                       ></div>
//                       <p className='text-sm text-gray-500'>
//                         {webSocketConnected ? 'Live' : 'Polling'}
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
//                   <div className='space-y-6'>
//                     {Object.entries(groupedMessages).map(
//                       ([date, dateMessages]) => {
//                         // Check if any messages in this group are unread
//                         const hasUnreadMessages = dateMessages.some(
//                           (msg) => msg.sender !== currentUserId && !msg.isRead
//                         )

//                         return (
//                           <div key={date}>
//                             <div className='flex items-center justify-center my-4'>
//                               <div className='bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full'>
//                                 {formatDate(dateMessages[0].createdAt)}
//                               </div>
//                             </div>
//                             {/* Show unread marker if there are unread messages in this group */}
//                             {hasUnreadMessages && firstUnreadMessage && (
//                               <div className='flex items-center justify-center my-2'>
//                                 <div className='bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full flex items-center gap-1'>
//                                   <svg
//                                     className='w-3 h-3'
//                                     fill='currentColor'
//                                     viewBox='0 0 20 20'
//                                   >
//                                     <path
//                                       fillRule='evenodd'
//                                       d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
//                                       clipRule='evenodd'
//                                     />
//                                   </svg>
//                                   <span>Unread messages</span>
//                                 </div>
//                               </div>
//                             )}
//                             <div className='space-y-4'>
//                               {dateMessages.map(
//                                 (message: any, index: number) => {
//                                   const isCurrentUser =
//                                     message.sender === currentUserId
//                                   const isOptimistic =
//                                     message.isOptimistic ||
//                                     message._id?.startsWith('temp-')
//                                   const readStatus =
//                                     getMessageReadStatus(message)
//                                   const isEditing =
//                                     editingMessageId === message._id
//                                   const isUnread =
//                                     !isCurrentUser && !message.isRead
//                                   const isFirstUnread =
//                                     firstUnreadMessage?._id === message._id

//                                   return (
//                                     <div
//                                       key={message._id || index}
//                                       id={`message-${message._id}`}
//                                       className={`flex ${
//                                         isCurrentUser
//                                           ? 'justify-end'
//                                           : 'justify-start'
//                                       }`}
//                                     >
//                                       {/* Unread indicator for receiver's messages */}
//                                       {isUnread && (
//                                         <div className='flex items-center mr-2'>
//                                           <div className='w-2 h-2 bg-red-500 rounded-full'></div>
//                                         </div>
//                                       )}
//                                       <div
//                                         className={`max-w-[70%] rounded-2xl px-4 py-3 relative group ${
//                                           isCurrentUser
//                                             ? 'bg-blue-500 text-white rounded-br-none'
//                                             : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
//                                         } ${isOptimistic ? 'opacity-80' : ''} ${
//                                           isEditing
//                                             ? 'ring-2 ring-blue-300'
//                                             : ''
//                                         } ${
//                                           isFirstUnread
//                                             ? 'ring-2 ring-red-300'
//                                             : ''
//                                         }`}
//                                         onDoubleClick={() => {
//                                           if (isCurrentUser) {
//                                             startEditingMessage(message)
//                                           }
//                                         }}
//                                       >
//                                         {!isCurrentUser &&
//                                           message.senderId?.name && (
//                                             <p className='text-xs font-semibold text-gray-600 mb-1'>
//                                               {message.senderId.name}
//                                             </p>
//                                           )}

//                                         {isEditing ? (
//                                           <div className='mb-2'>
//                                             <input
//                                               type='text'
//                                               value={editMessageContent}
//                                               onChange={(e) =>
//                                                 setEditMessageContent(
//                                                   e.target.value
//                                                 )
//                                               }
//                                               className='w-full bg-blue-600 text-white px-3 py-2 rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300'
//                                               onKeyPress={(e) => {
//                                                 if (e.key === 'Enter') {
//                                                   saveEditedMessage()
//                                                 }
//                                                 if (e.key === 'Escape') {
//                                                   cancelEditing()
//                                                 }
//                                               }}
//                                               autoFocus
//                                             />
//                                             <div className='flex gap-2 mt-2'>
//                                               <button
//                                                 onClick={saveEditedMessage}
//                                                 className='px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600'
//                                               >
//                                                 Save
//                                               </button>
//                                               <button
//                                                 onClick={cancelEditing}
//                                                 className='px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600'
//                                               >
//                                                 Cancel
//                                               </button>
//                                             </div>
//                                           </div>
//                                         ) : (
//                                           <>
//                                             <p className='break-words'>
//                                               {message.content}
//                                             </p>
//                                             {isCurrentUser && (
//                                               <button
//                                                 onClick={() =>
//                                                   startEditingMessage(message)
//                                                 }
//                                                 className='absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md'
//                                                 title='Edit message'
//                                               >
//                                                 <svg
//                                                   className='w-3 h-3'
//                                                   fill='none'
//                                                   stroke='currentColor'
//                                                   viewBox='0 0 24 24'
//                                                 >
//                                                   <path
//                                                     strokeLinecap='round'
//                                                     strokeLinejoin='round'
//                                                     strokeWidth={2}
//                                                     d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
//                                                   />
//                                                 </svg>
//                                               </button>
//                                             )}
//                                           </>
//                                         )}

//                                         <div
//                                           className={`text-xs mt-1 flex items-center justify-between ${
//                                             isCurrentUser
//                                               ? 'text-blue-100'
//                                               : 'text-gray-400'
//                                           }`}
//                                         >
//                                           <span>
//                                             {formatTime(message.createdAt)}
//                                           </span>
//                                           {isCurrentUser && (
//                                             <span className='ml-2 flex items-center gap-1'>
//                                               {readStatus === 'loading' ? (
//                                                 <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
//                                               ) : readStatus === 'read' ? (
//                                                 <>
//                                                   <span>✓✓</span>
//                                                   <span className='ml-1'>
//                                                     Read
//                                                   </span>
//                                                 </>
//                                               ) : (
//                                                 '✓ Sent'
//                                               )}
//                                             </span>
//                                           )}
//                                         </div>
//                                       </div>
//                                     </div>
//                                   )
//                                 }
//                               )}
//                             </div>
//                           </div>
//                         )
//                       }
//                     )}

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
//                 {editingMessageId && (
//                   <div className='mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md'>
//                     <div className='flex items-center justify-between'>
//                       <span className='text-sm text-blue-700'>
//                         <span className='font-medium'>Editing message:</span>{' '}
//                         {editMessageContent.substring(0, 50)}
//                         {editMessageContent.length > 50 ? '...' : ''}
//                       </span>
//                       <button
//                         onClick={cancelEditing}
//                         className='text-blue-700 hover:text-blue-900'
//                       >
//                         <svg
//                           className='w-4 h-4'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M6 18L18 6M6 6l12 12'
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                 )}
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
//                       if (e.key === 'Escape' && editingMessageId) {
//                         cancelEditing()
//                       }
//                     }}
//                     placeholder={
//                       editingMessageId
//                         ? 'Edit your message...'
//                         : 'Type a message...'
//                     }
//                     className='flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
//                   />
//                   <button
//                     onClick={sendMessage}
//                     disabled={!messageInput.trim()}
//                     className={`ml-3 ${
//                       editingMessageId
//                         ? 'bg-green-500 hover:bg-green-600'
//                         : 'bg-blue-500 hover:bg-blue-600'
//                     } text-white rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
//                   >
//                     {editingMessageId ? (
//                       <svg
//                         className='w-5 h-5'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M5 13l4 4L19 7'
//                         />
//                       </svg>
//                     ) : (
//                       <svg
//                         className='w-5 h-5'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
//                         />
//                       </svg>
//                     )}
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
//   editMessageRequest,
//   clearMessages,
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
//   const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
//   const [editMessageContent, setEditMessageContent] = useState('')
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const messagesContainerRef = useRef<HTMLDivElement>(null)
//   const lastUnreadMessageRef = useRef<string | null>(null)

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

//   // Auth state
//   const [authInitialized, setAuthInitialized] = useState(false)
//   const [authRetryCount, setAuthRetryCount] = useState(0)
//   const [checkingAuthLocally, setCheckingAuthLocally] = useState(true)

//   // Responsive state - FIXED: Start with proper mobile state
//   const [isMobile, setIsMobile] = useState(false)
//   const [showChat, setShowChat] = useState(false)

//   const matchIdFromUrl = searchParams.get('matchId')

//   // ============ RESPONSIVE HANDLING ============
//   useEffect(() => {
//     const checkMobile = () => {
//       const mobile = window.innerWidth < 768
//       setIsMobile(mobile)

//       // On mobile: Always start with matches list (not chat)
//       // On desktop: Always show both panels
//       if (mobile) {
//         // If there's a currentMatch from URL or state, show chat
//         if (currentMatch) {
//           setShowChat(true)
//         } else {
//           setShowChat(false)
//         }
//       } else {
//         setShowChat(true) // Desktop: show both
//       }
//     }

//     checkMobile()
//     window.addEventListener('resize', checkMobile)

//     return () => window.removeEventListener('resize', checkMobile)
//   }, [currentMatch])

//   // ============ AUTHENTICATION FIX - OPTIMIZED ============
//   useEffect(() => {
//     const checkTokenInCookies = () => {
//       const cookies = document.cookie.split('; ')
//       const tokenCookie = cookies.find((row) => row.startsWith('token='))
//       return !!tokenCookie
//     }

//     const initializeAuth = async () => {
//       if (checkingAuth || authUser) {
//         setCheckingAuthLocally(false)
//         return
//       }

//       const hasToken = checkTokenInCookies()

//       if (!hasToken) {
//         console.log('🚫 No token found in cookies, redirecting to login')
//         setCheckingAuthLocally(false)
//         router.push('/login')
//         return
//       }

//       try {
//         console.log('🔐 Token found, checking authentication...')
//         setCheckingAuthLocally(true)

//         await dispatch(checkAuthRequest())

//         setTimeout(() => {
//           setCheckingAuthLocally(false)
//           setAuthInitialized(true)
//         }, 1000)
//       } catch (error) {
//         console.error('❌ Auth check error:', error)
//         setCheckingAuthLocally(false)
//       }
//     }

//     if (!authInitialized) {
//       initializeAuth()
//     }
//   }, [dispatch, router, authInitialized])

//   // Handle auth state changes
//   useEffect(() => {
//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount < 2
//     ) {
//       const timer = setTimeout(() => {
//         console.log(`🔄 Retry auth check (${authRetryCount + 1}/2)`)
//         setAuthRetryCount((prev) => prev + 1)
//         dispatch(checkAuthRequest())
//       }, 1000)

//       return () => clearTimeout(timer)
//     }

//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount >= 2
//     ) {
//       console.log('🚫 Auth failed after retries, redirecting to login')

//       const timer = setTimeout(() => {
//         router.push('/login')
//       }, 1500)

//       return () => clearTimeout(timer)
//     }
//   }, [
//     checkingAuth,
//     checkingAuthLocally,
//     authUser,
//     authRetryCount,
//     dispatch,
//     router,
//   ])

//   // ============ LOAD MATCHES WHEN AUTHENTICATED ============
//   useEffect(() => {
//     if (authUser && !checkingAuth && !checkingAuthLocally) {
//       console.log('✅ User authenticated, loading matches...')
//       dispatch(getMatchesRequest())
//     }
//   }, [authUser, checkingAuth, checkingAuthLocally, dispatch])

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

//       const now = Date.now()
//       if (isTypingValue && now - lastTypingSentRef.current < 1000) {
//         return
//       }

//       webSocketService.sendTypingIndicator(currentMatch._id, isTypingValue)
//       lastTypingSentRef.current = now
//       isTypingRef.current = isTypingValue
//     },
//     [currentMatch, currentUserId]
//   )

//   const handleTyping = useCallback(() => {
//     if (!currentMatch || !currentUserId) return

//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current)
//     }

//     if (!isTypingRef.current) {
//       sendTypingIndicator(true)
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       if (isTypingRef.current) {
//         sendTypingIndicator(false)
//       }
//     }, 2000)
//   }, [currentMatch, currentUserId, sendTypingIndicator])

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value
//     setMessageInput(value)

//     if (value.trim().length > 0) {
//       handleTyping()
//     } else if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   // ============ MESSAGE EDITING FUNCTIONS ============
//   const startEditingMessage = (message: any) => {
//     if (message.sender !== currentUserId) return

//     setEditingMessageId(message._id)
//     setEditMessageContent(message.content)
//     setMessageInput(message.content)

//     setTimeout(() => {
//       const input = document.querySelector(
//         'input[type="text"]'
//       ) as HTMLInputElement
//       input?.focus()
//     }, 100)
//   }

//   const cancelEditing = () => {
//     setEditingMessageId(null)
//     setEditMessageContent('')
//     setMessageInput('')
//   }

//   const saveEditedMessage = async () => {
//     if (!editingMessageId || !editMessageContent.trim() || !currentMatch) return

//     try {
//       await dispatch(
//         editMessageRequest({
//           messageId: editingMessageId,
//           matchId: currentMatch._id,
//           content: editMessageContent.trim(),
//         })
//       )

//       cancelEditing()
//     } catch (error) {
//       console.error('Failed to edit message:', error)
//     }
//   }

//   // ============ WEBSOCKET MANAGEMENT ============
//   useEffect(() => {
//     if (!authUser || checkingAuth) return

//     console.log('🔌 Setting up WebSocket...')

//     const initWebSocket = async () => {
//       try {
//         setConnectionStatus('connecting')
//         const connected = await webSocketService.connect()

//         if (connected) {
//           setConnectionStatus('connected')
//           setWebSocketConnected(true)

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

//     const unsubscribeCallbacks: (() => void)[] = []

//     webSocketService.onConnectionChange((connected: boolean) => {
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

//     const newMessageHandler = (message: any) => {
//       dispatch(newMessageReceived(message))

//       if (
//         message.sender !== currentUserId &&
//         currentMatch?._id === message.matchId
//       ) {
//         lastUnreadMessageRef.current = message._id
//       } else if (message.sender === currentUserId) {
//         scrollToBottom()
//       }

//       if (
//         currentMatch?._id === message.matchId &&
//         message.sender !== currentUserId &&
//         !message.isRead &&
//         currentMatch
//       ) {
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

//     const typingHandler = (data: any) => {
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

//     const statusHandler = (data: any) => {
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

//     const statusBatchHandler = (statuses: any) => {
//       dispatch(setOnlineStatusBatch(statuses))
//     }

//     webSocketService.on('online-status-batch', statusBatchHandler)

//     const messagesReadHandler = (data: any) => {
//       if (data.userId !== currentUserId && data.matchId === currentMatch?._id) {
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

//     const onlineUsersHandler = (userIds: string[]) => {
//       if (userIds.length > 0) {
//         webSocketService.checkOnlineStatusBatch(userIds)
//       }
//     }

//     webSocketService.on('online-users', onlineUsersHandler)

//     return () => {
//       stopPolling()

//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       webSocketService.off('new-message', newMessageHandler)
//       webSocketService.off('user-typing', typingHandler)
//       webSocketService.off('user-status', statusHandler)
//       webSocketService.off('online-status-batch', statusBatchHandler)
//       webSocketService.off('messages-read', messagesReadHandler)
//       webSocketService.off('online-users', onlineUsersHandler)

//       unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
//     }
//   }, [authUser, checkingAuth, currentMatch, dispatch, messages, currentUserId])

//   // ============ MARK MESSAGES AS READ ============
//   useEffect(() => {
//     if (!currentMatch || !messages.length || !webSocketService.isConnected()) {
//       return
//     }

//     const unreadMessages = messages.filter(
//       (msg) =>
//         msg.matchId === currentMatch._id &&
//         msg.sender !== currentUserId &&
//         !msg.isRead
//     )

//     if (unreadMessages.length > 0) {
//       const messageIds = unreadMessages.map((msg) => msg._id)
//       webSocketService.markMessagesAsRead(currentMatch._id, messageIds)

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

//   // ============ HANDLE URL MATCH ID - SIMPLIFIED ============
//   useEffect(() => {
//     if (matchIdFromUrl && matches.length > 0) {
//       const match = matches.find((m) => m._id === matchIdFromUrl)
//       if (match) {
//         // Only set if it's a different match
//         if (!currentMatch || currentMatch._id !== matchIdFromUrl) {
//           handleSelectMatch(match)
//         }

//         // Always show chat on mobile when there's a matchId in URL
//         if (isMobile) {
//           setShowChat(true)
//         }
//       }
//     }
//   }, [matchIdFromUrl, matches, isMobile])

//   // ============ LOAD INITIAL MESSAGES ============
//   useEffect(() => {
//     if (
//       currentMatch &&
//       authUser &&
//       initialMessagesLoadedRef.current !== currentMatch._id
//     ) {
//       console.log(`📨 Loading messages for match: ${currentMatch._id}`)
//       initialMessagesLoadedRef.current = currentMatch._id

//       // Clear previous messages first
//       dispatch(clearMessages())

//       // Load messages for the new match
//       dispatch(getMessagesRequest({ matchId: currentMatch._id }))
//       dispatch(markMessagesReadRequest(currentMatch._id))

//       // Update URL
//       const params = new URLSearchParams(searchParams.toString())
//       params.set('matchId', currentMatch._id)
//       router.replace(`?${params.toString()}`, { scroll: false })

//       if (webSocketConnected) {
//         webSocketService.joinMatch(currentMatch._id)
//       } else {
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

//   // ============ POLLING FUNCTIONS ============
//   const stopPolling = useCallback(() => {
//     if (pollIntervalRef.current) {
//       clearInterval(pollIntervalRef.current)
//       pollIntervalRef.current = null
//       isPollingRef.current = false
//     }
//   }, [])

//   const startPolling = useCallback(
//     (matchId: string) => {
//       if (!matchId || isPollingRef.current) return

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
//               const existingIds = new Set(messages.map((msg) => msg._id))
//               const newMessages = data.messages.filter(
//                 (msg: any) =>
//                   !existingIds.has(msg._id) && !msg._id?.startsWith('temp-')
//               )

//               if (newMessages.length > 0) {
//                 newMessages.forEach((msg: any) => {
//                   dispatch(newMessageReceived(msg))
//                 })
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
//       return
//     }

//     // If editing a message
//     if (editingMessageId) {
//       await saveEditedMessage()
//       return
//     }

//     const content = messageInput.trim()
//     setMessageInput('')

//     const tempId = `temp-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`

//     if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

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

//     scrollToBottom()

//     try {
//       if (webSocketService.isConnected()) {
//         const success = await webSocketService.sendMessage(
//           currentMatch._id,
//           content,
//           tempId
//         )

//         if (!success) {
//           dispatch(
//             sendMessageRequest({
//               matchId: currentMatch._id,
//               content,
//               tempId,
//             })
//           )
//         }
//       } else {
//         dispatch(
//           sendMessageRequest({
//             matchId: currentMatch._id,
//             content,
//             tempId,
//           })
//         )
//       }
//     } catch (error: any) {
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

//   const scrollToUnread = () => {
//     if (lastUnreadMessageRef.current) {
//       const unreadElement = document.getElementById(
//         `message-${lastUnreadMessageRef.current}`
//       )
//       if (unreadElement) {
//         unreadElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
//       }
//     } else {
//       scrollToBottom()
//     }
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

//   // ============ FIXED: handleSelectMatch function ============
//   const handleSelectMatch = (match: any) => {
//     console.log(`🔄 Selecting match: ${match._id}`)

//     // If clicking the same user, just ensure chat is shown
//     if (currentMatch?._id === match._id) {
//       if (isMobile) {
//         setShowChat(true)
//       }
//       return
//     }

//     // Reset any existing typing
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     // Leave previous match WebSocket room
//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     // Clear previous messages state
//     dispatch(clearMessages())
//     initialMessagesLoadedRef.current = null

//     // Set new match and show chat
//     dispatch(setCurrentMatch(match))

//     if (isMobile) {
//       setShowChat(true) // Show chat on mobile when selecting a match
//     }

//     // Update URL immediately
//     const params = new URLSearchParams(searchParams.toString())
//     params.set('matchId', match._id)
//     router.replace(`?${params.toString()}`, { scroll: false })

//     // Load messages after a small delay
//     setTimeout(() => {
//       dispatch(getMessagesRequest({ matchId: match._id }))
//       dispatch(markMessagesReadRequest(match._id))

//       if (webSocketService.isConnected()) {
//         webSocketService.joinMatch(match._id)
//       } else {
//         startPolling(match._id)
//       }
//     }, 50)
//   }

//   // ============ FIXED: handleBack function ============
//   const handleBack = () => {
//     console.log('🔙 Going back to matches list')

//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     // Clear WebSocket subscriptions
//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     // Clear current match and messages from state
//     dispatch(setCurrentMatch(null))
//     dispatch(clearMessages())

//     // Reset chat view - ALWAYS hide chat on mobile when going back
//     setShowChat(false)
//     setEditingMessageId(null)
//     setEditMessageContent('')
//     setMessageInput('')

//     // Reset the initial messages loaded ref
//     initialMessagesLoadedRef.current = null

//     // Update URL - remove matchId
//     const params = new URLSearchParams(searchParams.toString())
//     params.delete('matchId')
//     router.replace(`?${params.toString()}`, { scroll: false })

//     // Scroll to top of matches list
//     setTimeout(() => {
//       if (messagesContainerRef.current) {
//         messagesContainerRef.current.scrollTop = 0
//       }
//     }, 50)
//   }

//   const reconnectWebSocket = async () => {
//     setConnectionStatus('connecting')

//     const connected = await webSocketService.connect()
//     if (connected) {
//       setConnectionStatus('connected')
//     } else {
//       setConnectionStatus('failed')
//     }
//   }

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

//   const handleInputBlur = () => {
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   const getMessageReadStatus = (message: any) => {
//     if (message.sender !== currentUserId) return null

//     if (message.isOptimistic || message._id?.startsWith('temp-')) {
//       return 'loading'
//     }

//     if (message.isRead) {
//       return 'read'
//     }

//     return 'sent'
//   }

//   // Find first unread message for the current match
//   const findFirstUnreadMessage = () => {
//     if (!currentMatch) return null

//     for (let i = messages.length - 1; i >= 0; i--) {
//       const message = messages[i]
//       if (
//         message.matchId === currentMatch._id &&
//         message.sender !== currentUserId &&
//         !message.isRead
//       ) {
//         return message
//       }
//     }
//     return null
//   }

//   const firstUnreadMessage = findFirstUnreadMessage()

//   // ============ SIMPLIFIED: Determine what to show ============
//   // Mobile: show user list when showChat is false, show chat when showChat is true
//   // Desktop: always show both
//   const showUserList = !isMobile || !showChat
//   const showChatArea = !isMobile || showChat

//   // ============ Component Cleanup ============
//   useEffect(() => {
//     return () => {
//       // Cleanup on component unmount
//       stopPolling()

//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       // Reset refs
//       initialMessagesLoadedRef.current = null
//       isPollingRef.current = false
//       isTypingRef.current = false
//     }
//   }, [currentMatch, stopPolling])

//   // ============ RENDER LOGIC ============
//   // Show loading while checking auth
//   if ((checkingAuth || checkingAuthLocally) && !authUser) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Checking authentication...</p>
//           <p className='text-sm text-gray-400 mt-2'>
//             Please wait while we verify your session
//           </p>
//         </div>
//       </div>
//     )
//   }

//   // If not authenticated after all checks
//   if (!authUser && !checkingAuth && !checkingAuthLocally) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Session expired</p>
//           <p className='text-sm text-gray-400 mt-2'>Redirecting to login...</p>
//           <button
//             onClick={() => router.push('/login')}
//             className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
//           >
//             Go to Login Now
//           </button>
//         </div>
//       </div>
//     )
//   }

//   // If there's an error in messages slice
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
//         {/* Left Sidebar - Matches List - ALWAYS SHOWN ON MOBILE WHEN NOT IN CHAT */}
//         <div
//           className={`${
//             showUserList ? 'block' : 'hidden'
//           } md:block w-full md:w-80 bg-white border-r border-gray-200 flex flex-col`}
//         >
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

//         {/* Right Side - Chat Area - HIDDEN ON MOBILE WHEN NOT SELECTED */}
//         <div
//           className={`${
//             showChatArea ? 'block' : 'hidden'
//           } md:block flex-1 flex flex-col`}
//           ref={messagesContainerRef}
//         >
//           {currentMatch ? (
//             <>
//               {/* Chat Header */}
//               <div className='bg-white border-b border-gray-200 p-4'>
//                 <div className='flex items-center justify-between'>
//                   <div className='flex items-center'>
//                     {/* Back button - ALWAYS VISIBLE ON MOBILE */}
//                     <button
//                       onClick={handleBack}
//                       className={`${
//                         isMobile ? 'block' : 'md:hidden'
//                       } mr-3 text-gray-500 hover:text-gray-700`}
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
//                   <div className='flex items-center gap-4'>
//                     {/* Scroll to unread button */}
//                     {firstUnreadMessage && (
//                       <button
//                         onClick={scrollToUnread}
//                         className='px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1'
//                         title='Scroll to unread messages'
//                       >
//                         <span>Unread</span>
//                         <svg
//                           className='w-4 h-4'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M19 14l-7 7m0 0l-7-7m7 7V3'
//                           />
//                         </svg>
//                       </button>
//                     )}
//                     <div className='flex items-center gap-2'>
//                       <div
//                         className={`w-2 h-2 rounded-full ${
//                           webSocketConnected
//                             ? 'bg-green-500 animate-pulse'
//                             : 'bg-gray-400'
//                         }`}
//                       ></div>
//                       <p className='text-sm text-gray-500'>
//                         {webSocketConnected ? 'Live' : 'Polling'}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Messages Container */}
//               <div className='flex-1 overflow-y-auto p-4 bg-gray-50'>
//                 {loading &&
//                 initialMessagesLoadedRef.current !== currentMatch?._id ? (
//                   <div className='flex items-center justify-center h-full'>
//                     <div className='text-center'>
//                       <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//                       <p className='text-gray-600'>Loading messages...</p>
//                     </div>
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
//                       ([date, dateMessages]) => {
//                         const hasUnreadMessages = dateMessages.some(
//                           (msg) => msg.sender !== currentUserId && !msg.isRead
//                         )

//                         return (
//                           <div key={date}>
//                             <div className='flex items-center justify-center my-4'>
//                               <div className='bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full'>
//                                 {formatDate(dateMessages[0].createdAt)}
//                               </div>
//                             </div>
//                             {hasUnreadMessages && firstUnreadMessage && (
//                               <div className='flex items-center justify-center my-2'>
//                                 <div className='bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full flex items-center gap-1'>
//                                   <svg
//                                     className='w-3 h-3'
//                                     fill='currentColor'
//                                     viewBox='0 0 20 20'
//                                   >
//                                     <path
//                                       fillRule='evenodd'
//                                       d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
//                                       clipRule='evenodd'
//                                     />
//                                   </svg>
//                                   <span>Unread messages</span>
//                                 </div>
//                               </div>
//                             )}
//                             <div className='space-y-4'>
//                               {dateMessages.map(
//                                 (message: any, index: number) => {
//                                   const isCurrentUser =
//                                     message.sender === currentUserId
//                                   const isOptimistic =
//                                     message.isOptimistic ||
//                                     message._id?.startsWith('temp-')
//                                   const readStatus =
//                                     getMessageReadStatus(message)
//                                   const isEditing =
//                                     editingMessageId === message._id
//                                   const isUnread =
//                                     !isCurrentUser && !message.isRead
//                                   const isFirstUnread =
//                                     firstUnreadMessage?._id === message._id

//                                   return (
//                                     <div
//                                       key={message._id || index}
//                                       id={`message-${message._id}`}
//                                       className={`flex ${
//                                         isCurrentUser
//                                           ? 'justify-end'
//                                           : 'justify-start'
//                                       }`}
//                                     >
//                                       {isUnread && (
//                                         <div className='flex items-center mr-2'>
//                                           <div className='w-2 h-2 bg-red-500 rounded-full'></div>
//                                         </div>
//                                       )}
//                                       <div
//                                         className={`max-w-[70%] rounded-2xl px-4 py-3 relative group ${
//                                           isCurrentUser
//                                             ? 'bg-blue-500 text-white rounded-br-none'
//                                             : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
//                                         } ${isOptimistic ? 'opacity-80' : ''} ${
//                                           isEditing
//                                             ? 'ring-2 ring-blue-300'
//                                             : ''
//                                         } ${
//                                           isFirstUnread
//                                             ? 'ring-2 ring-red-300'
//                                             : ''
//                                         }`}
//                                         onDoubleClick={() => {
//                                           if (isCurrentUser) {
//                                             startEditingMessage(message)
//                                           }
//                                         }}
//                                       >
//                                         {!isCurrentUser &&
//                                           message.senderId?.name && (
//                                             <p className='text-xs font-semibold text-gray-600 mb-1'>
//                                               {message.senderId.name}
//                                             </p>
//                                           )}

//                                         {isEditing ? (
//                                           <div className='mb-2'>
//                                             <input
//                                               type='text'
//                                               value={editMessageContent}
//                                               onChange={(e) =>
//                                                 setEditMessageContent(
//                                                   e.target.value
//                                                 )
//                                               }
//                                               className='w-full bg-blue-600 text-white px-3 py-2 rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300'
//                                               onKeyPress={(e) => {
//                                                 if (e.key === 'Enter') {
//                                                   saveEditedMessage()
//                                                 }
//                                                 if (e.key === 'Escape') {
//                                                   cancelEditing()
//                                                 }
//                                               }}
//                                               autoFocus
//                                             />
//                                             <div className='flex gap-2 mt-2'>
//                                               <button
//                                                 onClick={saveEditedMessage}
//                                                 className='px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600'
//                                               >
//                                                 Save
//                                               </button>
//                                               <button
//                                                 onClick={cancelEditing}
//                                                 className='px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600'
//                                               >
//                                                 Cancel
//                                               </button>
//                                             </div>
//                                           </div>
//                                         ) : (
//                                           <>
//                                             <p className='break-words'>
//                                               {message.content}
//                                             </p>
//                                             {isCurrentUser && (
//                                               <button
//                                                 onClick={() =>
//                                                   startEditingMessage(message)
//                                                 }
//                                                 className='absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md'
//                                                 title='Edit message'
//                                               >
//                                                 <svg
//                                                   className='w-3 h-3'
//                                                   fill='none'
//                                                   stroke='currentColor'
//                                                   viewBox='0 0 24 24'
//                                                 >
//                                                   <path
//                                                     strokeLinecap='round'
//                                                     strokeLinejoin='round'
//                                                     strokeWidth={2}
//                                                     d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
//                                                   />
//                                                 </svg>
//                                               </button>
//                                             )}
//                                           </>
//                                         )}

//                                         <div
//                                           className={`text-xs mt-1 flex items-center justify-between ${
//                                             isCurrentUser
//                                               ? 'text-blue-100'
//                                               : 'text-gray-400'
//                                           }`}
//                                         >
//                                           <span>
//                                             {formatTime(message.createdAt)}
//                                           </span>
//                                           {isCurrentUser && (
//                                             <span className='ml-2 flex items-center gap-1'>
//                                               {readStatus === 'loading' ? (
//                                                 <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
//                                               ) : readStatus === 'read' ? (
//                                                 <>
//                                                   <span>✓✓</span>
//                                                   <span className='ml-1'>
//                                                     Read
//                                                   </span>
//                                                 </>
//                                               ) : (
//                                                 '✓ Sent'
//                                               )}
//                                             </span>
//                                           )}
//                                         </div>
//                                       </div>
//                                     </div>
//                                   )
//                                 }
//                               )}
//                             </div>
//                           </div>
//                         )
//                       }
//                     )}

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
//                 {editingMessageId && (
//                   <div className='mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md'>
//                     <div className='flex items-center justify-between'>
//                       <span className='text-sm text-blue-700'>
//                         <span className='font-medium'>Editing message:</span>{' '}
//                         {editMessageContent.substring(0, 50)}
//                         {editMessageContent.length > 50 ? '...' : ''}
//                       </span>
//                       <button
//                         onClick={cancelEditing}
//                         className='text-blue-700 hover:text-blue-900'
//                       >
//                         <svg
//                           className='w-4 h-4'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M6 18L18 6M6 6l12 12'
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                 )}
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
//                       if (e.key === 'Escape' && editingMessageId) {
//                         cancelEditing()
//                       }
//                     }}
//                     placeholder={
//                       editingMessageId
//                         ? 'Edit your message...'
//                         : 'Type a message...'
//                     }
//                     className='flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
//                   />
//                   <button
//                     onClick={sendMessage}
//                     disabled={!messageInput.trim()}
//                     className={`ml-3 ${
//                       editingMessageId
//                         ? 'bg-green-500 hover:bg-green-600'
//                         : 'bg-blue-500 hover:bg-blue-600'
//                     } text-white rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
//                   >
//                     {editingMessageId ? (
//                       <svg
//                         className='w-5 h-5'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M5 13l4 4L19 7'
//                         />
//                       </svg>
//                     ) : (
//                       <svg
//                         className='w-5 h-5'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
//                         />
//                       </svg>
//                     )}
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
//             // Empty state when no chat is selected on desktop
//             <div className='flex-1 flex flex-col items-center justify-center p-8 md:block hidden'>
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
//   editMessageRequest,
//   clearMessages,
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
//   const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
//   const [editMessageContent, setEditMessageContent] = useState('')
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const messagesContainerRef = useRef<HTMLDivElement>(null)
//   const lastUnreadMessageRef = useRef<string | null>(null)

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

//   // Auth state
//   const [authInitialized, setAuthInitialized] = useState(false)
//   const [authRetryCount, setAuthRetryCount] = useState(0)
//   const [checkingAuthLocally, setCheckingAuthLocally] = useState(true)

//   // Responsive state
//   const [isMobile, setIsMobile] = useState(false)
//   const [showChat, setShowChat] = useState(false)

//   const matchIdFromUrl = searchParams.get('matchId')

//   // ============ RESPONSIVE HANDLING ============
//   useEffect(() => {
//     const checkMobile = () => {
//       const mobile = window.innerWidth < 768
//       setIsMobile(mobile)

//       if (mobile) {
//         if (currentMatch) {
//           setShowChat(true)
//         } else {
//           setShowChat(false)
//         }
//       } else {
//         setShowChat(true)
//       }
//     }

//     checkMobile()
//     window.addEventListener('resize', checkMobile)

//     return () => window.removeEventListener('resize', checkMobile)
//   }, [currentMatch])

//   // ============ AUTHENTICATION FIX - OPTIMIZED ============
//   useEffect(() => {
//     const checkTokenInCookies = () => {
//       const cookies = document.cookie.split('; ')
//       const tokenCookie = cookies.find((row) => row.startsWith('token='))
//       return !!tokenCookie
//     }

//     const initializeAuth = async () => {
//       if (checkingAuth || authUser) {
//         setCheckingAuthLocally(false)
//         return
//       }

//       const hasToken = checkTokenInCookies()

//       if (!hasToken) {
//         console.log('🚫 No token found in cookies, redirecting to login')
//         setCheckingAuthLocally(false)
//         router.push('/login')
//         return
//       }

//       try {
//         console.log('🔐 Token found, checking authentication...')
//         setCheckingAuthLocally(true)

//         await dispatch(checkAuthRequest())

//         setTimeout(() => {
//           setCheckingAuthLocally(false)
//           setAuthInitialized(true)
//         }, 1000)
//       } catch (error) {
//         console.error('❌ Auth check error:', error)
//         setCheckingAuthLocally(false)
//       }
//     }

//     if (!authInitialized) {
//       initializeAuth()
//     }
//   }, [dispatch, router, authInitialized])

//   // Handle auth state changes
//   useEffect(() => {
//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount < 2
//     ) {
//       const timer = setTimeout(() => {
//         console.log(`🔄 Retry auth check (${authRetryCount + 1}/2)`)
//         setAuthRetryCount((prev) => prev + 1)
//         dispatch(checkAuthRequest())
//       }, 1000)

//       return () => clearTimeout(timer)
//     }

//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount >= 2
//     ) {
//       console.log('🚫 Auth failed after retries, redirecting to login')

//       const timer = setTimeout(() => {
//         router.push('/login')
//       }, 1500)

//       return () => clearTimeout(timer)
//     }
//   }, [
//     checkingAuth,
//     checkingAuthLocally,
//     authUser,
//     authRetryCount,
//     dispatch,
//     router,
//   ])

//   // ============ LOAD MATCHES WHEN AUTHENTICATED ============
//   useEffect(() => {
//     if (authUser && !checkingAuth && !checkingAuthLocally) {
//       console.log('✅ User authenticated, loading matches...')
//       dispatch(getMatchesRequest())
//     }
//   }, [authUser, checkingAuth, checkingAuthLocally, dispatch])

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

//       const now = Date.now()
//       if (isTypingValue && now - lastTypingSentRef.current < 1000) {
//         return
//       }

//       webSocketService.sendTypingIndicator(currentMatch._id, isTypingValue)
//       lastTypingSentRef.current = now
//       isTypingRef.current = isTypingValue
//     },
//     [currentMatch, currentUserId]
//   )

//   const handleTyping = useCallback(() => {
//     if (!currentMatch || !currentUserId) return

//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current)
//     }

//     if (!isTypingRef.current) {
//       sendTypingIndicator(true)
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       if (isTypingRef.current) {
//         sendTypingIndicator(false)
//       }
//     }, 2000)
//   }, [currentMatch, currentUserId, sendTypingIndicator])

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value
//     setMessageInput(value)

//     if (value.trim().length > 0) {
//       handleTyping()
//     } else if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   // ============ MESSAGE EDITING FUNCTIONS ============
//   const startEditingMessage = (message: any) => {
//     if (message.sender !== currentUserId) return

//     setEditingMessageId(message._id)
//     setEditMessageContent(message.content)
//     setMessageInput(message.content)

//     setTimeout(() => {
//       const input = document.querySelector(
//         'input[type="text"]'
//       ) as HTMLInputElement
//       input?.focus()
//     }, 100)
//   }

//   const cancelEditing = () => {
//     setEditingMessageId(null)
//     setEditMessageContent('')
//     setMessageInput('')
//   }

//   const saveEditedMessage = async () => {
//     if (!editingMessageId || !editMessageContent.trim() || !currentMatch) return

//     try {
//       await dispatch(
//         editMessageRequest({
//           messageId: editingMessageId,
//           matchId: currentMatch._id,
//           content: editMessageContent.trim(),
//         })
//       )

//       cancelEditing()
//     } catch (error) {
//       console.error('Failed to edit message:', error)
//     }
//   }

//   // ============ WEBSOCKET MANAGEMENT ============
//   useEffect(() => {
//     if (!authUser || checkingAuth) return

//     console.log('🔌 Setting up WebSocket...')

//     const initWebSocket = async () => {
//       try {
//         setConnectionStatus('connecting')
//         const connected = await webSocketService.connect()

//         if (connected) {
//           setConnectionStatus('connected')
//           setWebSocketConnected(true)

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

//     const unsubscribeCallbacks: (() => void)[] = []

//     webSocketService.onConnectionChange((connected: boolean) => {
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

//     const newMessageHandler = (message: any) => {
//       dispatch(newMessageReceived(message))

//       if (
//         message.sender !== currentUserId &&
//         currentMatch?._id === message.matchId
//       ) {
//         lastUnreadMessageRef.current = message._id
//       } else if (message.sender === currentUserId) {
//         scrollToBottom()
//       }

//       if (
//         currentMatch?._id === message.matchId &&
//         message.sender !== currentUserId &&
//         !message.isRead &&
//         currentMatch
//       ) {
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

//     const typingHandler = (data: any) => {
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

//     const statusHandler = (data: any) => {
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

//     const statusBatchHandler = (statuses: any) => {
//       dispatch(setOnlineStatusBatch(statuses))
//     }

//     webSocketService.on('online-status-batch', statusBatchHandler)

//     const messagesReadHandler = (data: any) => {
//       if (data.userId !== currentUserId && data.matchId === currentMatch?._id) {
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

//     const onlineUsersHandler = (userIds: string[]) => {
//       if (userIds.length > 0) {
//         webSocketService.checkOnlineStatusBatch(userIds)
//       }
//     }

//     webSocketService.on('online-users', onlineUsersHandler)

//     return () => {
//       stopPolling()

//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       webSocketService.off('new-message', newMessageHandler)
//       webSocketService.off('user-typing', typingHandler)
//       webSocketService.off('user-status', statusHandler)
//       webSocketService.off('online-status-batch', statusBatchHandler)
//       webSocketService.off('messages-read', messagesReadHandler)
//       webSocketService.off('online-users', onlineUsersHandler)

//       unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
//     }
//   }, [authUser, checkingAuth, currentMatch, dispatch, messages, currentUserId])

//   // ============ MARK MESSAGES AS READ ============
//   useEffect(() => {
//     if (!currentMatch || !messages.length || !webSocketService.isConnected()) {
//       return
//     }

//     const unreadMessages = messages.filter(
//       (msg) =>
//         msg.matchId === currentMatch._id &&
//         msg.sender !== currentUserId &&
//         !msg.isRead
//     )

//     if (unreadMessages.length > 0) {
//       const messageIds = unreadMessages.map((msg) => msg._id)
//       webSocketService.markMessagesAsRead(currentMatch._id, messageIds)

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

//   // ============ HANDLE URL MATCH ID ============
//   useEffect(() => {
//     if (matchIdFromUrl && matches.length > 0) {
//       const match = matches.find((m) => m._id === matchIdFromUrl)
//       if (match) {
//         if (!currentMatch || currentMatch._id !== matchIdFromUrl) {
//           handleSelectMatch(match)
//         }

//         if (isMobile) {
//           setShowChat(true)
//         }
//       }
//     }
//   }, [matchIdFromUrl, matches, isMobile])

//   // ============ LOAD INITIAL MESSAGES ============
//   useEffect(() => {
//     if (
//       currentMatch &&
//       authUser &&
//       initialMessagesLoadedRef.current !== currentMatch._id
//     ) {
//       console.log(`📨 Loading messages for match: ${currentMatch._id}`)
//       initialMessagesLoadedRef.current = currentMatch._id

//       dispatch(clearMessages())

//       dispatch(getMessagesRequest({ matchId: currentMatch._id }))
//       dispatch(markMessagesReadRequest(currentMatch._id))

//       const params = new URLSearchParams(searchParams.toString())
//       params.set('matchId', currentMatch._id)
//       router.replace(`?${params.toString()}`, { scroll: false })

//       if (webSocketConnected) {
//         webSocketService.joinMatch(currentMatch._id)
//       } else {
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

//   // ============ POLLING FUNCTIONS ============
//   const stopPolling = useCallback(() => {
//     if (pollIntervalRef.current) {
//       clearInterval(pollIntervalRef.current)
//       pollIntervalRef.current = null
//       isPollingRef.current = false
//     }
//   }, [])

//   const startPolling = useCallback(
//     (matchId: string) => {
//       if (!matchId || isPollingRef.current) return

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
//               const existingIds = new Set(messages.map((msg) => msg._id))
//               const newMessages = data.messages.filter(
//                 (msg: any) =>
//                   !existingIds.has(msg._id) && !msg._id?.startsWith('temp-')
//               )

//               if (newMessages.length > 0) {
//                 newMessages.forEach((msg: any) => {
//                   dispatch(newMessageReceived(msg))
//                 })
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
//       return
//     }

//     if (editingMessageId) {
//       await saveEditedMessage()
//       return
//     }

//     const content = messageInput.trim()
//     setMessageInput('')

//     const tempId = `temp-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`

//     if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

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

//     scrollToBottom()

//     try {
//       if (webSocketService.isConnected()) {
//         const success = await webSocketService.sendMessage(
//           currentMatch._id,
//           content,
//           tempId
//         )

//         if (!success) {
//           dispatch(
//             sendMessageRequest({
//               matchId: currentMatch._id,
//               content,
//               tempId,
//             })
//           )
//         }
//       } else {
//         dispatch(
//           sendMessageRequest({
//             matchId: currentMatch._id,
//             content,
//             tempId,
//           })
//         )
//       }
//     } catch (error: any) {
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

//   const scrollToUnread = () => {
//     if (lastUnreadMessageRef.current) {
//       const unreadElement = document.getElementById(
//         `message-${lastUnreadMessageRef.current}`
//       )
//       if (unreadElement) {
//         unreadElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
//       }
//     } else {
//       scrollToBottom()
//     }
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

//   // ============ handleSelectMatch function ============
//   const handleSelectMatch = (match: any) => {
//     console.log(`🔄 Selecting match: ${match._id}`)

//     if (currentMatch?._id === match._id) {
//       if (isMobile) {
//         setShowChat(true)
//       }
//       return
//     }

//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(clearMessages())
//     initialMessagesLoadedRef.current = null

//     dispatch(setCurrentMatch(match))

//     if (isMobile) {
//       setShowChat(true)
//     }

//     const params = new URLSearchParams(searchParams.toString())
//     params.set('matchId', match._id)
//     router.replace(`?${params.toString()}`, { scroll: false })

//     setTimeout(() => {
//       dispatch(getMessagesRequest({ matchId: match._id }))
//       dispatch(markMessagesReadRequest(match._id))

//       if (webSocketService.isConnected()) {
//         webSocketService.joinMatch(match._id)
//       } else {
//         startPolling(match._id)
//       }
//     }, 50)
//   }

//   // ============ handleBack function ============
//   const handleBack = () => {
//     console.log('🔙 Going back to matches list')

//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(null))
//     dispatch(clearMessages())

//     setShowChat(false)
//     setEditingMessageId(null)
//     setEditMessageContent('')
//     setMessageInput('')

//     initialMessagesLoadedRef.current = null

//     const params = new URLSearchParams(searchParams.toString())
//     params.delete('matchId')
//     router.replace(`?${params.toString()}`, { scroll: false })

//     setTimeout(() => {
//       if (messagesContainerRef.current) {
//         messagesContainerRef.current.scrollTop = 0
//       }
//     }, 50)
//   }

//   const reconnectWebSocket = async () => {
//     setConnectionStatus('connecting')

//     const connected = await webSocketService.connect()
//     if (connected) {
//       setConnectionStatus('connected')
//     } else {
//       setConnectionStatus('failed')
//     }
//   }

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

//   const handleInputBlur = () => {
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   const getMessageReadStatus = (message: any) => {
//     if (message.sender !== currentUserId) return null

//     if (message.isOptimistic || message._id?.startsWith('temp-')) {
//       return 'loading'
//     }

//     if (message.isRead) {
//       return 'read'
//     }

//     return 'sent'
//   }

//   // Find first unread message for the current match
//   const findFirstUnreadMessage = () => {
//     if (!currentMatch) return null

//     for (let i = messages.length - 1; i >= 0; i--) {
//       const message = messages[i]
//       if (
//         message.matchId === currentMatch._id &&
//         message.sender !== currentUserId &&
//         !message.isRead
//       ) {
//         return message
//       }
//     }
//     return null
//   }

//   const firstUnreadMessage = findFirstUnreadMessage()

//   // Determine what to show
//   const showUserList = !isMobile || !showChat
//   const showChatArea = !isMobile || showChat

//   // ============ Component Cleanup ============
//   useEffect(() => {
//     return () => {
//       stopPolling()

//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       initialMessagesLoadedRef.current = null
//       isPollingRef.current = false
//       isTypingRef.current = false
//     }
//   }, [currentMatch, stopPolling])

//   // ============ RENDER LOGIC ============
//   if ((checkingAuth || checkingAuthLocally) && !authUser) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Checking authentication...</p>
//           <p className='text-sm text-gray-400 mt-2'>
//             Please wait while we verify your session
//           </p>
//         </div>
//       </div>
//     )
//   }

//   if (!authUser && !checkingAuth && !checkingAuthLocally) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Session expired</p>
//           <p className='text-sm text-gray-400 mt-2'>Redirecting to login...</p>
//           <button
//             onClick={() => router.push('/login')}
//             className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
//           >
//             Go to Login Now
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
//         <div
//           className={`${
//             showUserList ? 'block' : 'hidden'
//           } md:block w-full md:w-80 bg-white border-r border-gray-200 flex flex-col`}
//         >
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

//         {/* Right Side - Chat Area - FIXED POSITIONING */}
//         <div
//           className={`${
//             showChatArea ? 'flex' : 'hidden'
//           } md:flex flex-1 flex-col`}
//           ref={messagesContainerRef}
//         >
//           {currentMatch ? (
//             <>
//               {/* Chat Header */}
//               <div className='bg-white border-b border-gray-200 p-4 shrink-0'>
//                 <div className='flex items-center justify-between'>
//                   <div className='flex items-center'>
//                     <button
//                       onClick={handleBack}
//                       className={`${
//                         isMobile ? 'block' : 'md:hidden'
//                       } mr-3 text-gray-500 hover:text-gray-700`}
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
//                   <div className='flex items-center gap-4'>
//                     {firstUnreadMessage && (
//                       <button
//                         onClick={scrollToUnread}
//                         className='px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1'
//                         title='Scroll to unread messages'
//                       >
//                         <span>Unread</span>
//                         <svg
//                           className='w-4 h-4'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M19 14l-7 7m0 0l-7-7m7 7V3'
//                           />
//                         </svg>
//                       </button>
//                     )}
//                     <div className='flex items-center gap-2'>
//                       <div
//                         className={`w-2 h-2 rounded-full ${
//                           webSocketConnected
//                             ? 'bg-green-500 animate-pulse'
//                             : 'bg-gray-400'
//                         }`}
//                       ></div>
//                       <p className='text-sm text-gray-500'>
//                         {webSocketConnected ? 'Live' : 'Polling'}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Messages Container - FIXED: Proper flex layout */}
//               <div className='flex-1 overflow-y-auto bg-gray-50'>
//                 <div className='min-h-full flex flex-col justify-end'>
//                   <div className='p-4'>
//                     {loading &&
//                     initialMessagesLoadedRef.current !== currentMatch?._id ? (
//                       <div className='flex items-center justify-center h-full py-8'>
//                         <div className='text-center'>
//                           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//                           <p className='text-gray-600'>Loading messages...</p>
//                         </div>
//                       </div>
//                     ) : messages.length === 0 ? (
//                       <div className='flex flex-col items-center justify-center h-full py-8 text-center'>
//                         <div className='text-gray-400 mb-4'>
//                           <svg
//                             className='w-16 h-16'
//                             fill='none'
//                             stroke='currentColor'
//                             viewBox='0 0 24 24'
//                           >
//                             <path
//                               strokeLinecap='round'
//                               strokeLinejoin='round'
//                               strokeWidth={1.5}
//                               d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
//                             />
//                           </svg>
//                         </div>
//                         <h3 className='text-lg font-semibold text-gray-700 mb-2'>
//                           No messages yet
//                         </h3>
//                         <p className='text-gray-500'>
//                           Send a message to start the conversation!
//                         </p>
//                       </div>
//                     ) : (
//                       <div className='space-y-6'>
//                         {Object.entries(groupedMessages).map(
//                           ([date, dateMessages]) => {
//                             const hasUnreadMessages = dateMessages.some(
//                               (msg) =>
//                                 msg.sender !== currentUserId && !msg.isRead
//                             )

//                             return (
//                               <div key={date}>
//                                 <div className='flex items-center justify-center my-4'>
//                                   <div className='bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full'>
//                                     {formatDate(dateMessages[0].createdAt)}
//                                   </div>
//                                 </div>
//                                 {hasUnreadMessages && firstUnreadMessage && (
//                                   <div className='flex items-center justify-center my-2'>
//                                     <div className='bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full flex items-center gap-1'>
//                                       <svg
//                                         className='w-3 h-3'
//                                         fill='currentColor'
//                                         viewBox='0 0 20 20'
//                                       >
//                                         <path
//                                           fillRule='evenodd'
//                                           d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
//                                           clipRule='evenodd'
//                                         />
//                                       </svg>
//                                       <span>Unread messages</span>
//                                     </div>
//                                   </div>
//                                 )}
//                                 <div className='space-y-4'>
//                                   {dateMessages.map(
//                                     (message: any, index: number) => {
//                                       const isCurrentUser =
//                                         message.sender === currentUserId
//                                       const isOptimistic =
//                                         message.isOptimistic ||
//                                         message._id?.startsWith('temp-')
//                                       const readStatus =
//                                         getMessageReadStatus(message)
//                                       const isEditing =
//                                         editingMessageId === message._id
//                                       const isUnread =
//                                         !isCurrentUser && !message.isRead
//                                       const isFirstUnread =
//                                         firstUnreadMessage?._id === message._id

//                                       return (
//                                         <div
//                                           key={message._id || index}
//                                           id={`message-${message._id}`}
//                                           className={`flex ${
//                                             isCurrentUser
//                                               ? 'justify-end'
//                                               : 'justify-start'
//                                           }`}
//                                         >
//                                           {isUnread && (
//                                             <div className='flex items-center mr-2'>
//                                               <div className='w-2 h-2 bg-red-500 rounded-full'></div>
//                                             </div>
//                                           )}
//                                           <div
//                                             className={`max-w-[70%] rounded-2xl px-4 py-3 relative group ${
//                                               isCurrentUser
//                                                 ? 'bg-blue-500 text-white rounded-br-none'
//                                                 : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
//                                             } ${
//                                               isOptimistic ? 'opacity-80' : ''
//                                             } ${
//                                               isEditing
//                                                 ? 'ring-2 ring-blue-300'
//                                                 : ''
//                                             } ${
//                                               isFirstUnread
//                                                 ? 'ring-2 ring-red-300'
//                                                 : ''
//                                             }`}
//                                             onDoubleClick={() => {
//                                               if (isCurrentUser) {
//                                                 startEditingMessage(message)
//                                               }
//                                             }}
//                                           >
//                                             {!isCurrentUser &&
//                                               message.senderId?.name && (
//                                                 <p className='text-xs font-semibold text-gray-600 mb-1'>
//                                                   {message.senderId.name}
//                                                 </p>
//                                               )}

//                                             {isEditing ? (
//                                               <div className='mb-2'>
//                                                 <input
//                                                   type='text'
//                                                   value={editMessageContent}
//                                                   onChange={(e) =>
//                                                     setEditMessageContent(
//                                                       e.target.value
//                                                     )
//                                                   }
//                                                   className='w-full bg-blue-600 text-white px-3 py-2 rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300'
//                                                   onKeyPress={(e) => {
//                                                     if (e.key === 'Enter') {
//                                                       saveEditedMessage()
//                                                     }
//                                                     if (e.key === 'Escape') {
//                                                       cancelEditing()
//                                                     }
//                                                   }}
//                                                   autoFocus
//                                                 />
//                                                 <div className='flex gap-2 mt-2'>
//                                                   <button
//                                                     onClick={saveEditedMessage}
//                                                     className='px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600'
//                                                   >
//                                                     Save
//                                                   </button>
//                                                   <button
//                                                     onClick={cancelEditing}
//                                                     className='px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600'
//                                                   >
//                                                     Cancel
//                                                   </button>
//                                                 </div>
//                                               </div>
//                                             ) : (
//                                               <>
//                                                 <p className='break-words'>
//                                                   {message.content}
//                                                 </p>
//                                                 {isCurrentUser && (
//                                                   <button
//                                                     onClick={() =>
//                                                       startEditingMessage(
//                                                         message
//                                                       )
//                                                     }
//                                                     className='absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md'
//                                                     title='Edit message'
//                                                   >
//                                                     <svg
//                                                       className='w-3 h-3'
//                                                       fill='none'
//                                                       stroke='currentColor'
//                                                       viewBox='0 0 24 24'
//                                                     >
//                                                       <path
//                                                         strokeLinecap='round'
//                                                         strokeLinejoin='round'
//                                                         strokeWidth={2}
//                                                         d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
//                                                       />
//                                                     </svg>
//                                                   </button>
//                                                 )}
//                                               </>
//                                             )}

//                                             <div
//                                               className={`text-xs mt-1 flex items-center justify-between ${
//                                                 isCurrentUser
//                                                   ? 'text-blue-100'
//                                                   : 'text-gray-400'
//                                               }`}
//                                             >
//                                               <span>
//                                                 {formatTime(message.createdAt)}
//                                               </span>
//                                               {isCurrentUser && (
//                                                 <span className='ml-2 flex items-center gap-1'>
//                                                   {readStatus === 'loading' ? (
//                                                     <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
//                                                   ) : readStatus === 'read' ? (
//                                                     <>
//                                                       <span>✓✓</span>
//                                                       <span className='ml-1'>
//                                                         Read
//                                                       </span>
//                                                     </>
//                                                   ) : (
//                                                     '✓ Sent'
//                                                   )}
//                                                 </span>
//                                               )}
//                                             </div>
//                                           </div>
//                                         </div>
//                                       )
//                                     }
//                                   )}
//                                 </div>
//                               </div>
//                             )
//                           }
//                         )}

//                         {isOtherUserTyping && (
//                           <div className='flex justify-start'>
//                             <div className='max-w-[70%] rounded-2xl px-4 py-3 bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'>
//                               <div className='flex items-center gap-1'>
//                                 <div className='flex gap-1'>
//                                   <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
//                                   <div
//                                     className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
//                                     style={{ animationDelay: '0.1s' }}
//                                   ></div>
//                                   <div
//                                     className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
//                                     style={{ animationDelay: '0.2s' }}
//                                   ></div>
//                                 </div>
//                                 <span className='text-sm text-gray-500 ml-2'>
//                                   typing...
//                                 </span>
//                               </div>
//                             </div>
//                           </div>
//                         )}
//                         <div ref={messagesEndRef} />
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Message Input - FIXED: Always at bottom */}
//               <div className='bg-white border-t border-gray-200 p-4 shrink-0'>
//                 {editingMessageId && (
//                   <div className='mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md'>
//                     <div className='flex items-center justify-between'>
//                       <span className='text-sm text-blue-700'>
//                         <span className='font-medium'>Editing message:</span>{' '}
//                         {editMessageContent.substring(0, 50)}
//                         {editMessageContent.length > 50 ? '...' : ''}
//                       </span>
//                       <button
//                         onClick={cancelEditing}
//                         className='text-blue-700 hover:text-blue-900'
//                       >
//                         <svg
//                           className='w-4 h-4'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M6 18L18 6M6 6l12 12'
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                 )}
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
//                       if (e.key === 'Escape' && editingMessageId) {
//                         cancelEditing()
//                       }
//                     }}
//                     placeholder={
//                       editingMessageId
//                         ? 'Edit your message...'
//                         : 'Type a message...'
//                     }
//                     className='flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
//                   />
//                   <button
//                     onClick={sendMessage}
//                     disabled={!messageInput.trim()}
//                     className={`ml-3 ${
//                       editingMessageId
//                         ? 'bg-green-500 hover:bg-green-600'
//                         : 'bg-blue-500 hover:bg-blue-600'
//                     } text-white rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
//                   >
//                     {editingMessageId ? (
//                       <svg
//                         className='w-5 h-5'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M5 13l4 4L19 7'
//                         />
//                       </svg>
//                     ) : (
//                       <svg
//                         className='w-5 h-5'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
//                         />
//                       </svg>
//                     )}
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
//             // Empty state when no chat is selected on desktop
//             <div className='flex-1 flex flex-col items-center justify-center p-8 md:flex hidden'>
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
//   editMessageRequest,
//   clearMessages,
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
//   const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
//   const [editMessageContent, setEditMessageContent] = useState('')
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const messagesContainerRef = useRef<HTMLDivElement>(null)
//   const lastUnreadMessageRef = useRef<string | null>(null)

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

//   // Auth state
//   const [authInitialized, setAuthInitialized] = useState(false)
//   const [authRetryCount, setAuthRetryCount] = useState(0)
//   const [checkingAuthLocally, setCheckingAuthLocally] = useState(true)

//   // Responsive state
//   const [isMobile, setIsMobile] = useState(false)
//   const [showChat, setShowChat] = useState(false)

//   const matchIdFromUrl = searchParams.get('matchId')

//   // ============ RESPONSIVE HANDLING ============
//   useEffect(() => {
//     const checkMobile = () => {
//       const mobile = window.innerWidth < 768
//       setIsMobile(mobile)

//       if (mobile) {
//         if (currentMatch) {
//           setShowChat(true)
//         } else {
//           setShowChat(false)
//         }
//       } else {
//         setShowChat(true)
//       }
//     }

//     checkMobile()
//     window.addEventListener('resize', checkMobile)

//     return () => window.removeEventListener('resize', checkMobile)
//   }, [currentMatch])

//   // ============ AUTHENTICATION FIX - OPTIMIZED ============
//   useEffect(() => {
//     const checkTokenInCookies = () => {
//       const cookies = document.cookie.split('; ')
//       const tokenCookie = cookies.find((row) => row.startsWith('token='))
//       return !!tokenCookie
//     }

//     const initializeAuth = async () => {
//       if (checkingAuth || authUser) {
//         setCheckingAuthLocally(false)
//         return
//       }

//       const hasToken = checkTokenInCookies()

//       if (!hasToken) {
//         console.log('🚫 No token found in cookies, redirecting to login')
//         setCheckingAuthLocally(false)
//         router.push('/login')
//         return
//       }

//       try {
//         console.log('🔐 Token found, checking authentication...')
//         setCheckingAuthLocally(true)

//         await dispatch(checkAuthRequest())

//         setTimeout(() => {
//           setCheckingAuthLocally(false)
//           setAuthInitialized(true)
//         }, 1000)
//       } catch (error) {
//         console.error('❌ Auth check error:', error)
//         setCheckingAuthLocally(false)
//       }
//     }

//     if (!authInitialized) {
//       initializeAuth()
//     }
//   }, [dispatch, router, authInitialized])

//   // Handle auth state changes
//   useEffect(() => {
//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount < 2
//     ) {
//       const timer = setTimeout(() => {
//         console.log(`🔄 Retry auth check (${authRetryCount + 1}/2)`)
//         setAuthRetryCount((prev) => prev + 1)
//         dispatch(checkAuthRequest())
//       }, 1000)

//       return () => clearTimeout(timer)
//     }

//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount >= 2
//     ) {
//       console.log('🚫 Auth failed after retries, redirecting to login')

//       const timer = setTimeout(() => {
//         router.push('/login')
//       }, 1500)

//       return () => clearTimeout(timer)
//     }
//   }, [
//     checkingAuth,
//     checkingAuthLocally,
//     authUser,
//     authRetryCount,
//     dispatch,
//     router,
//   ])

//   // ============ LOAD MATCHES WHEN AUTHENTICATED ============
//   useEffect(() => {
//     if (authUser && !checkingAuth && !checkingAuthLocally) {
//       console.log('✅ User authenticated, loading matches...')
//       dispatch(getMatchesRequest())
//     }
//   }, [authUser, checkingAuth, checkingAuthLocally, dispatch])

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

//       const now = Date.now()
//       if (isTypingValue && now - lastTypingSentRef.current < 1000) {
//         return
//       }

//       webSocketService.sendTypingIndicator(currentMatch._id, isTypingValue)
//       lastTypingSentRef.current = now
//       isTypingRef.current = isTypingValue
//     },
//     [currentMatch, currentUserId]
//   )

//   const handleTyping = useCallback(() => {
//     if (!currentMatch || !currentUserId) return

//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current)
//     }

//     if (!isTypingRef.current) {
//       sendTypingIndicator(true)
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       if (isTypingRef.current) {
//         sendTypingIndicator(false)
//       }
//     }, 2000)
//   }, [currentMatch, currentUserId, sendTypingIndicator])

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value
//     setMessageInput(value)

//     if (value.trim().length > 0) {
//       handleTyping()
//     } else if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   // ============ MESSAGE EDITING FUNCTIONS ============
//   const startEditingMessage = (message: any) => {
//     if (message.sender !== currentUserId) return

//     setEditingMessageId(message._id)
//     setEditMessageContent(message.content)
//     setMessageInput(message.content)

//     setTimeout(() => {
//       const input = document.querySelector(
//         'input[type="text"]'
//       ) as HTMLInputElement
//       input?.focus()
//     }, 100)
//   }

//   const cancelEditing = () => {
//     setEditingMessageId(null)
//     setEditMessageContent('')
//     setMessageInput('')
//   }

//   const saveEditedMessage = async () => {
//     if (!editingMessageId || !editMessageContent.trim() || !currentMatch) return

//     try {
//       await dispatch(
//         editMessageRequest({
//           messageId: editingMessageId,
//           matchId: currentMatch._id,
//           content: editMessageContent.trim(),
//         })
//       )

//       cancelEditing()
//     } catch (error) {
//       console.error('Failed to edit message:', error)
//     }
//   }

//   // ============ WEBSOCKET MANAGEMENT ============
//   useEffect(() => {
//     if (!authUser || checkingAuth) return

//     console.log('🔌 Setting up WebSocket...')

//     const initWebSocket = async () => {
//       try {
//         setConnectionStatus('connecting')
//         const connected = await webSocketService.connect()

//         if (connected) {
//           setConnectionStatus('connected')
//           setWebSocketConnected(true)

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

//     const unsubscribeCallbacks: (() => void)[] = []

//     webSocketService.onConnectionChange((connected: boolean) => {
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

//     const newMessageHandler = (message: any) => {
//       dispatch(newMessageReceived(message))

//       if (
//         message.sender !== currentUserId &&
//         currentMatch?._id === message.matchId
//       ) {
//         lastUnreadMessageRef.current = message._id
//       } else if (message.sender === currentUserId) {
//         scrollToBottom()
//       }

//       if (
//         currentMatch?._id === message.matchId &&
//         message.sender !== currentUserId &&
//         !message.isRead &&
//         currentMatch
//       ) {
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

//     const typingHandler = (data: any) => {
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

//     const statusHandler = (data: any) => {
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

//     const statusBatchHandler = (statuses: any) => {
//       dispatch(setOnlineStatusBatch(statuses))
//     }

//     webSocketService.on('online-status-batch', statusBatchHandler)

//     const messagesReadHandler = (data: any) => {
//       if (data.userId !== currentUserId && data.matchId === currentMatch?._id) {
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

//     const onlineUsersHandler = (userIds: string[]) => {
//       if (userIds.length > 0) {
//         webSocketService.checkOnlineStatusBatch(userIds)
//       }
//     }

//     webSocketService.on('online-users', onlineUsersHandler)

//     return () => {
//       stopPolling()

//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       webSocketService.off('new-message', newMessageHandler)
//       webSocketService.off('user-typing', typingHandler)
//       webSocketService.off('user-status', statusHandler)
//       webSocketService.off('online-status-batch', statusBatchHandler)
//       webSocketService.off('messages-read', messagesReadHandler)
//       webSocketService.off('online-users', onlineUsersHandler)

//       unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
//     }
//   }, [authUser, checkingAuth, currentMatch, dispatch, messages, currentUserId])

//   // ============ MARK MESSAGES AS READ ============
//   useEffect(() => {
//     if (!currentMatch || !messages.length || !webSocketService.isConnected()) {
//       return
//     }

//     const unreadMessages = messages.filter(
//       (msg) =>
//         msg.matchId === currentMatch._id &&
//         msg.sender !== currentUserId &&
//         !msg.isRead
//     )

//     if (unreadMessages.length > 0) {
//       const messageIds = unreadMessages.map((msg) => msg._id)
//       webSocketService.markMessagesAsRead(currentMatch._id, messageIds)

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

//   // ============ HANDLE URL MATCH ID ============
//   useEffect(() => {
//     if (matchIdFromUrl && matches.length > 0) {
//       const match = matches.find((m) => m._id === matchIdFromUrl)
//       if (match) {
//         if (!currentMatch || currentMatch._id !== matchIdFromUrl) {
//           handleSelectMatch(match)
//         }

//         if (isMobile) {
//           setShowChat(true)
//         }
//       }
//     }
//   }, [matchIdFromUrl, matches, isMobile])

//   // ============ LOAD INITIAL MESSAGES ============
//   useEffect(() => {
//     if (
//       currentMatch &&
//       authUser &&
//       initialMessagesLoadedRef.current !== currentMatch._id
//     ) {
//       console.log(`📨 Loading messages for match: ${currentMatch._id}`)
//       initialMessagesLoadedRef.current = currentMatch._id

//       dispatch(clearMessages())

//       dispatch(getMessagesRequest({ matchId: currentMatch._id }))
//       dispatch(markMessagesReadRequest(currentMatch._id))

//       const params = new URLSearchParams(searchParams.toString())
//       params.set('matchId', currentMatch._id)
//       router.replace(`?${params.toString()}`, { scroll: false })

//       if (webSocketConnected) {
//         webSocketService.joinMatch(currentMatch._id)
//       } else {
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

//   // ============ POLLING FUNCTIONS ============
//   const stopPolling = useCallback(() => {
//     if (pollIntervalRef.current) {
//       clearInterval(pollIntervalRef.current)
//       pollIntervalRef.current = null
//       isPollingRef.current = false
//     }
//   }, [])

//   const startPolling = useCallback(
//     (matchId: string) => {
//       if (!matchId || isPollingRef.current) return

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
//               const existingIds = new Set(messages.map((msg) => msg._id))
//               const newMessages = data.messages.filter(
//                 (msg: any) =>
//                   !existingIds.has(msg._id) && !msg._id?.startsWith('temp-')
//               )

//               if (newMessages.length > 0) {
//                 newMessages.forEach((msg: any) => {
//                   dispatch(newMessageReceived(msg))
//                 })
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
//       return
//     }

//     if (editingMessageId) {
//       await saveEditedMessage()
//       return
//     }

//     const content = messageInput.trim()
//     setMessageInput('')

//     const tempId = `temp-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`

//     if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

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

//     scrollToBottom()

//     try {
//       if (webSocketService.isConnected()) {
//         const success = await webSocketService.sendMessage(
//           currentMatch._id,
//           content,
//           tempId
//         )

//         if (!success) {
//           dispatch(
//             sendMessageRequest({
//               matchId: currentMatch._id,
//               content,
//               tempId,
//             })
//           )
//         }
//       } else {
//         dispatch(
//           sendMessageRequest({
//             matchId: currentMatch._id,
//             content,
//             tempId,
//           })
//         )
//       }
//     } catch (error: any) {
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

//   const scrollToUnread = () => {
//     if (lastUnreadMessageRef.current) {
//       const unreadElement = document.getElementById(
//         `message-${lastUnreadMessageRef.current}`
//       )
//       if (unreadElement) {
//         unreadElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
//       }
//     } else {
//       scrollToBottom()
//     }
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

//     return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
//   }

//   // ============ handleSelectMatch function ============
//   const handleSelectMatch = (match: any) => {
//     console.log(`🔄 Selecting match: ${match._id}`)

//     if (currentMatch?._id === match._id) {
//       if (isMobile) {
//         setShowChat(true)
//       }
//       return
//     }

//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(clearMessages())
//     initialMessagesLoadedRef.current = null

//     dispatch(setCurrentMatch(match))

//     if (isMobile) {
//       setShowChat(true)
//     }

//     const params = new URLSearchParams(searchParams.toString())
//     params.set('matchId', match._id)
//     router.replace(`?${params.toString()}`, { scroll: false })

//     setTimeout(() => {
//       dispatch(getMessagesRequest({ matchId: match._id }))
//       dispatch(markMessagesReadRequest(match._id))

//       if (webSocketService.isConnected()) {
//         webSocketService.joinMatch(match._id)
//       } else {
//         startPolling(match._id)
//       }
//     }, 50)
//   }

//   // ============ handleBack function ============
//   const handleBack = () => {
//     console.log('🔙 Going back to matches list')

//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(null))
//     dispatch(clearMessages())

//     setShowChat(false)
//     setEditingMessageId(null)
//     setEditMessageContent('')
//     setMessageInput('')

//     initialMessagesLoadedRef.current = null

//     const params = new URLSearchParams(searchParams.toString())
//     params.delete('matchId')
//     router.replace(`?${params.toString()}`, { scroll: false })

//     setTimeout(() => {
//       if (messagesContainerRef.current) {
//         messagesContainerRef.current.scrollTop = 0
//       }
//     }, 50)
//   }

//   const reconnectWebSocket = async () => {
//     setConnectionStatus('connecting')

//     const connected = await webSocketService.connect()
//     if (connected) {
//       setConnectionStatus('connected')
//     } else {
//       setConnectionStatus('failed')
//     }
//   }

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

//     return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
//   }

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

//   const handleInputBlur = () => {
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   const getMessageReadStatus = (message: any) => {
//     if (message.sender !== currentUserId) return null

//     if (message.isOptimistic || message._id?.startsWith('temp-')) {
//       return 'loading'
//     }

//     if (message.isRead) {
//       return 'read'
//     }

//     return 'sent'
//   }

//   // Find first unread message for the current match
//   const findFirstUnreadMessage = () => {
//     if (!currentMatch) return null

//     for (let i = messages.length - 1; i >= 0; i--) {
//       const message = messages[i]
//       if (
//         message.matchId === currentMatch._id &&
//         message.sender !== currentUserId &&
//         !message.isRead
//       ) {
//         return message
//       }
//     }
//     return null
//   }

//   const firstUnreadMessage = findFirstUnreadMessage()

//   // Determine what to show
//   const showUserList = !isMobile || !showChat
//   const showChatArea = !isMobile || showChat

//   // ============ Component Cleanup ============
//   useEffect(() => {
//     return () => {
//       stopPolling()

//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       initialMessagesLoadedRef.current = null
//       isPollingRef.current = false
//       isTypingRef.current = false
//     }
//   }, [currentMatch, stopPolling])

//   // ============ RENDER LOGIC ============
//   if ((checkingAuth || checkingAuthLocally) && !authUser) {
//     return (
//       <div className='flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
//         <div className='text-center space-y-6'>
//           <div className='relative'>
//             <div className='w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse mx-auto'></div>
//             <div className='absolute inset-0 flex items-center justify-center'>
//               <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white'></div>
//             </div>
//           </div>
//           <div className='space-y-2'>
//             <p className='text-lg font-semibold text-gray-700'>
//               Authenticating...
//             </p>
//             <p className='text-sm text-gray-500 max-w-xs'>
//               Please wait while we verify your session
//             </p>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   if (!authUser && !checkingAuth && !checkingAuthLocally) {
//     return (
//       <div className='flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
//         <div className='text-center space-y-6 p-8'>
//           <div className='w-20 h-20 rounded-full bg-gradient-to-r from-red-100 to-red-50 flex items-center justify-center mx-auto'>
//             <svg
//               className='w-10 h-10 text-red-400'
//               fill='none'
//               stroke='currentColor'
//               viewBox='0 0 24 24'
//             >
//               <path
//                 strokeLinecap='round'
//                 strokeLinejoin='round'
//                 strokeWidth={1.5}
//                 d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
//               />
//             </svg>
//           </div>
//           <div className='space-y-2'>
//             <h3 className='text-xl font-bold text-gray-800'>Session Expired</h3>
//             <p className='text-gray-600'>
//               Your session has expired. Please login again.
//             </p>
//           </div>
//           <button
//             onClick={() => router.push('/login')}
//             className='px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl'
//           >
//             Go to Login
//           </button>
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className='flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
//         <div className='text-center space-y-6 p-8'>
//           <div className='w-20 h-20 rounded-full bg-gradient-to-r from-yellow-100 to-yellow-50 flex items-center justify-center mx-auto'>
//             <svg
//               className='w-10 h-10 text-yellow-500'
//               fill='none'
//               stroke='currentColor'
//               viewBox='0 0 24 24'
//             >
//               <path
//                 strokeLinecap='round'
//                 strokeLinejoin='round'
//                 strokeWidth={1.5}
//                 d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z'
//               />
//             </svg>
//           </div>
//           <div className='space-y-2'>
//             <h3 className='text-xl font-bold text-gray-800'>
//               Something went wrong
//             </h3>
//             <p className='text-red-500'>{error}</p>
//           </div>
//           <button
//             onClick={() => dispatch(clearError())}
//             className='px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl'
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
//         className={`sticky top-0 z-50 px-4 py-3 text-sm font-medium backdrop-blur-sm transition-all duration-300 ${
//           connectionStatus === 'connected'
//             ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 text-green-700'
//             : connectionStatus === 'connecting'
//             ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-100 text-yellow-700'
//             : 'bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100 text-red-700'
//         }`}
//       >
//         <div className='max-w-7xl mx-auto flex items-center justify-between'>
//           <div className='flex items-center space-x-2'>
//             <span
//               className={`w-2 h-2 rounded-full animate-pulse ${
//                 connectionStatus === 'connected'
//                   ? 'bg-green-500'
//                   : connectionStatus === 'connecting'
//                   ? 'bg-yellow-500'
//                   : 'bg-red-500'
//               }`}
//             ></span>
//             <span>
//               {connectionStatus === 'connected' &&
//                 '✓ Live WebSocket Connection'}
//               {connectionStatus === 'connecting' && '🔄 Connecting...'}
//               {connectionStatus === 'disconnected' &&
//                 '⚠️ Using Polling (5s intervals)'}
//               {connectionStatus === 'failed' &&
//                 '❌ Connection Failed - Using Polling'}
//             </span>
//           </div>
//           {connectionStatus !== 'connected' && (
//             <button
//               onClick={reconnectWebSocket}
//               className='px-3 py-1 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200'
//             >
//               Reconnect
//             </button>
//           )}
//         </div>
//       </div>

//       <div className='flex h-[calc(100vh-3rem)] bg-gradient-to-br from-gray-50 to-gray-100'>
//         {/* Left Sidebar - Matches List */}
//         <div
//           className={`${
//             showUserList ? 'block' : 'hidden'
//           } md:block w-full md:w-96 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col transition-all duration-300`}
//         >
//           <div className='p-6 border-b border-gray-200/50'>
//             <div className='flex items-center justify-between'>
//               <div>
//                 <h2 className='text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
//                   Messages
//                 </h2>
//                 <p className='text-sm text-gray-500 mt-1 flex items-center'>
//                   <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
//                   {matches.length}{' '}
//                   {matches.length === 1 ? 'conversation' : 'conversations'}
//                 </p>
//               </div>
//               <div className='relative'>
//                 <div className='w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center'>
//                   <svg
//                     className='w-5 h-5 text-blue-500'
//                     fill='none'
//                     stroke='currentColor'
//                     viewBox='0 0 24 24'
//                   >
//                     <path
//                       strokeLinecap='round'
//                       strokeLinejoin='round'
//                       strokeWidth={2}
//                       d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
//                     />
//                   </svg>
//                   {matches.some((match) => match.unreadCount > 0) && (
//                     <span className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse'>
//                       {matches.reduce(
//                         (acc, match) => acc + (match.unreadCount || 0),
//                         0
//                       )}
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <div className='mt-4 relative'>
//               <input
//                 type='text'
//                 placeholder='Search conversations...'
//                 className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300'
//               />
//               <svg
//                 className='absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400'
//                 fill='none'
//                 stroke='currentColor'
//                 viewBox='0 0 24 24'
//               >
//                 <path
//                   strokeLinecap='round'
//                   strokeLinejoin='round'
//                   strokeWidth={2}
//                   d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
//                 />
//               </svg>
//             </div>
//           </div>

//           <div className='flex-1 overflow-y-auto'>
//             {loading && matches.length === 0 ? (
//               <div className='p-8 text-center space-y-4'>
//                 <div className='flex justify-center space-x-2'>
//                   {[...Array(3)].map((_, i) => (
//                     <div
//                       key={i}
//                       className='w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce'
//                       style={{ animationDelay: `${i * 0.1}s` }}
//                     ></div>
//                   ))}
//                 </div>
//                 <p className='text-gray-600 font-medium'>
//                   Loading conversations...
//                 </p>
//               </div>
//             ) : matches.length === 0 ? (
//               <div className='p-8 text-center'>
//                 <div className='w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center'>
//                   <svg
//                     className='w-12 h-12 text-gray-400'
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
//                 <h3 className='text-lg font-semibold text-gray-700 mb-2'>
//                   No conversations yet
//                 </h3>
//                 <p className='text-gray-500 text-sm mb-6'>
//                   Start swiping to find matches!
//                 </p>
//                 <button
//                   onClick={() => router.push('/discover')}
//                   className='px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl'
//                 >
//                   Start Discovering
//                 </button>
//               </div>
//             ) : (
//               <div className='space-y-1 p-2'>
//                 {matches.map((match: any) => {
//                   const matchOtherUser =
//                     match.otherUser ||
//                     match.users?.find(
//                       (user: any) =>
//                         user &&
//                         user._id &&
//                         user._id.toString() !== currentUserId
//                     )

//                   const isOnline = matchOtherUser
//                     ? onlineStatus[matchOtherUser._id]?.isOnline
//                     : false
//                   const isTypingInMatch = typingIndicators.some(
//                     (indicator) =>
//                       indicator.userId === matchOtherUser?._id &&
//                       indicator.matchId === match._id &&
//                       indicator.isTyping &&
//                       new Date().getTime() -
//                         new Date(indicator.timestamp).getTime() <
//                         3000
//                   )

//                   return (
//                     <div
//                       key={match._id}
//                       onClick={() => handleSelectMatch(match)}
//                       className={`p-4 rounded-xl mx-2 cursor-pointer transition-all duration-300 ${
//                         currentMatch?._id === match._id
//                           ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-sm'
//                           : 'hover:bg-gray-50/80 border border-transparent hover:border-gray-200'
//                       }`}
//                     >
//                       <div className='flex items-center'>
//                         <div className='relative'>
//                           <div className='w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md'>
//                             <img
//                               src={
//                                 matchOtherUser?.photos?.[0]
//                                   ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${matchOtherUser.photos[0]}`
//                                   : '/default-avatar.png'
//                               }
//                               alt={matchOtherUser?.name || 'User'}
//                               className='w-full h-full object-cover'
//                             />
//                           </div>
//                           {isOnline && (
//                             <span className='absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse'></span>
//                           )}
//                           {match.unreadCount > 0 && (
//                             <span className='absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center shadow-md'>
//                               {match.unreadCount}
//                             </span>
//                           )}
//                         </div>
//                         <div className='ml-4 flex-1 min-w-0'>
//                           <div className='flex justify-between items-start'>
//                             <div>
//                               <h3 className='font-semibold text-gray-800 truncate'>
//                                 {matchOtherUser?.name || 'Unknown'}
//                               </h3>
//                               <p className='text-sm text-gray-500'>
//                                 {matchOtherUser?.age || ''} years
//                               </p>
//                             </div>
//                             {match.lastMessageAt && (
//                               <span className='text-xs text-gray-400 whitespace-nowrap'>
//                                 {formatTime(match.lastMessageAt)}
//                               </span>
//                             )}
//                           </div>
//                           <div className='mt-1'>
//                             <p className='text-sm text-gray-600 truncate flex items-center'>
//                               {isTypingInMatch ? (
//                                 <span className='text-blue-500 font-medium flex items-center'>
//                                   <span className='flex mr-2'>
//                                     <span className='w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce mx-0.5'></span>
//                                     <span
//                                       className='w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce mx-0.5'
//                                       style={{ animationDelay: '0.1s' }}
//                                     ></span>
//                                     <span
//                                       className='w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce mx-0.5'
//                                       style={{ animationDelay: '0.2s' }}
//                                     ></span>
//                                   </span>
//                                   typing...
//                                 </span>
//                               ) : (
//                                 <>
//                                   {match.unreadCount > 0 ? (
//                                     <span className='font-semibold text-gray-800'>
//                                       {match.lastMessage}
//                                     </span>
//                                   ) : (
//                                     match.lastMessage || 'Start a conversation'
//                                   )}
//                                 </>
//                               )}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Right Side - Chat Area */}
//         <div
//           className={`${
//             showChatArea ? 'flex' : 'hidden'
//           } md:flex flex-1 flex-col`}
//           ref={messagesContainerRef}
//         >
//           {currentMatch ? (
//             <>
//               {/* Chat Header */}
//               <div className='bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4 shrink-0'>
//                 <div className='flex items-center justify-between'>
//                   <div className='flex items-center'>
//                     <button
//                       onClick={handleBack}
//                       className={`${
//                         isMobile ? 'block' : 'md:hidden'
//                       } mr-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-300`}
//                     >
//                       <svg
//                         className='w-5 h-5 text-gray-600'
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
//                       <div className='w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md'>
//                         <img
//                           src={
//                             otherUser?.photos?.[0]
//                               ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${otherUser.photos[0]}`
//                               : '/default-avatar.png'
//                           }
//                           alt={otherUser?.name || 'User'}
//                           className='w-full h-full object-cover'
//                         />
//                       </div>
//                       <span
//                         className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${
//                           isOtherUserOnline
//                             ? 'bg-green-500 animate-pulse'
//                             : 'bg-gray-400'
//                         }`}
//                       ></span>
//                     </div>
//                     <div className='ml-4'>
//                       <h3 className='font-bold text-gray-800 text-lg'>
//                         {otherUser?.name || 'Unknown'}
//                       </h3>
//                       <div className='flex items-center gap-2 mt-1'>
//                         {isOtherUserTyping ? (
//                           <div className='flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm'>
//                             <div className='flex gap-1'>
//                               <div className='w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce'></div>
//                               <div
//                                 className='w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce'
//                                 style={{ animationDelay: '0.1s' }}
//                               ></div>
//                               <div
//                                 className='w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce'
//                                 style={{ animationDelay: '0.2s' }}
//                               ></div>
//                             </div>
//                             <span>typing</span>
//                           </div>
//                         ) : isOtherUserOnline ? (
//                           <div className='flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm'>
//                             <span className='w-1.5 h-1.5 bg-green-500 rounded-full'></span>
//                             <span>Online</span>
//                           </div>
//                         ) : (
//                           <div className='flex items-center gap-1.5 text-gray-500 text-sm'>
//                             <svg
//                               className='w-4 h-4'
//                               fill='none'
//                               stroke='currentColor'
//                               viewBox='0 0 24 24'
//                             >
//                               <path
//                                 strokeLinecap='round'
//                                 strokeLinejoin='round'
//                                 strokeWidth={2}
//                                 d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
//                               />
//                             </svg>
//                             <span>
//                               Last active {formatLastSeen(otherUserLastSeen)}
//                             </span>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                   <div className='flex items-center gap-4'>
//                     {firstUnreadMessage && (
//                       <button
//                         onClick={scrollToUnread}
//                         className='px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2'
//                         title='Scroll to unread messages'
//                       >
//                         <svg
//                           className='w-4 h-4'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M19 14l-7 7m0 0l-7-7m7 7V3'
//                           />
//                         </svg>
//                         <span>Unread</span>
//                       </button>
//                     )}
//                     <div className='flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full'>
//                       <div
//                         className={`w-2 h-2 rounded-full ${
//                           webSocketConnected
//                             ? 'bg-green-500 animate-pulse'
//                             : 'bg-yellow-500'
//                         }`}
//                       ></div>
//                       <span className='text-sm text-gray-600'>
//                         {webSocketConnected ? 'Live' : 'Polling'}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Messages Container */}
//               <div className='flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-gray-100/50'>
//                 <div className='min-h-full flex flex-col justify-end'>
//                   <div className='p-4 md:p-6'>
//                     {loading &&
//                     initialMessagesLoadedRef.current !== currentMatch?._id ? (
//                       <div className='flex items-center justify-center h-full py-12'>
//                         <div className='text-center space-y-4'>
//                           <div className='relative'>
//                             <div className='w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 animate-pulse mx-auto'></div>
//                             <div className='absolute inset-0 flex items-center justify-center'>
//                               <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
//                             </div>
//                           </div>
//                           <p className='text-gray-600 font-medium'>
//                             Loading messages...
//                           </p>
//                         </div>
//                       </div>
//                     ) : messages.length === 0 ? (
//                       <div className='flex flex-col items-center justify-center h-full py-12 text-center space-y-6'>
//                         <div className='w-24 h-24 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-center'>
//                           <svg
//                             className='w-12 h-12 text-blue-400'
//                             fill='none'
//                             stroke='currentColor'
//                             viewBox='0 0 24 24'
//                           >
//                             <path
//                               strokeLinecap='round'
//                               strokeLinejoin='round'
//                               strokeWidth={1.5}
//                               d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
//                             />
//                           </svg>
//                         </div>
//                         <div className='space-y-2'>
//                           <h3 className='text-xl font-bold text-gray-800'>
//                             No messages yet
//                           </h3>
//                           <p className='text-gray-600 max-w-sm'>
//                             Send a message to start the conversation with{' '}
//                             {otherUser?.name || 'your match'}!
//                           </p>
//                         </div>
//                         <div className='flex items-center gap-2 text-sm text-gray-500'>
//                           <svg
//                             className='w-5 h-5'
//                             fill='none'
//                             stroke='currentColor'
//                             viewBox='0 0 24 24'
//                           >
//                             <path
//                               strokeLinecap='round'
//                               strokeLinejoin='round'
//                               strokeWidth={2}
//                               d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
//                             />
//                           </svg>
//                           <span>Messages are end-to-end encrypted</span>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className='space-y-8'>
//                         {Object.entries(groupedMessages).map(
//                           ([date, dateMessages]) => {
//                             const hasUnreadMessages = dateMessages.some(
//                               (msg) =>
//                                 msg.sender !== currentUserId && !msg.isRead
//                             )

//                             return (
//                               <div key={date} className='space-y-4'>
//                                 <div className='flex items-center justify-center'>
//                                   <div className='bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 text-xs font-medium px-4 py-2 rounded-full shadow-sm'>
//                                     {formatDate(dateMessages[0].createdAt)}
//                                   </div>
//                                 </div>
//                                 {hasUnreadMessages && firstUnreadMessage && (
//                                   <div className='flex items-center justify-center animate-fade-in'>
//                                     <div className='bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 text-red-700 text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-sm'>
//                                       <div className='flex gap-1'>
//                                         <div className='w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse'></div>
//                                         <div
//                                           className='w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse'
//                                           style={{ animationDelay: '0.2s' }}
//                                         ></div>
//                                         <div
//                                           className='w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse'
//                                           style={{ animationDelay: '0.4s' }}
//                                         ></div>
//                                       </div>
//                                       <span>New messages</span>
//                                     </div>
//                                   </div>
//                                 )}
//                                 <div className='space-y-3'>
//                                   {dateMessages.map(
//                                     (message: any, index: number) => {
//                                       const isCurrentUser =
//                                         message.sender === currentUserId
//                                       const isOptimistic =
//                                         message.isOptimistic ||
//                                         message._id?.startsWith('temp-')
//                                       const readStatus =
//                                         getMessageReadStatus(message)
//                                       const isEditing =
//                                         editingMessageId === message._id
//                                       const isUnread =
//                                         !isCurrentUser && !message.isRead
//                                       const isFirstUnread =
//                                         firstUnreadMessage?._id === message._id

//                                       return (
//                                         <div
//                                           key={message._id || index}
//                                           id={`message-${message._id}`}
//                                           className={`flex ${
//                                             isCurrentUser
//                                               ? 'justify-end'
//                                               : 'justify-start'
//                                           } group`}
//                                         >
//                                           <div
//                                             className={`max-w-[75%] rounded-2xl px-4 py-3 relative transition-all duration-300 ${
//                                               isCurrentUser
//                                                 ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-none shadow-lg'
//                                                 : 'bg-white text-gray-800 rounded-bl-none shadow-md border border-gray-100'
//                                             } ${
//                                               isOptimistic ? 'opacity-80' : ''
//                                             } ${
//                                               isEditing
//                                                 ? 'ring-3 ring-blue-300 ring-opacity-50'
//                                                 : ''
//                                             } ${
//                                               isFirstUnread
//                                                 ? 'ring-3 ring-red-300 ring-opacity-50'
//                                                 : ''
//                                             } hover:shadow-lg`}
//                                             onDoubleClick={() => {
//                                               if (isCurrentUser) {
//                                                 startEditingMessage(message)
//                                               }
//                                             }}
//                                           >
//                                             {!isCurrentUser &&
//                                               message.senderId?.name && (
//                                                 <p className='text-xs font-semibold text-gray-600 mb-1.5'>
//                                                   {message.senderId.name}
//                                                 </p>
//                                               )}

//                                             {isEditing ? (
//                                               <div className='space-y-3'>
//                                                 <input
//                                                   type='text'
//                                                   value={editMessageContent}
//                                                   onChange={(e) =>
//                                                     setEditMessageContent(
//                                                       e.target.value
//                                                     )
//                                                   }
//                                                   className='w-full bg-white/20 text-white placeholder-white/70 px-3 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50'
//                                                   placeholder='Edit your message...'
//                                                   onKeyPress={(e) => {
//                                                     if (e.key === 'Enter') {
//                                                       saveEditedMessage()
//                                                     }
//                                                     if (e.key === 'Escape') {
//                                                       cancelEditing()
//                                                     }
//                                                   }}
//                                                   autoFocus
//                                                 />
//                                                 <div className='flex gap-2'>
//                                                   <button
//                                                     onClick={saveEditedMessage}
//                                                     className='flex-1 px-3 py-1.5 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200'
//                                                   >
//                                                     Save
//                                                   </button>
//                                                   <button
//                                                     onClick={cancelEditing}
//                                                     className='flex-1 px-3 py-1.5 bg-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-colors duration-200'
//                                                   >
//                                                     Cancel
//                                                   </button>
//                                                 </div>
//                                               </div>
//                                             ) : (
//                                               <>
//                                                 <p className='break-words leading-relaxed'>
//                                                   {message.content}
//                                                 </p>
//                                                 {isCurrentUser && (
//                                                   <button
//                                                     onClick={() =>
//                                                       startEditingMessage(
//                                                         message
//                                                       )
//                                                     }
//                                                     className='absolute -top-2 -right-2 bg-white text-blue-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110'
//                                                     title='Edit message'
//                                                   >
//                                                     <svg
//                                                       className='w-3.5 h-3.5'
//                                                       fill='none'
//                                                       stroke='currentColor'
//                                                       viewBox='0 0 24 24'
//                                                     >
//                                                       <path
//                                                         strokeLinecap='round'
//                                                         strokeLinejoin='round'
//                                                         strokeWidth={2}
//                                                         d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
//                                                       />
//                                                     </svg>
//                                                   </button>
//                                                 )}
//                                               </>
//                                             )}

//                                             <div
//                                               className={`text-xs mt-2 flex items-center justify-between ${
//                                                 isCurrentUser
//                                                   ? 'text-blue-100'
//                                                   : 'text-gray-500'
//                                               }`}
//                                             >
//                                               <span className='flex items-center gap-2'>
//                                                 <span>
//                                                   {formatTime(
//                                                     message.createdAt
//                                                   )}
//                                                 </span>
//                                                 {isUnread && (
//                                                   <span className='w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse'></span>
//                                                 )}
//                                               </span>
//                                               {isCurrentUser && (
//                                                 <span className='ml-2 flex items-center gap-1.5'>
//                                                   {readStatus === 'loading' ? (
//                                                     <div className='flex items-center gap-1'>
//                                                       <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
//                                                       <span>Sending...</span>
//                                                     </div>
//                                                   ) : readStatus === 'read' ? (
//                                                     <div className='flex items-center gap-1'>
//                                                       <span>✓✓</span>
//                                                       <span>Read</span>
//                                                     </div>
//                                                   ) : (
//                                                     <div className='flex items-center gap-1'>
//                                                       <span>✓</span>
//                                                       <span>Sent</span>
//                                                     </div>
//                                                   )}
//                                                 </span>
//                                               )}
//                                             </div>
//                                           </div>
//                                         </div>
//                                       )
//                                     }
//                                   )}
//                                 </div>
//                               </div>
//                             )
//                           }
//                         )}

//                         {isOtherUserTyping && (
//                           <div className='flex justify-start animate-fade-in'>
//                             <div className='max-w-[70%] rounded-2xl px-4 py-3 bg-white text-gray-800 rounded-bl-none shadow-md border border-gray-100'>
//                               <div className='flex items-center gap-3'>
//                                 <div className='flex gap-1'>
//                                   <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
//                                   <div
//                                     className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
//                                     style={{ animationDelay: '0.1s' }}
//                                   ></div>
//                                   <div
//                                     className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
//                                     style={{ animationDelay: '0.2s' }}
//                                   ></div>
//                                 </div>
//                                 <span className='text-sm text-gray-600'>
//                                   {otherUser?.name || 'Someone'} is typing...
//                                 </span>
//                               </div>
//                             </div>
//                           </div>
//                         )}
//                         <div ref={messagesEndRef} className='h-px' />
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Message Input */}
//               <div className='bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-4 shrink-0'>
//                 {editingMessageId && (
//                   <div className='mb-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl'>
//                     <div className='flex items-center justify-between'>
//                       <div className='flex items-center gap-3'>
//                         <div className='w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center'>
//                           <svg
//                             className='w-3 h-3 text-white'
//                             fill='none'
//                             stroke='currentColor'
//                             viewBox='0 0 24 24'
//                           >
//                             <path
//                               strokeLinecap='round'
//                               strokeLinejoin='round'
//                               strokeWidth={2}
//                               d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
//                             />
//                           </svg>
//                         </div>
//                         <div>
//                           <p className='text-sm font-medium text-blue-700'>
//                             Editing message
//                           </p>
//                           <p className='text-xs text-blue-600 truncate max-w-[200px]'>
//                             {editMessageContent.substring(0, 60)}
//                             {editMessageContent.length > 60 ? '...' : ''}
//                           </p>
//                         </div>
//                       </div>
//                       <button
//                         onClick={cancelEditing}
//                         className='text-blue-600 hover:text-blue-800 transition-colors duration-200'
//                       >
//                         <svg
//                           className='w-5 h-5'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M6 18L18 6M6 6l12 12'
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                 )}
//                 <div className='flex items-center gap-3'>
//                   <div className='flex-1 relative'>
//                     <input
//                       type='text'
//                       value={messageInput}
//                       onChange={handleInputChange}
//                       onBlur={handleInputBlur}
//                       onKeyPress={(e) => {
//                         if (e.key === 'Enter' && !e.shiftKey) {
//                           e.preventDefault()
//                           sendMessage()
//                         }
//                         if (e.key === 'Escape' && editingMessageId) {
//                           cancelEditing()
//                         }
//                       }}
//                       placeholder={
//                         editingMessageId
//                           ? 'Edit your message...'
//                           : 'Type a message...'
//                       }
//                       className='w-full border border-gray-300 bg-gray-50 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300'
//                     />
//                     <div className='absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2'>
//                       <button className='text-gray-400 hover:text-blue-500 transition-colors duration-200 p-1.5'>
//                         <svg
//                           className='w-5 h-5'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
//                           />
//                         </svg>
//                       </button>
//                       <button className='text-gray-400 hover:text-blue-500 transition-colors duration-200 p-1.5'>
//                         <svg
//                           className='w-5 h-5'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                   <button
//                     onClick={sendMessage}
//                     disabled={!messageInput.trim()}
//                     className={`rounded-2xl w-14 h-14 flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl ${
//                       editingMessageId
//                         ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
//                         : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
//                     } ${
//                       !messageInput.trim()
//                         ? 'opacity-50 cursor-not-allowed'
//                         : ''
//                     }`}
//                   >
//                     {editingMessageId ? (
//                       <svg
//                         className='w-6 h-6 text-white'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M5 13l4 4L19 7'
//                         />
//                       </svg>
//                     ) : (
//                       <svg
//                         className='w-6 h-6 text-white'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
//                         />
//                       </svg>
//                     )}
//                   </button>
//                 </div>
//                 <div className='mt-3 text-xs text-gray-500 text-center flex items-center justify-center gap-2'>
//                   <div
//                     className={`w-2 h-2 rounded-full ${
//                       webSocketConnected
//                         ? 'bg-green-500 animate-pulse'
//                         : 'bg-yellow-500'
//                     }`}
//                   ></div>
//                   <span>
//                     {webSocketConnected
//                       ? 'Messages are sent instantly'
//                       : 'Messages sync every 5 seconds'}
//                   </span>
//                 </div>
//               </div>
//             </>
//           ) : (
//             // Empty state when no chat is selected on desktop
//             <div className='flex-1 flex flex-col items-center justify-center p-8 md:flex hidden'>
//               <div className='max-w-md text-center space-y-8'>
//                 <div className='relative'>
//                   <div className='w-32 h-32 mx-auto rounded-3xl bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-center'>
//                     <svg
//                       className='w-16 h-16 text-blue-400'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={1.5}
//                         d='M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z'
//                       />
//                     </svg>
//                   </div>
//                   <div className='absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center shadow-lg'>
//                     <svg
//                       className='w-5 h-5 text-white'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={2}
//                         d='M13 10V3L4 14h7v7l9-11h-7z'
//                       />
//                     </svg>
//                   </div>
//                 </div>
//                 <div className='space-y-4'>
//                   <h2 className='text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
//                     Your Messages
//                   </h2>
//                   <p className='text-gray-600 text-lg'>
//                     Select a conversation from the sidebar to start chatting
//                     with your matches.
//                   </p>
//                 </div>
//                 <div className='space-y-4'>
//                   <div
//                     className={`p-4 rounded-2xl ${
//                       webSocketConnected
//                         ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
//                         : 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200'
//                     }`}
//                   >
//                     <div className='flex items-center gap-3'>
//                       <div
//                         className={`w-3 h-3 rounded-full ${
//                           webSocketConnected
//                             ? 'bg-green-500 animate-pulse'
//                             : 'bg-yellow-500'
//                         }`}
//                       ></div>
//                       <p
//                         className={`font-medium ${
//                           webSocketConnected
//                             ? 'text-green-700'
//                             : 'text-yellow-700'
//                         }`}
//                       >
//                         {webSocketConnected
//                           ? '✅ Real-time chat enabled via WebSocket'
//                           : '🔄 Using polling for messages'}
//                       </p>
//                     </div>
//                     {!webSocketConnected && (
//                       <button
//                         onClick={reconnectWebSocket}
//                         className='mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium'
//                       >
//                         Try to connect WebSocket
//                       </button>
//                     )}
//                   </div>
//                   <div className='text-sm text-gray-500'>
//                     <p>
//                       All messages are end-to-end encrypted for your privacy.
//                     </p>
//                   </div>
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
//   editMessageRequest,
//   clearMessages,
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
//   const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
//   const [editMessageContent, setEditMessageContent] = useState('')
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const messagesContainerRef = useRef<HTMLDivElement>(null)
//   const lastUnreadMessageRef = useRef<string | null>(null)

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

//   // Auth state
//   const [authInitialized, setAuthInitialized] = useState(false)
//   const [authRetryCount, setAuthRetryCount] = useState(0)
//   const [checkingAuthLocally, setCheckingAuthLocally] = useState(true)

//   // Responsive state
//   const [isMobile, setIsMobile] = useState(false)
//   const [showChat, setShowChat] = useState(false)

//   // Scroll position state
//   const scrollPositionsRef = useRef<Record<string, number>>({})
//   const isRestoringScrollRef = useRef(false)

//   const matchIdFromUrl = searchParams.get('matchId')

//   // ============ SCROLL POSITION MANAGEMENT ============
//   const saveScrollPosition = useCallback((matchId: string) => {
//     if (!matchId || !messagesContainerRef.current) return

//     const scrollTop = messagesContainerRef.current.scrollTop
//     scrollPositionsRef.current[matchId] = scrollTop
//     console.log(`💾 Saved scroll position for ${matchId}: ${scrollTop}`)
//   }, [])

//   const restoreScrollPosition = useCallback((matchId: string) => {
//     if (
//       !matchId ||
//       !messagesContainerRef.current ||
//       isRestoringScrollRef.current
//     )
//       return

//     const savedPosition = scrollPositionsRef.current[matchId]
//     if (savedPosition !== undefined) {
//       console.log(
//         `📥 Restoring scroll position for ${matchId}: ${savedPosition}`
//       )
//       isRestoringScrollRef.current = true

//       // Use requestAnimationFrame for smooth restoration
//       requestAnimationFrame(() => {
//         if (messagesContainerRef.current) {
//           messagesContainerRef.current.scrollTop = savedPosition

//           // Reset the flag after a short delay
//           setTimeout(() => {
//             isRestoringScrollRef.current = false
//           }, 100)
//         }
//       })
//     } else {
//       console.log(
//         `📥 No saved scroll position for ${matchId}, scrolling to bottom`
//       )
//       scrollToBottom()
//     }
//   }, [])

//   // ============ RESPONSIVE HANDLING ============
//   useEffect(() => {
//     const checkMobile = () => {
//       const mobile = window.innerWidth < 768
//       setIsMobile(mobile)

//       if (mobile) {
//         if (currentMatch) {
//           setShowChat(true)
//         } else {
//           setShowChat(false)
//         }
//       } else {
//         setShowChat(true)
//       }
//     }

//     checkMobile()
//     window.addEventListener('resize', checkMobile)

//     return () => window.removeEventListener('resize', checkMobile)
//   }, [currentMatch])

//   // ============ AUTHENTICATION FIX - OPTIMIZED ============
//   useEffect(() => {
//     const checkTokenInCookies = () => {
//       const cookies = document.cookie.split('; ')
//       const tokenCookie = cookies.find((row) => row.startsWith('token='))
//       return !!tokenCookie
//     }

//     const initializeAuth = async () => {
//       if (checkingAuth || authUser) {
//         setCheckingAuthLocally(false)
//         return
//       }

//       const hasToken = checkTokenInCookies()

//       if (!hasToken) {
//         console.log('🚫 No token found in cookies, redirecting to login')
//         setCheckingAuthLocally(false)
//         router.push('/login')
//         return
//       }

//       try {
//         console.log('🔐 Token found, checking authentication...')
//         setCheckingAuthLocally(true)

//         await dispatch(checkAuthRequest())

//         setTimeout(() => {
//           setCheckingAuthLocally(false)
//           setAuthInitialized(true)
//         }, 1000)
//       } catch (error) {
//         console.error('❌ Auth check error:', error)
//         setCheckingAuthLocally(false)
//       }
//     }

//     if (!authInitialized) {
//       initializeAuth()
//     }
//   }, [dispatch, router, authInitialized])

//   // Handle auth state changes
//   useEffect(() => {
//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount < 2
//     ) {
//       const timer = setTimeout(() => {
//         console.log(`🔄 Retry auth check (${authRetryCount + 1}/2)`)
//         setAuthRetryCount((prev) => prev + 1)
//         dispatch(checkAuthRequest())
//       }, 1000)

//       return () => clearTimeout(timer)
//     }

//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount >= 2
//     ) {
//       console.log('🚫 Auth failed after retries, redirecting to login')

//       const timer = setTimeout(() => {
//         router.push('/login')
//       }, 1500)

//       return () => clearTimeout(timer)
//     }
//   }, [
//     checkingAuth,
//     checkingAuthLocally,
//     authUser,
//     authRetryCount,
//     dispatch,
//     router,
//   ])

//   // ============ LOAD MATCHES WHEN AUTHENTICATED ============
//   useEffect(() => {
//     if (authUser && !checkingAuth && !checkingAuthLocally) {
//       console.log('✅ User authenticated, loading matches...')
//       dispatch(getMatchesRequest())
//     }
//   }, [authUser, checkingAuth, checkingAuthLocally, dispatch])

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

//       const now = Date.now()
//       if (isTypingValue && now - lastTypingSentRef.current < 1000) {
//         return
//       }

//       webSocketService.sendTypingIndicator(currentMatch._id, isTypingValue)
//       lastTypingSentRef.current = now
//       isTypingRef.current = isTypingValue
//     },
//     [currentMatch, currentUserId]
//   )

//   const handleTyping = useCallback(() => {
//     if (!currentMatch || !currentUserId) return

//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current)
//     }

//     if (!isTypingRef.current) {
//       sendTypingIndicator(true)
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       if (isTypingRef.current) {
//         sendTypingIndicator(false)
//       }
//     }, 2000)
//   }, [currentMatch, currentUserId, sendTypingIndicator])

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value
//     setMessageInput(value)

//     if (value.trim().length > 0) {
//       handleTyping()
//     } else if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   // ============ MESSAGE EDITING FUNCTIONS ============
//   const startEditingMessage = (message: any) => {
//     if (message.sender !== currentUserId) return

//     setEditingMessageId(message._id)
//     setEditMessageContent(message.content)
//     setMessageInput(message.content)

//     setTimeout(() => {
//       const input = document.querySelector(
//         'input[type="text"]'
//       ) as HTMLInputElement
//       input?.focus()
//     }, 100)
//   }

//   const cancelEditing = () => {
//     setEditingMessageId(null)
//     setEditMessageContent('')
//     setMessageInput('')
//   }

//   const saveEditedMessage = async () => {
//     if (!editingMessageId || !editMessageContent.trim() || !currentMatch) return

//     try {
//       await dispatch(
//         editMessageRequest({
//           messageId: editingMessageId,
//           matchId: currentMatch._id,
//           content: editMessageContent.trim(),
//         })
//       )

//       cancelEditing()
//     } catch (error) {
//       console.error('Failed to edit message:', error)
//     }
//   }

//   // ============ WEBSOCKET MANAGEMENT ============
//   useEffect(() => {
//     if (!authUser || checkingAuth) return

//     console.log('🔌 Setting up WebSocket...')

//     const initWebSocket = async () => {
//       try {
//         setConnectionStatus('connecting')
//         const connected = await webSocketService.connect()

//         if (connected) {
//           setConnectionStatus('connected')
//           setWebSocketConnected(true)

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

//     const unsubscribeCallbacks: (() => void)[] = []

//     webSocketService.onConnectionChange((connected: boolean) => {
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

//     const newMessageHandler = (message: any) => {
//       dispatch(newMessageReceived(message))

//       if (
//         message.sender !== currentUserId &&
//         currentMatch?._id === message.matchId
//       ) {
//         lastUnreadMessageRef.current = message._id
//       } else if (message.sender === currentUserId) {
//         scrollToBottom()
//       }

//       if (
//         currentMatch?._id === message.matchId &&
//         message.sender !== currentUserId &&
//         !message.isRead &&
//         currentMatch
//       ) {
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

//     const typingHandler = (data: any) => {
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

//     const statusHandler = (data: any) => {
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

//     const statusBatchHandler = (statuses: any) => {
//       dispatch(setOnlineStatusBatch(statuses))
//     }

//     webSocketService.on('online-status-batch', statusBatchHandler)

//     const messagesReadHandler = (data: any) => {
//       if (data.userId !== currentUserId && data.matchId === currentMatch?._id) {
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

//     const onlineUsersHandler = (userIds: string[]) => {
//       if (userIds.length > 0) {
//         webSocketService.checkOnlineStatusBatch(userIds)
//       }
//     }

//     webSocketService.on('online-users', onlineUsersHandler)

//     return () => {
//       stopPolling()

//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       webSocketService.off('new-message', newMessageHandler)
//       webSocketService.off('user-typing', typingHandler)
//       webSocketService.off('user-status', statusHandler)
//       webSocketService.off('online-status-batch', statusBatchHandler)
//       webSocketService.off('messages-read', messagesReadHandler)
//       webSocketService.off('online-users', onlineUsersHandler)

//       unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
//     }
//   }, [authUser, checkingAuth, currentMatch, dispatch, messages, currentUserId])

//   // ============ MARK MESSAGES AS READ ============
//   useEffect(() => {
//     if (!currentMatch || !messages.length || !webSocketService.isConnected()) {
//       return
//     }

//     const unreadMessages = messages.filter(
//       (msg) =>
//         msg.matchId === currentMatch._id &&
//         msg.sender !== currentUserId &&
//         !msg.isRead
//     )

//     if (unreadMessages.length > 0) {
//       const messageIds = unreadMessages.map((msg) => msg._id)
//       webSocketService.markMessagesAsRead(currentMatch._id, messageIds)

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

//   // ============ HANDLE URL MATCH ID ============
//   useEffect(() => {
//     if (matchIdFromUrl && matches.length > 0) {
//       const match = matches.find((m) => m._id === matchIdFromUrl)
//       if (match) {
//         if (!currentMatch || currentMatch._id !== matchIdFromUrl) {
//           handleSelectMatch(match)
//         }

//         if (isMobile) {
//           setShowChat(true)
//         }
//       }
//     }
//   }, [matchIdFromUrl, matches, isMobile])

//   // ============ LOAD INITIAL MESSAGES ============
//   useEffect(() => {
//     if (
//       currentMatch &&
//       authUser &&
//       initialMessagesLoadedRef.current !== currentMatch._id
//     ) {
//       console.log(`📨 Loading messages for match: ${currentMatch._id}`)
//       initialMessagesLoadedRef.current = currentMatch._id

//       dispatch(clearMessages())

//       dispatch(getMessagesRequest({ matchId: currentMatch._id }))
//       dispatch(markMessagesReadRequest(currentMatch._id))

//       const params = new URLSearchParams(searchParams.toString())
//       params.set('matchId', currentMatch._id)
//       router.replace(`?${params.toString()}`, { scroll: false })

//       if (webSocketConnected) {
//         webSocketService.joinMatch(currentMatch._id)
//       } else {
//         startPolling(currentMatch._id)
//       }

//       // Restore scroll position after messages are loaded
//       const restoreScroll = setTimeout(() => {
//         restoreScrollPosition(currentMatch._id)
//       }, 300)

//       return () => clearTimeout(restoreScroll)
//     }
//   }, [
//     currentMatch,
//     authUser,
//     dispatch,
//     router,
//     searchParams,
//     webSocketConnected,
//     restoreScrollPosition,
//   ])

//   // ============ POLLING FUNCTIONS ============
//   const stopPolling = useCallback(() => {
//     if (pollIntervalRef.current) {
//       clearInterval(pollIntervalRef.current)
//       pollIntervalRef.current = null
//       isPollingRef.current = false
//     }
//   }, [])

//   const startPolling = useCallback(
//     (matchId: string) => {
//       if (!matchId || isPollingRef.current) return

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
//               const existingIds = new Set(messages.map((msg) => msg._id))
//               const newMessages = data.messages.filter(
//                 (msg: any) =>
//                   !existingIds.has(msg._id) && !msg._id?.startsWith('temp-')
//               )

//               if (newMessages.length > 0) {
//                 newMessages.forEach((msg: any) => {
//                   dispatch(newMessageReceived(msg))
//                 })
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
//       return
//     }

//     if (editingMessageId) {
//       await saveEditedMessage()
//       return
//     }

//     const content = messageInput.trim()
//     setMessageInput('')

//     const tempId = `temp-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`

//     if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

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

//     scrollToBottom()

//     try {
//       if (webSocketService.isConnected()) {
//         const success = await webSocketService.sendMessage(
//           currentMatch._id,
//           content,
//           tempId
//         )

//         if (!success) {
//           dispatch(
//             sendMessageRequest({
//               matchId: currentMatch._id,
//               content,
//               tempId,
//             })
//           )
//         }
//       } else {
//         dispatch(
//           sendMessageRequest({
//             matchId: currentMatch._id,
//             content,
//             tempId,
//           })
//         )
//       }
//     } catch (error: any) {
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

//   const scrollToUnread = () => {
//     if (lastUnreadMessageRef.current) {
//       const unreadElement = document.getElementById(
//         `message-${lastUnreadMessageRef.current}`
//       )
//       if (unreadElement) {
//         unreadElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
//       }
//     } else {
//       scrollToBottom()
//     }
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

//     return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
//   }

//   // ============ handleSelectMatch function ============
//   const handleSelectMatch = (match: any) => {
//     console.log(`🔄 Selecting match: ${match._id}`)

//     if (currentMatch?._id === match._id) {
//       if (isMobile) {
//         setShowChat(true)
//       }
//       return
//     }

//     // Save current scroll position before switching
//     if (currentMatch && messagesContainerRef.current) {
//       saveScrollPosition(currentMatch._id)
//     }

//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(clearMessages())
//     initialMessagesLoadedRef.current = null

//     dispatch(setCurrentMatch(match))

//     if (isMobile) {
//       setShowChat(true)
//     }

//     const params = new URLSearchParams(searchParams.toString())
//     params.set('matchId', match._id)
//     router.replace(`?${params.toString()}`, { scroll: false })

//     setTimeout(() => {
//       dispatch(getMessagesRequest({ matchId: match._id }))
//       dispatch(markMessagesReadRequest(match._id))

//       if (webSocketService.isConnected()) {
//         webSocketService.joinMatch(match._id)
//       } else {
//         startPolling(match._id)
//       }

//       // Restore scroll position for this match
//       restoreScrollPosition(match._id)
//     }, 50)
//   }

//   // ============ handleBack function ============
//   const handleBack = () => {
//     console.log('🔙 Going back to matches list')

//     // Save scroll position before leaving
//     if (currentMatch && messagesContainerRef.current) {
//       saveScrollPosition(currentMatch._id)
//     }

//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(null))
//     dispatch(clearMessages())

//     setShowChat(false)
//     setEditingMessageId(null)
//     setEditMessageContent('')
//     setMessageInput('')

//     initialMessagesLoadedRef.current = null

//     const params = new URLSearchParams(searchParams.toString())
//     params.delete('matchId')
//     router.replace(`?${params.toString()}`, { scroll: false })

//     setTimeout(() => {
//       if (messagesContainerRef.current) {
//         messagesContainerRef.current.scrollTop = 0
//       }
//     }, 50)
//   }

//   const reconnectWebSocket = async () => {
//     setConnectionStatus('connecting')

//     const connected = await webSocketService.connect()
//     if (connected) {
//       setConnectionStatus('connected')
//     } else {
//       setConnectionStatus('failed')
//     }
//   }

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

//     return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
//   }

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

//   const handleInputBlur = () => {
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   const getMessageReadStatus = (message: any) => {
//     if (message.sender !== currentUserId) return null

//     if (message.isOptimistic || message._id?.startsWith('temp-')) {
//       return 'loading'
//     }

//     if (message.isRead) {
//       return 'read'
//     }

//     return 'sent'
//   }

//   // Find first unread message for the current match
//   const findFirstUnreadMessage = () => {
//     if (!currentMatch) return null

//     for (let i = messages.length - 1; i >= 0; i--) {
//       const message = messages[i]
//       if (
//         message.matchId === currentMatch._id &&
//         message.sender !== currentUserId &&
//         !message.isRead
//       ) {
//         return message
//       }
//     }
//     return null
//   }

//   const firstUnreadMessage = findFirstUnreadMessage()

//   // Determine what to show
//   const showUserList = !isMobile || !showChat
//   const showChatArea = !isMobile || showChat

//   // ============ SAVE SCROLL POSITION ON SCROLL ============
//   useEffect(() => {
//     const messagesContainer = messagesContainerRef.current
//     if (!messagesContainer || !currentMatch) return

//     const handleScroll = () => {
//       if (!isRestoringScrollRef.current && currentMatch) {
//         saveScrollPosition(currentMatch._id)
//       }
//     }

//     messagesContainer.addEventListener('scroll', handleScroll)

//     return () => {
//       messagesContainer.removeEventListener('scroll', handleScroll)
//     }
//   }, [currentMatch, saveScrollPosition])

//   // ============ Component Cleanup ============
//   useEffect(() => {
//     return () => {
//       stopPolling()

//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       initialMessagesLoadedRef.current = null
//       isPollingRef.current = false
//       isTypingRef.current = false
//       isRestoringScrollRef.current = false
//     }
//   }, [currentMatch, stopPolling])

//   // ============ RENDER LOGIC ============
//   if ((checkingAuth || checkingAuthLocally) && !authUser) {
//     return (
//       <div className='flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
//         <div className='text-center space-y-6'>
//           <div className='relative'>
//             <div className='w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse mx-auto'></div>
//             <div className='absolute inset-0 flex items-center justify-center'>
//               <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white'></div>
//             </div>
//           </div>
//           <div className='space-y-2'>
//             <p className='text-lg font-semibold text-gray-700'>
//               Authenticating...
//             </p>
//             <p className='text-sm text-gray-500 max-w-xs'>
//               Please wait while we verify your session
//             </p>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   if (!authUser && !checkingAuth && !checkingAuthLocally) {
//     return (
//       <div className='flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
//         <div className='text-center space-y-6 p-8'>
//           <div className='w-20 h-20 rounded-full bg-gradient-to-r from-red-100 to-red-50 flex items-center justify-center mx-auto'>
//             <svg
//               className='w-10 h-10 text-red-400'
//               fill='none'
//               stroke='currentColor'
//               viewBox='0 0 24 24'
//             >
//               <path
//                 strokeLinecap='round'
//                 strokeLinejoin='round'
//                 strokeWidth={1.5}
//                 d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
//               />
//             </svg>
//           </div>
//           <div className='space-y-2'>
//             <h3 className='text-xl font-bold text-gray-800'>Session Expired</h3>
//             <p className='text-gray-600'>
//               Your session has expired. Please login again.
//             </p>
//           </div>
//           <button
//             onClick={() => router.push('/login')}
//             className='px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl'
//           >
//             Go to Login
//           </button>
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className='flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
//         <div className='text-center space-y-6 p-8'>
//           <div className='w-20 h-20 rounded-full bg-gradient-to-r from-yellow-100 to-yellow-50 flex items-center justify-center mx-auto'>
//             <svg
//               className='w-10 h-10 text-yellow-500'
//               fill='none'
//               stroke='currentColor'
//               viewBox='0 0 24 24'
//             >
//               <path
//                 strokeLinecap='round'
//                 strokeLinejoin='round'
//                 strokeWidth={1.5}
//                 d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z'
//               />
//             </svg>
//           </div>
//           <div className='space-y-2'>
//             <h3 className='text-xl font-bold text-gray-800'>
//               Something went wrong
//             </h3>
//             <p className='text-red-500'>{error}</p>
//           </div>
//           <button
//             onClick={() => dispatch(clearError())}
//             className='px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl'
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
//         className={`sticky top-0 z-50 px-4 py-3 text-sm font-medium backdrop-blur-sm transition-all duration-300 ${
//           connectionStatus === 'connected'
//             ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 text-green-700'
//             : connectionStatus === 'connecting'
//             ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-100 text-yellow-700'
//             : 'bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100 text-red-700'
//         }`}
//       >
//         <div className='max-w-7xl mx-auto flex items-center justify-between'>
//           <div className='flex items-center space-x-2'>
//             <span
//               className={`w-2 h-2 rounded-full animate-pulse ${
//                 connectionStatus === 'connected'
//                   ? 'bg-green-500'
//                   : connectionStatus === 'connecting'
//                   ? 'bg-yellow-500'
//                   : 'bg-red-500'
//               }`}
//             ></span>
//             <span>
//               {connectionStatus === 'connected' &&
//                 '✓ Live WebSocket Connection'}
//               {connectionStatus === 'connecting' && '🔄 Connecting...'}
//               {connectionStatus === 'disconnected' &&
//                 '⚠️ Using Polling (5s intervals)'}
//               {connectionStatus === 'failed' &&
//                 '❌ Connection Failed - Using Polling'}
//             </span>
//           </div>
//           {connectionStatus !== 'connected' && (
//             <button
//               onClick={reconnectWebSocket}
//               className='px-3 py-1 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200'
//             >
//               Reconnect
//             </button>
//           )}
//         </div>
//       </div>

//       <div className='flex h-[calc(100vh-3rem)] bg-gradient-to-br from-gray-50 to-gray-100'>
//         {/* Left Sidebar - Matches List */}
//         <div
//           className={`${
//             showUserList ? 'block' : 'hidden'
//           } md:block w-full md:w-96 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col transition-all duration-300`}
//         >
//           <div className='p-6 border-b border-gray-200/50'>
//             <div className='flex items-center justify-between'>
//               <div>
//                 <h2 className='text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
//                   Messages
//                 </h2>
//                 <p className='text-sm text-gray-500 mt-1 flex items-center'>
//                   <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
//                   {matches.length}{' '}
//                   {matches.length === 1 ? 'conversation' : 'conversations'}
//                 </p>
//               </div>
//               <div className='relative'>
//                 <div className='w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center'>
//                   <svg
//                     className='w-5 h-5 text-blue-500'
//                     fill='none'
//                     stroke='currentColor'
//                     viewBox='0 0 24 24'
//                   >
//                     <path
//                       strokeLinecap='round'
//                       strokeLinejoin='round'
//                       strokeWidth={2}
//                       d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
//                     />
//                   </svg>
//                   {matches.some((match) => match.unreadCount > 0) && (
//                     <span className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse'>
//                       {matches.reduce(
//                         (acc, match) => acc + (match.unreadCount || 0),
//                         0
//                       )}
//                     </span>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <div className='mt-4 relative'>
//               <input
//                 type='text'
//                 placeholder='Search conversations...'
//                 className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300'
//               />
//               <svg
//                 className='absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400'
//                 fill='none'
//                 stroke='currentColor'
//                 viewBox='0 0 24 24'
//               >
//                 <path
//                   strokeLinecap='round'
//                   strokeLinejoin='round'
//                   strokeWidth={2}
//                   d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
//                 />
//               </svg>
//             </div>
//           </div>

//           <div className='flex-1 overflow-y-auto'>
//             {loading && matches.length === 0 ? (
//               <div className='p-8 text-center space-y-4'>
//                 <div className='flex justify-center space-x-2'>
//                   {[...Array(3)].map((_, i) => (
//                     <div
//                       key={i}
//                       className='w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce'
//                       style={{ animationDelay: `${i * 0.1}s` }}
//                     ></div>
//                   ))}
//                 </div>
//                 <p className='text-gray-600 font-medium'>
//                   Loading conversations...
//                 </p>
//               </div>
//             ) : matches.length === 0 ? (
//               <div className='p-8 text-center'>
//                 <div className='w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center'>
//                   <svg
//                     className='w-12 h-12 text-gray-400'
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
//                 <h3 className='text-lg font-semibold text-gray-700 mb-2'>
//                   No conversations yet
//                 </h3>
//                 <p className='text-gray-500 text-sm mb-6'>
//                   Start swiping to find matches!
//                 </p>
//                 <button
//                   onClick={() => router.push('/discover')}
//                   className='px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl'
//                 >
//                   Start Discovering
//                 </button>
//               </div>
//             ) : (
//               <div className='space-y-1 p-2'>
//                 {matches.map((match: any) => {
//                   const matchOtherUser =
//                     match.otherUser ||
//                     match.users?.find(
//                       (user: any) =>
//                         user &&
//                         user._id &&
//                         user._id.toString() !== currentUserId
//                     )

//                   const isOnline = matchOtherUser
//                     ? onlineStatus[matchOtherUser._id]?.isOnline
//                     : false
//                   const isTypingInMatch = typingIndicators.some(
//                     (indicator) =>
//                       indicator.userId === matchOtherUser?._id &&
//                       indicator.matchId === match._id &&
//                       indicator.isTyping &&
//                       new Date().getTime() -
//                         new Date(indicator.timestamp).getTime() <
//                         3000
//                   )

//                   return (
//                     <div
//                       key={match._id}
//                       onClick={() => handleSelectMatch(match)}
//                       className={`p-4 rounded-xl mx-2 cursor-pointer transition-all duration-300 ${
//                         currentMatch?._id === match._id
//                           ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-sm'
//                           : 'hover:bg-gray-50/80 border border-transparent hover:border-gray-200'
//                       }`}
//                     >
//                       <div className='flex items-center'>
//                         <div className='relative'>
//                           <div className='w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md'>
//                             <img
//                               src={
//                                 matchOtherUser?.photos?.[0]
//                                   ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${matchOtherUser.photos[0]}`
//                                   : '/default-avatar.png'
//                               }
//                               alt={matchOtherUser?.name || 'User'}
//                               className='w-full h-full object-cover'
//                             />
//                           </div>
//                           {isOnline && (
//                             <span className='absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse'></span>
//                           )}
//                           {match.unreadCount > 0 && (
//                             <span className='absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center shadow-md'>
//                               {match.unreadCount}
//                             </span>
//                           )}
//                         </div>
//                         <div className='ml-4 flex-1 min-w-0'>
//                           <div className='flex justify-between items-start'>
//                             <div>
//                               <h3 className='font-semibold text-gray-800 truncate'>
//                                 {matchOtherUser?.name || 'Unknown'}
//                               </h3>
//                               <p className='text-sm text-gray-500'>
//                                 {matchOtherUser?.age || ''} years
//                               </p>
//                             </div>
//                             {match.lastMessageAt && (
//                               <span className='text-xs text-gray-400 whitespace-nowrap'>
//                                 {formatTime(match.lastMessageAt)}
//                               </span>
//                             )}
//                           </div>
//                           <div className='mt-1'>
//                             <p className='text-sm text-gray-600 truncate flex items-center'>
//                               {isTypingInMatch ? (
//                                 <span className='text-blue-500 font-medium flex items-center'>
//                                   <span className='flex mr-2'>
//                                     <span className='w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce mx-0.5'></span>
//                                     <span
//                                       className='w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce mx-0.5'
//                                       style={{ animationDelay: '0.1s' }}
//                                     ></span>
//                                     <span
//                                       className='w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce mx-0.5'
//                                       style={{ animationDelay: '0.2s' }}
//                                     ></span>
//                                   </span>
//                                   typing...
//                                 </span>
//                               ) : (
//                                 <>
//                                   {match.unreadCount > 0 ? (
//                                     <span className='font-semibold text-gray-800'>
//                                       {match.lastMessage}
//                                     </span>
//                                   ) : (
//                                     match.lastMessage || 'Start a conversation'
//                                   )}
//                                 </>
//                               )}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Right Side - Chat Area */}
//         <div
//           className={`${
//             showChatArea ? 'flex' : 'hidden'
//           } md:flex flex-1 flex-col`}
//         >
//           {currentMatch ? (
//             <>
//               {/* Chat Header */}
//               <div className='bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4 shrink-0'>
//                 <div className='flex items-center justify-between'>
//                   <div className='flex items-center'>
//                     <button
//                       onClick={handleBack}
//                       className={`${
//                         isMobile ? 'block' : 'md:hidden'
//                       } mr-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-300`}
//                     >
//                       <svg
//                         className='w-5 h-5 text-gray-600'
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
//                       <div className='w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md'>
//                         <img
//                           src={
//                             otherUser?.photos?.[0]
//                               ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${otherUser.photos[0]}`
//                               : '/default-avatar.png'
//                           }
//                           alt={otherUser?.name || 'User'}
//                           className='w-full h-full object-cover'
//                         />
//                       </div>
//                       <span
//                         className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${
//                           isOtherUserOnline
//                             ? 'bg-green-500 animate-pulse'
//                             : 'bg-gray-400'
//                         }`}
//                       ></span>
//                     </div>
//                     <div className='ml-4'>
//                       <h3 className='font-bold text-gray-800 text-lg'>
//                         {otherUser?.name || 'Unknown'}
//                       </h3>
//                       <div className='flex items-center gap-2 mt-1'>
//                         {isOtherUserTyping ? (
//                           <div className='flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm'>
//                             <div className='flex gap-1'>
//                               <div className='w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce'></div>
//                               <div
//                                 className='w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce'
//                                 style={{ animationDelay: '0.1s' }}
//                               ></div>
//                               <div
//                                 className='w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce'
//                                 style={{ animationDelay: '0.2s' }}
//                               ></div>
//                             </div>
//                             <span>typing</span>
//                           </div>
//                         ) : isOtherUserOnline ? (
//                           <div className='flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm'>
//                             <span className='w-1.5 h-1.5 bg-green-500 rounded-full'></span>
//                             <span>Online</span>
//                           </div>
//                         ) : (
//                           <div className='flex items-center gap-1.5 text-gray-500 text-sm'>
//                             <svg
//                               className='w-4 h-4'
//                               fill='none'
//                               stroke='currentColor'
//                               viewBox='0 0 24 24'
//                             >
//                               <path
//                                 strokeLinecap='round'
//                                 strokeLinejoin='round'
//                                 strokeWidth={2}
//                                 d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
//                               />
//                             </svg>
//                             <span>
//                               Last active {formatLastSeen(otherUserLastSeen)}
//                             </span>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                   <div className='flex items-center gap-4'>
//                     {firstUnreadMessage && (
//                       <button
//                         onClick={scrollToUnread}
//                         className='px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2'
//                         title='Scroll to unread messages'
//                       >
//                         <svg
//                           className='w-4 h-4'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M19 14l-7 7m0 0l-7-7m7 7V3'
//                           />
//                         </svg>
//                         <span>Unread</span>
//                       </button>
//                     )}
//                     <div className='flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full'>
//                       <div
//                         className={`w-2 h-2 rounded-full ${
//                           webSocketConnected
//                             ? 'bg-green-500 animate-pulse'
//                             : 'bg-yellow-500'
//                         }`}
//                       ></div>
//                       <span className='text-sm text-gray-600'>
//                         {webSocketConnected ? 'Live' : 'Polling'}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Messages Container with scroll position management */}
//               <div
//                 ref={messagesContainerRef}
//                 className='flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-gray-100/50'
//               >
//                 <div className='min-h-full flex flex-col justify-end'>
//                   <div className='p-4 md:p-6'>
//                     {loading &&
//                     initialMessagesLoadedRef.current !== currentMatch?._id ? (
//                       <div className='flex items-center justify-center h-full py-12'>
//                         <div className='text-center space-y-4'>
//                           <div className='relative'>
//                             <div className='w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 animate-pulse mx-auto'></div>
//                             <div className='absolute inset-0 flex items-center justify-center'>
//                               <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
//                             </div>
//                           </div>
//                           <p className='text-gray-600 font-medium'>
//                             Loading messages...
//                           </p>
//                         </div>
//                       </div>
//                     ) : messages.length === 0 ? (
//                       <div className='flex flex-col items-center justify-center h-full py-12 text-center space-y-6'>
//                         <div className='w-24 h-24 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-center'>
//                           <svg
//                             className='w-12 h-12 text-blue-400'
//                             fill='none'
//                             stroke='currentColor'
//                             viewBox='0 0 24 24'
//                           >
//                             <path
//                               strokeLinecap='round'
//                               strokeLinejoin='round'
//                               strokeWidth={1.5}
//                               d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
//                             />
//                           </svg>
//                         </div>
//                         <div className='space-y-2'>
//                           <h3 className='text-xl font-bold text-gray-800'>
//                             No messages yet
//                           </h3>
//                           <p className='text-gray-600 max-w-sm'>
//                             Send a message to start the conversation with{' '}
//                             {otherUser?.name || 'your match'}!
//                           </p>
//                         </div>
//                         <div className='flex items-center gap-2 text-sm text-gray-500'>
//                           <svg
//                             className='w-5 h-5'
//                             fill='none'
//                             stroke='currentColor'
//                             viewBox='0 0 24 24'
//                           >
//                             <path
//                               strokeLinecap='round'
//                               strokeLinejoin='round'
//                               strokeWidth={2}
//                               d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
//                             />
//                           </svg>
//                           <span>Messages are end-to-end encrypted</span>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className='space-y-8'>
//                         {Object.entries(groupedMessages).map(
//                           ([date, dateMessages]) => {
//                             const hasUnreadMessages = dateMessages.some(
//                               (msg) =>
//                                 msg.sender !== currentUserId && !msg.isRead
//                             )

//                             return (
//                               <div key={date} className='space-y-4'>
//                                 <div className='flex items-center justify-center'>
//                                   <div className='bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 text-xs font-medium px-4 py-2 rounded-full shadow-sm'>
//                                     {formatDate(dateMessages[0].createdAt)}
//                                   </div>
//                                 </div>
//                                 {hasUnreadMessages && firstUnreadMessage && (
//                                   <div className='flex items-center justify-center animate-fade-in'>
//                                     <div className='bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 text-red-700 text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-sm'>
//                                       <div className='flex gap-1'>
//                                         <div className='w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse'></div>
//                                         <div
//                                           className='w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse'
//                                           style={{ animationDelay: '0.2s' }}
//                                         ></div>
//                                         <div
//                                           className='w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse'
//                                           style={{ animationDelay: '0.4s' }}
//                                         ></div>
//                                       </div>
//                                       <span>New messages</span>
//                                     </div>
//                                   </div>
//                                 )}
//                                 <div className='space-y-3'>
//                                   {dateMessages.map(
//                                     (message: any, index: number) => {
//                                       const isCurrentUser =
//                                         message.sender === currentUserId
//                                       const isOptimistic =
//                                         message.isOptimistic ||
//                                         message._id?.startsWith('temp-')
//                                       const readStatus =
//                                         getMessageReadStatus(message)
//                                       const isEditing =
//                                         editingMessageId === message._id
//                                       const isUnread =
//                                         !isCurrentUser && !message.isRead
//                                       const isFirstUnread =
//                                         firstUnreadMessage?._id === message._id

//                                       return (
//                                         <div
//                                           key={message._id || index}
//                                           id={`message-${message._id}`}
//                                           className={`flex ${
//                                             isCurrentUser
//                                               ? 'justify-end'
//                                               : 'justify-start'
//                                           } group`}
//                                         >
//                                           <div
//                                             className={`max-w-[75%] rounded-2xl px-4 py-3 relative transition-all duration-300 ${
//                                               isCurrentUser
//                                                 ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-none shadow-lg'
//                                                 : 'bg-white text-gray-800 rounded-bl-none shadow-md border border-gray-100'
//                                             } ${
//                                               isOptimistic ? 'opacity-80' : ''
//                                             } ${
//                                               isEditing
//                                                 ? 'ring-3 ring-blue-300 ring-opacity-50'
//                                                 : ''
//                                             } ${
//                                               isFirstUnread
//                                                 ? 'ring-3 ring-red-300 ring-opacity-50'
//                                                 : ''
//                                             } hover:shadow-lg`}
//                                             onDoubleClick={() => {
//                                               if (isCurrentUser) {
//                                                 startEditingMessage(message)
//                                               }
//                                             }}
//                                           >
//                                             {!isCurrentUser &&
//                                               message.senderId?.name && (
//                                                 <p className='text-xs font-semibold text-gray-600 mb-1.5'>
//                                                   {message.senderId.name}
//                                                 </p>
//                                               )}

//                                             {isEditing ? (
//                                               <div className='space-y-3'>
//                                                 <input
//                                                   type='text'
//                                                   value={editMessageContent}
//                                                   onChange={(e) =>
//                                                     setEditMessageContent(
//                                                       e.target.value
//                                                     )
//                                                   }
//                                                   className='w-full bg-white/20 text-white placeholder-white/70 px-3 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50'
//                                                   placeholder='Edit your message...'
//                                                   onKeyPress={(e) => {
//                                                     if (e.key === 'Enter') {
//                                                       saveEditedMessage()
//                                                     }
//                                                     if (e.key === 'Escape') {
//                                                       cancelEditing()
//                                                     }
//                                                   }}
//                                                   autoFocus
//                                                 />
//                                                 <div className='flex gap-2'>
//                                                   <button
//                                                     onClick={saveEditedMessage}
//                                                     className='flex-1 px-3 py-1.5 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200'
//                                                   >
//                                                     Save
//                                                   </button>
//                                                   <button
//                                                     onClick={cancelEditing}
//                                                     className='flex-1 px-3 py-1.5 bg-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-colors duration-200'
//                                                   >
//                                                     Cancel
//                                                   </button>
//                                                 </div>
//                                               </div>
//                                             ) : (
//                                               <>
//                                                 <p className='break-words leading-relaxed'>
//                                                   {message.content}
//                                                 </p>
//                                                 {isCurrentUser && (
//                                                   <button
//                                                     onClick={() =>
//                                                       startEditingMessage(
//                                                         message
//                                                       )
//                                                     }
//                                                     className='absolute -top-2 -right-2 bg-white text-blue-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110'
//                                                     title='Edit message'
//                                                   >
//                                                     <svg
//                                                       className='w-3.5 h-3.5'
//                                                       fill='none'
//                                                       stroke='currentColor'
//                                                       viewBox='0 0 24 24'
//                                                     >
//                                                       <path
//                                                         strokeLinecap='round'
//                                                         strokeLinejoin='round'
//                                                         strokeWidth={2}
//                                                         d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
//                                                       />
//                                                     </svg>
//                                                   </button>
//                                                 )}
//                                               </>
//                                             )}

//                                             <div
//                                               className={`text-xs mt-2 flex items-center justify-between ${
//                                                 isCurrentUser
//                                                   ? 'text-blue-100'
//                                                   : 'text-gray-500'
//                                               }`}
//                                             >
//                                               <span className='flex items-center gap-2'>
//                                                 <span>
//                                                   {formatTime(
//                                                     message.createdAt
//                                                   )}
//                                                 </span>
//                                                 {isUnread && (
//                                                   <span className='w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse'></span>
//                                                 )}
//                                               </span>
//                                               {isCurrentUser && (
//                                                 <span className='ml-2 flex items-center gap-1.5'>
//                                                   {readStatus === 'loading' ? (
//                                                     <div className='flex items-center gap-1'>
//                                                       <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
//                                                       <span>Sending...</span>
//                                                     </div>
//                                                   ) : readStatus === 'read' ? (
//                                                     <div className='flex items-center gap-1'>
//                                                       <span>✓✓</span>
//                                                       <span>Read</span>
//                                                     </div>
//                                                   ) : (
//                                                     <div className='flex items-center gap-1'>
//                                                       <span>✓</span>
//                                                       <span>Sent</span>
//                                                     </div>
//                                                   )}
//                                                 </span>
//                                               )}
//                                             </div>
//                                           </div>
//                                         </div>
//                                       )
//                                     }
//                                   )}
//                                 </div>
//                               </div>
//                             )
//                           }
//                         )}

//                         {isOtherUserTyping && (
//                           <div className='flex justify-start animate-fade-in'>
//                             <div className='max-w-[70%] rounded-2xl px-4 py-3 bg-white text-gray-800 rounded-bl-none shadow-md border border-gray-100'>
//                               <div className='flex items-center gap-3'>
//                                 <div className='flex gap-1'>
//                                   <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
//                                   <div
//                                     className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
//                                     style={{ animationDelay: '0.1s' }}
//                                   ></div>
//                                   <div
//                                     className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
//                                     style={{ animationDelay: '0.2s' }}
//                                   ></div>
//                                 </div>
//                                 <span className='text-sm text-gray-600'>
//                                   {otherUser?.name || 'Someone'} is typing...
//                                 </span>
//                               </div>
//                             </div>
//                           </div>
//                         )}
//                         <div ref={messagesEndRef} className='h-px' />
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Message Input */}
//               <div className='bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-4 shrink-0'>
//                 {editingMessageId && (
//                   <div className='mb-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl'>
//                     <div className='flex items-center justify-between'>
//                       <div className='flex items-center gap-3'>
//                         <div className='w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center'>
//                           <svg
//                             className='w-3 h-3 text-white'
//                             fill='none'
//                             stroke='currentColor'
//                             viewBox='0 0 24 24'
//                           >
//                             <path
//                               strokeLinecap='round'
//                               strokeLinejoin='round'
//                               strokeWidth={2}
//                               d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
//                             />
//                           </svg>
//                         </div>
//                         <div>
//                           <p className='text-sm font-medium text-blue-700'>
//                             Editing message
//                           </p>
//                           <p className='text-xs text-blue-600 truncate max-w-[200px]'>
//                             {editMessageContent.substring(0, 60)}
//                             {editMessageContent.length > 60 ? '...' : ''}
//                           </p>
//                         </div>
//                       </div>
//                       <button
//                         onClick={cancelEditing}
//                         className='text-blue-600 hover:text-blue-800 transition-colors duration-200'
//                       >
//                         <svg
//                           className='w-5 h-5'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M6 18L18 6M6 6l12 12'
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                 )}
//                 <div className='flex items-center gap-3'>
//                   <div className='flex-1 relative'>
//                     <input
//                       type='text'
//                       value={messageInput}
//                       onChange={handleInputChange}
//                       onBlur={handleInputBlur}
//                       onKeyPress={(e) => {
//                         if (e.key === 'Enter' && !e.shiftKey) {
//                           e.preventDefault()
//                           sendMessage()
//                         }
//                         if (e.key === 'Escape' && editingMessageId) {
//                           cancelEditing()
//                         }
//                       }}
//                       placeholder={
//                         editingMessageId
//                           ? 'Edit your message...'
//                           : 'Type a message...'
//                       }
//                       className='w-full border border-gray-300 bg-gray-50 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300'
//                     />
//                     <div className='absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2'>
//                       <button className='text-gray-400 hover:text-blue-500 transition-colors duration-200 p-1.5'>
//                         <svg
//                           className='w-5 h-5'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
//                           />
//                         </svg>
//                       </button>
//                       <button className='text-gray-400 hover:text-blue-500 transition-colors duration-200 p-1.5'>
//                         <svg
//                           className='w-5 h-5'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                   <button
//                     onClick={sendMessage}
//                     disabled={!messageInput.trim()}
//                     className={`rounded-2xl w-14 h-14 flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl ${
//                       editingMessageId
//                         ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
//                         : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
//                     } ${
//                       !messageInput.trim()
//                         ? 'opacity-50 cursor-not-allowed'
//                         : ''
//                     }`}
//                   >
//                     {editingMessageId ? (
//                       <svg
//                         className='w-6 h-6 text-white'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M5 13l4 4L19 7'
//                         />
//                       </svg>
//                     ) : (
//                       <svg
//                         className='w-6 h-6 text-white'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
//                         />
//                       </svg>
//                     )}
//                   </button>
//                 </div>
//                 <div className='mt-3 text-xs text-gray-500 text-center flex items-center justify-center gap-2'>
//                   <div
//                     className={`w-2 h-2 rounded-full ${
//                       webSocketConnected
//                         ? 'bg-green-500 animate-pulse'
//                         : 'bg-yellow-500'
//                     }`}
//                   ></div>
//                   <span>
//                     {webSocketConnected
//                       ? 'Messages are sent instantly'
//                       : 'Messages sync every 5 seconds'}
//                   </span>
//                 </div>
//               </div>
//             </>
//           ) : (
//             // Empty state when no chat is selected on desktop
//             <div className='flex-1 flex flex-col items-center justify-center p-8 md:flex hidden'>
//               <div className='max-w-md text-center space-y-8'>
//                 <div className='relative'>
//                   <div className='w-32 h-32 mx-auto rounded-3xl bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-center'>
//                     <svg
//                       className='w-16 h-16 text-blue-400'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={1.5}
//                         d='M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z'
//                       />
//                     </svg>
//                   </div>
//                   <div className='absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center shadow-lg'>
//                     <svg
//                       className='w-5 h-5 text-white'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={2}
//                         d='M13 10V3L4 14h7v7l9-11h-7z'
//                       />
//                     </svg>
//                   </div>
//                 </div>
//                 <div className='space-y-4'>
//                   <h2 className='text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
//                     Your Messages
//                   </h2>
//                   <p className='text-gray-600 text-lg'>
//                     Select a conversation from the sidebar to start chatting
//                     with your matches.
//                   </p>
//                 </div>
//                 <div className='space-y-4'>
//                   <div
//                     className={`p-4 rounded-2xl ${
//                       webSocketConnected
//                         ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
//                         : 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200'
//                     }`}
//                   >
//                     <div className='flex items-center gap-3'>
//                       <div
//                         className={`w-3 h-3 rounded-full ${
//                           webSocketConnected
//                             ? 'bg-green-500 animate-pulse'
//                             : 'bg-yellow-500'
//                         }`}
//                       ></div>
//                       <p
//                         className={`font-medium ${
//                           webSocketConnected
//                             ? 'text-green-700'
//                             : 'text-yellow-700'
//                         }`}
//                       >
//                         {webSocketConnected
//                           ? '✅ Real-time chat enabled via WebSocket'
//                           : '🔄 Using polling for messages'}
//                       </p>
//                     </div>
//                     {!webSocketConnected && (
//                       <button
//                         onClick={reconnectWebSocket}
//                         className='mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium'
//                       >
//                         Try to connect WebSocket
//                       </button>
//                     )}
//                   </div>
//                   <div className='text-sm text-gray-500'>
//                     <p>
//                       All messages are end-to-end encrypted for your privacy.
//                     </p>
//                   </div>
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
//   editMessageRequest,
//   clearMessages,
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
//   const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
//   const [editMessageContent, setEditMessageContent] = useState('')
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const messagesContainerRef = useRef<HTMLDivElement>(null)
//   const lastUnreadMessageRef = useRef<string | null>(null)

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

//   // Auth state
//   const [authInitialized, setAuthInitialized] = useState(false)
//   const [authRetryCount, setAuthRetryCount] = useState(0)
//   const [checkingAuthLocally, setCheckingAuthLocally] = useState(true)

//   // Responsive state
//   const [isMobile, setIsMobile] = useState(false)
//   const [showChat, setShowChat] = useState(false)

//   // Scroll position state
//   const scrollSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
//   const scrollRestoreAttemptedRef = useRef<Record<string, boolean>>({})

//   const matchIdFromUrl = searchParams.get('matchId')

//   // ============ SCROLL POSITION MANAGEMENT ============
//   const SCROLL_POSITION_KEY = 'chat_scroll_positions'
//   const SCROLL_POSITION_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

//   const saveScrollPosition = useCallback((matchId: string) => {
//     if (!matchId || !messagesContainerRef.current) return

//     const scrollTop = messagesContainerRef.current.scrollTop

//     try {
//       const stored = localStorage.getItem(SCROLL_POSITION_KEY)
//       const positions = stored ? JSON.parse(stored) : {}

//       positions[matchId] = {
//         position: scrollTop,
//         timestamp: Date.now(),
//       }

//       localStorage.setItem(SCROLL_POSITION_KEY, JSON.stringify(positions))
//       console.log(`💾 Saved scroll position for ${matchId}: ${scrollTop}`)
//     } catch (error) {
//       console.error('Error saving scroll position:', error)
//     }
//   }, [])

//   const restoreScrollPosition = useCallback((matchId: string) => {
//     if (!matchId || !messagesContainerRef.current) return

//     // Mark that we've attempted to restore for this match
//     if (scrollRestoreAttemptedRef.current[matchId]) {
//       return
//     }
//     scrollRestoreAttemptedRef.current[matchId] = true

//     try {
//       const stored = localStorage.getItem(SCROLL_POSITION_KEY)
//       if (!stored) {
//         console.log(`No saved scroll position for ${matchId}`)
//         return
//       }

//       const positions = JSON.parse(stored)
//       const matchData = positions[matchId]

//       if (
//         matchData &&
//         Date.now() - matchData.timestamp < SCROLL_POSITION_EXPIRY
//       ) {
//         console.log(
//           `📥 Attempting to restore scroll for ${matchId}: ${matchData.position}`
//         )

//         // Use multiple attempts to ensure restoration
//         let attempts = 0
//         const maxAttempts = 5

//         const tryRestore = () => {
//           attempts++
//           if (messagesContainerRef.current) {
//             const container = messagesContainerRef.current

//             // Wait for container to have content
//             if (container.scrollHeight > 0) {
//               console.log(
//                 `✅ Restoring scroll to ${matchData.position}, attempt ${attempts}`
//               )
//               container.scrollTop = matchData.position

//               // Verify restoration
//               setTimeout(() => {
//                 if (container.scrollTop !== matchData.position) {
//                   console.log(`⚠️ Scroll not restored correctly, retrying...`)
//                   if (attempts < maxAttempts) {
//                     setTimeout(tryRestore, 100)
//                   }
//                 } else {
//                   console.log(
//                     `✅ Scroll successfully restored to ${matchData.position}`
//                   )
//                 }
//               }, 50)
//             } else if (attempts < maxAttempts) {
//               console.log(
//                 `🔄 Container not ready, retrying (${attempts}/${maxAttempts})`
//               )
//               setTimeout(tryRestore, 100)
//             }
//           } else if (attempts < maxAttempts) {
//             setTimeout(tryRestore, 100)
//           }
//         }

//         setTimeout(tryRestore, 100)
//       } else {
//         console.log(`Scroll position expired or not found for ${matchId}`)
//       }
//     } catch (error) {
//       console.error('Error restoring scroll position:', error)
//     }
//   }, [])

//   const cleanupOldScrollPositions = useCallback(() => {
//     try {
//       const stored = localStorage.getItem(SCROLL_POSITION_KEY)
//       if (!stored) return

//       const positions = JSON.parse(stored)
//       const now = Date.now()
//       let changed = false

//       Object.keys(positions).forEach((matchId) => {
//         if (now - positions[matchId].timestamp > SCROLL_POSITION_EXPIRY) {
//           delete positions[matchId]
//           changed = true
//         }
//       })

//       if (changed) {
//         localStorage.setItem(SCROLL_POSITION_KEY, JSON.stringify(positions))
//       }
//     } catch (error) {
//       console.error('Error cleaning up scroll positions:', error)
//     }
//   }, [])

//   // ============ EDIT PERMISSION HELPERS ============
//   const canEditMessage = useCallback(
//     (message: any): boolean => {
//       if (message.sender !== currentUserId) {
//         return false
//       }

//       const messageAge = Date.now() - new Date(message.createdAt).getTime()
//       const editTimeLimit = 15 * 60 * 1000
//       if (messageAge > editTimeLimit) {
//         return false
//       }

//       if (editingMessageId === message._id) {
//         return false
//       }

//       return true
//     },
//     [currentUserId, editingMessageId]
//   )

//   // ============ RESPONSIVE HANDLING ============
//   useEffect(() => {
//     const checkMobile = () => {
//       const mobile = window.innerWidth < 768
//       setIsMobile(mobile)

//       if (mobile) {
//         if (currentMatch) {
//           setShowChat(true)
//         } else {
//           setShowChat(false)
//         }
//       } else {
//         setShowChat(true)
//       }
//     }

//     checkMobile()
//     window.addEventListener('resize', checkMobile)

//     return () => window.removeEventListener('resize', checkMobile)
//   }, [currentMatch])

//   // ============ AUTHENTICATION FIX - OPTIMIZED ============
//   useEffect(() => {
//     const checkTokenInCookies = () => {
//       const cookies = document.cookie.split('; ')
//       const tokenCookie = cookies.find((row) => row.startsWith('token='))
//       return !!tokenCookie
//     }

//     const initializeAuth = async () => {
//       if (checkingAuth || authUser) {
//         setCheckingAuthLocally(false)
//         return
//       }

//       const hasToken = checkTokenInCookies()

//       if (!hasToken) {
//         console.log('🚫 No token found in cookies, redirecting to login')
//         setCheckingAuthLocally(false)
//         router.push('/login')
//         return
//       }

//       try {
//         console.log('🔐 Token found, checking authentication...')
//         setCheckingAuthLocally(true)

//         await dispatch(checkAuthRequest())

//         setTimeout(() => {
//           setCheckingAuthLocally(false)
//           setAuthInitialized(true)
//         }, 1000)
//       } catch (error) {
//         console.error('❌ Auth check error:', error)
//         setCheckingAuthLocally(false)
//       }
//     }

//     if (!authInitialized) {
//       initializeAuth()
//     }
//   }, [dispatch, router, authInitialized])

//   // Handle auth state changes
//   useEffect(() => {
//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount < 2
//     ) {
//       const timer = setTimeout(() => {
//         console.log(`🔄 Retry auth check (${authRetryCount + 1}/2)`)
//         setAuthRetryCount((prev) => prev + 1)
//         dispatch(checkAuthRequest())
//       }, 1000)

//       return () => clearTimeout(timer)
//     }

//     if (
//       !checkingAuth &&
//       !checkingAuthLocally &&
//       !authUser &&
//       authRetryCount >= 2
//     ) {
//       console.log('🚫 Auth failed after retries, redirecting to login')

//       const timer = setTimeout(() => {
//         router.push('/login')
//       }, 1500)

//       return () => clearTimeout(timer)
//     }
//   }, [
//     checkingAuth,
//     checkingAuthLocally,
//     authUser,
//     authRetryCount,
//     dispatch,
//     router,
//   ])

//   // ============ LOAD MATCHES WHEN AUTHENTICATED ============
//   useEffect(() => {
//     if (authUser && !checkingAuth && !checkingAuthLocally) {
//       console.log('✅ User authenticated, loading matches...')
//       dispatch(getMatchesRequest())

//       cleanupOldScrollPositions()
//     }
//   }, [
//     authUser,
//     checkingAuth,
//     checkingAuthLocally,
//     dispatch,
//     cleanupOldScrollPositions,
//   ])

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

//       const now = Date.now()
//       if (isTypingValue && now - lastTypingSentRef.current < 1000) {
//         return
//       }

//       webSocketService.sendTypingIndicator(currentMatch._id, isTypingValue)
//       lastTypingSentRef.current = now
//       isTypingRef.current = isTypingValue
//     },
//     [currentMatch, currentUserId]
//   )

//   const handleTyping = useCallback(() => {
//     if (!currentMatch || !currentUserId) return

//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current)
//     }

//     if (!isTypingRef.current) {
//       sendTypingIndicator(true)
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       if (isTypingRef.current) {
//         sendTypingIndicator(false)
//       }
//     }, 2000)
//   }, [currentMatch, currentUserId, sendTypingIndicator])

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value
//     setMessageInput(value)

//     if (value.trim().length > 0) {
//       handleTyping()
//     } else if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   // ============ MESSAGE EDITING FUNCTIONS ============
//   const startEditingMessage = (message: any) => {
//     if (!canEditMessage(message)) return

//     setEditingMessageId(message._id)
//     setEditMessageContent(message.content)
//     setMessageInput(message.content)

//     setTimeout(() => {
//       const input = document.querySelector(
//         'input[type="text"]'
//       ) as HTMLInputElement
//       input?.focus()
//     }, 100)
//   }

//   const cancelEditing = () => {
//     setEditingMessageId(null)
//     setEditMessageContent('')
//     setMessageInput('')
//   }

//   const saveEditedMessage = async () => {
//     if (!editingMessageId || !editMessageContent.trim() || !currentMatch) return

//     try {
//       await dispatch(
//         editMessageRequest({
//           messageId: editingMessageId,
//           matchId: currentMatch._id,
//           content: editMessageContent.trim(),
//         })
//       )

//       cancelEditing()
//     } catch (error) {
//       console.error('Failed to edit message:', error)
//     }
//   }

//   // ============ WEBSOCKET MANAGEMENT ============
//   useEffect(() => {
//     if (!authUser || checkingAuth) return

//     console.log('🔌 Setting up WebSocket...')

//     const initWebSocket = async () => {
//       try {
//         setConnectionStatus('connecting')
//         const connected = await webSocketService.connect()

//         if (connected) {
//           setConnectionStatus('connected')
//           setWebSocketConnected(true)

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

//     const unsubscribeCallbacks: (() => void)[] = []

//     webSocketService.onConnectionChange((connected: boolean) => {
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

//     const newMessageHandler = (message: any) => {
//       dispatch(newMessageReceived(message))

//       if (
//         message.sender !== currentUserId &&
//         currentMatch?._id === message.matchId
//       ) {
//         lastUnreadMessageRef.current = message._id
//       } else if (message.sender === currentUserId) {
//         scrollToBottom()
//       }

//       if (
//         currentMatch?._id === message.matchId &&
//         message.sender !== currentUserId &&
//         !message.isRead &&
//         currentMatch
//       ) {
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

//     const typingHandler = (data: any) => {
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

//     const statusHandler = (data: any) => {
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

//     const statusBatchHandler = (statuses: any) => {
//       dispatch(setOnlineStatusBatch(statuses))
//     }

//     webSocketService.on('online-status-batch', statusBatchHandler)

//     const messagesReadHandler = (data: any) => {
//       if (data.userId !== currentUserId && data.matchId === currentMatch?._id) {
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

//     const onlineUsersHandler = (userIds: string[]) => {
//       if (userIds.length > 0) {
//         webSocketService.checkOnlineStatusBatch(userIds)
//       }
//     }

//     webSocketService.on('online-users', onlineUsersHandler)

//     return () => {
//       stopPolling()

//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       webSocketService.off('new-message', newMessageHandler)
//       webSocketService.off('user-typing', typingHandler)
//       webSocketService.off('user-status', statusHandler)
//       webSocketService.off('online-status-batch', statusBatchHandler)
//       webSocketService.off('messages-read', messagesReadHandler)
//       webSocketService.off('online-users', onlineUsersHandler)

//       unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe())
//     }
//   }, [authUser, checkingAuth, currentMatch, dispatch, messages, currentUserId])

//   // ============ MARK MESSAGES AS READ ============
//   useEffect(() => {
//     if (!currentMatch || !messages.length || !webSocketService.isConnected()) {
//       return
//     }

//     const unreadMessages = messages.filter(
//       (msg) =>
//         msg.matchId === currentMatch._id &&
//         msg.sender !== currentUserId &&
//         !msg.isRead
//     )

//     if (unreadMessages.length > 0) {
//       const messageIds = unreadMessages.map((msg) => msg._id)
//       webSocketService.markMessagesAsRead(currentMatch._id, messageIds)

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

//   // ============ HANDLE URL MATCH ID ============
//   useEffect(() => {
//     if (matchIdFromUrl && matches.length > 0) {
//       const match = matches.find((m) => m._id === matchIdFromUrl)
//       if (match) {
//         if (!currentMatch || currentMatch._id !== matchIdFromUrl) {
//           handleSelectMatch(match)
//         }

//         if (isMobile) {
//           setShowChat(true)
//         }
//       }
//     }
//   }, [matchIdFromUrl, matches, isMobile])

//   // ============ LOAD INITIAL MESSAGES ============
//   useEffect(() => {
//     if (
//       currentMatch &&
//       authUser &&
//       initialMessagesLoadedRef.current !== currentMatch._id
//     ) {
//       console.log(`📨 Loading messages for match: ${currentMatch._id}`)
//       initialMessagesLoadedRef.current = currentMatch._id

//       dispatch(clearMessages())

//       dispatch(getMessagesRequest({ matchId: currentMatch._id }))
//       dispatch(markMessagesReadRequest(currentMatch._id))

//       const params = new URLSearchParams(searchParams.toString())
//       params.set('matchId', currentMatch._id)
//       router.replace(`?${params.toString()}`, { scroll: false })

//       if (webSocketConnected) {
//         webSocketService.joinMatch(currentMatch._id)
//       } else {
//         startPolling(currentMatch._id)
//       }

//       // Reset restore attempt for this match
//       scrollRestoreAttemptedRef.current[currentMatch._id] = false
//     }
//   }, [
//     currentMatch,
//     authUser,
//     dispatch,
//     router,
//     searchParams,
//     webSocketConnected,
//   ])

//   // ============ RESTORE SCROLL WHEN MESSAGES ARE LOADED ============
//   useEffect(() => {
//     if (currentMatch && messages.length > 0 && !loading) {
//       console.log(
//         `📋 Messages loaded for ${currentMatch._id}, attempting scroll restore`
//       )

//       // Wait a bit for DOM to update, then restore scroll
//       const timer = setTimeout(() => {
//         restoreScrollPosition(currentMatch._id)
//       }, 300)

//       return () => clearTimeout(timer)
//     }
//   }, [currentMatch, messages, loading, restoreScrollPosition])

//   // ============ POLLING FUNCTIONS ============
//   const stopPolling = useCallback(() => {
//     if (pollIntervalRef.current) {
//       clearInterval(pollIntervalRef.current)
//       pollIntervalRef.current = null
//       isPollingRef.current = false
//     }
//   }, [])

//   const startPolling = useCallback(
//     (matchId: string) => {
//       if (!matchId || isPollingRef.current) return

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
//               const existingIds = new Set(messages.map((msg) => msg._id))
//               const newMessages = data.messages.filter(
//                 (msg: any) =>
//                   !existingIds.has(msg._id) && !msg._id?.startsWith('temp-')
//               )

//               if (newMessages.length > 0) {
//                 newMessages.forEach((msg: any) => {
//                   dispatch(newMessageReceived(msg))
//                 })
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
//       return
//     }

//     if (editingMessageId) {
//       await saveEditedMessage()
//       return
//     }

//     const content = messageInput.trim()
//     setMessageInput('')

//     const tempId = `temp-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`

//     if (isTypingRef.current) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

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

//     scrollToBottom()

//     try {
//       if (webSocketService.isConnected()) {
//         const success = await webSocketService.sendMessage(
//           currentMatch._id,
//           content,
//           tempId
//         )

//         if (!success) {
//           dispatch(
//             sendMessageRequest({
//               matchId: currentMatch._id,
//               content,
//               tempId,
//             })
//           )
//         }
//       } else {
//         dispatch(
//           sendMessageRequest({
//             matchId: currentMatch._id,
//             content,
//             tempId,
//           })
//         )
//       }
//     } catch (error: any) {
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

//   const scrollToUnread = () => {
//     if (lastUnreadMessageRef.current) {
//       const unreadElement = document.getElementById(
//         `message-${lastUnreadMessageRef.current}`
//       )
//       if (unreadElement) {
//         unreadElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
//       }
//     } else {
//       scrollToBottom()
//     }
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

//     return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
//   }

//   // ============ handleSelectMatch function ============
//   const handleSelectMatch = (match: any) => {
//     console.log(`🔄 Selecting match: ${match._id}`)

//     if (currentMatch?._id === match._id) {
//       if (isMobile) {
//         setShowChat(true)
//       }
//       return
//     }

//     // Save current scroll position before switching
//     if (currentMatch && messagesContainerRef.current) {
//       saveScrollPosition(currentMatch._id)
//     }

//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(clearMessages())
//     initialMessagesLoadedRef.current = null

//     dispatch(setCurrentMatch(match))

//     if (isMobile) {
//       setShowChat(true)
//     }

//     const params = new URLSearchParams(searchParams.toString())
//     params.set('matchId', match._id)
//     router.replace(`?${params.toString()}`, { scroll: false })

//     setTimeout(() => {
//       dispatch(getMessagesRequest({ matchId: match._id }))
//       dispatch(markMessagesReadRequest(match._id))

//       if (webSocketService.isConnected()) {
//         webSocketService.joinMatch(match._id)
//       } else {
//         startPolling(match._id)
//       }
//     }, 50)
//   }

//   // ============ handleBack function ============
//   const handleBack = () => {
//     console.log('🔙 Going back to matches list')

//     // Save scroll position before leaving
//     if (currentMatch && messagesContainerRef.current) {
//       saveScrollPosition(currentMatch._id)
//     }

//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }

//     if (currentMatch && webSocketService.isConnected()) {
//       webSocketService.leaveMatch(currentMatch._id)
//     }

//     dispatch(setCurrentMatch(null))
//     dispatch(clearMessages())

//     setShowChat(false)
//     setEditingMessageId(null)
//     setEditMessageContent('')
//     setMessageInput('')

//     initialMessagesLoadedRef.current = null

//     const params = new URLSearchParams(searchParams.toString())
//     params.delete('matchId')
//     router.replace(`?${params.toString()}`, { scroll: false })
//   }

//   const reconnectWebSocket = async () => {
//     setConnectionStatus('connecting')

//     const connected = await webSocketService.connect()
//     if (connected) {
//       setConnectionStatus('connected')
//     } else {
//       setConnectionStatus('failed')
//     }
//   }

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

//     return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
//   }

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

//   const handleInputBlur = () => {
//     if (isTypingRef.current && currentMatch) {
//       sendTypingIndicator(false)
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }

//   const getMessageReadStatus = (message: any) => {
//     if (message.sender !== currentUserId) return null

//     if (message.isOptimistic || message._id?.startsWith('temp-')) {
//       return 'loading'
//     }

//     if (message.isRead) {
//       return 'read'
//     }

//     return 'sent'
//   }

//   // Find first unread message for the current match
//   const findFirstUnreadMessage = () => {
//     if (!currentMatch) return null

//     for (let i = messages.length - 1; i >= 0; i--) {
//       const message = messages[i]
//       if (
//         message.matchId === currentMatch._id &&
//         message.sender !== currentUserId &&
//         !message.isRead
//       ) {
//         return message
//       }
//     }
//     return null
//   }

//   const firstUnreadMessage = findFirstUnreadMessage()

//   // Determine what to show
//   const showUserList = !isMobile || !showChat
//   const showChatArea = !isMobile || showChat

//   // ============ SAVE SCROLL POSITION ON SCROLL ============
//   useEffect(() => {
//     const messagesContainer = messagesContainerRef.current
//     if (!messagesContainer || !currentMatch) return

//     const handleScroll = () => {
//       if (currentMatch) {
//         if (scrollSaveTimeoutRef.current) {
//           clearTimeout(scrollSaveTimeoutRef.current)
//         }

//         scrollSaveTimeoutRef.current = setTimeout(() => {
//           saveScrollPosition(currentMatch._id)
//         }, 200)
//       }
//     }

//     messagesContainer.addEventListener('scroll', handleScroll)

//     return () => {
//       messagesContainer.removeEventListener('scroll', handleScroll)
//       if (scrollSaveTimeoutRef.current) {
//         clearTimeout(scrollSaveTimeoutRef.current)
//       }
//     }
//   }, [currentMatch, saveScrollPosition])

//   // ============ Component Cleanup ============
//   useEffect(() => {
//     return () => {
//       stopPolling()

//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }

//       if (scrollSaveTimeoutRef.current) {
//         clearTimeout(scrollSaveTimeoutRef.current)
//       }

//       if (
//         isTypingRef.current &&
//         currentMatch &&
//         webSocketService.isConnected()
//       ) {
//         webSocketService.sendTypingIndicator(currentMatch._id, false)
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       initialMessagesLoadedRef.current = null
//       isPollingRef.current = false
//       isTypingRef.current = false
//     }
//   }, [currentMatch, stopPolling])

//   // ============ RENDER LOGIC ============
//   if ((checkingAuth || checkingAuthLocally) && !authUser) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Checking authentication...</p>
//           <p className='text-sm text-gray-400 mt-2'>
//             Please wait while we verify your session
//           </p>
//         </div>
//       </div>
//     )
//   }

//   if (!authUser && !checkingAuth && !checkingAuthLocally) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p className='text-gray-600'>Session expired</p>
//           <p className='text-sm text-gray-400 mt-2'>Redirecting to login...</p>
//           <button
//             onClick={() => router.push('/login')}
//             className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
//           >
//             Go to Login Now
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
//         <div
//           className={`${
//             showUserList ? 'block' : 'hidden'
//           } md:block w-full md:w-80 bg-white border-r border-gray-200 flex flex-col`}
//         >
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
//         <div
//           className={`${
//             showChatArea ? 'flex' : 'hidden'
//           } md:flex flex-1 flex-col`}
//           ref={messagesContainerRef}
//         >
//           {currentMatch ? (
//             <>
//               {/* Chat Header */}
//               <div className='bg-white border-b border-gray-200 p-4 shrink-0'>
//                 <div className='flex items-center justify-between'>
//                   <div className='flex items-center'>
//                     <button
//                       onClick={handleBack}
//                       className={`${
//                         isMobile ? 'block' : 'md:hidden'
//                       } mr-3 text-gray-500 hover:text-gray-700`}
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
//                   <div className='flex items-center gap-4'>
//                     {firstUnreadMessage && (
//                       <button
//                         onClick={scrollToUnread}
//                         className='px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1'
//                         title='Scroll to unread messages'
//                       >
//                         <span>Unread</span>
//                         <svg
//                           className='w-4 h-4'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M19 14l-7 7m0 0l-7-7m7 7V3'
//                           />
//                         </svg>
//                       </button>
//                     )}
//                     <div className='flex items-center gap-2'>
//                       <div
//                         className={`w-2 h-2 rounded-full ${
//                           webSocketConnected
//                             ? 'bg-green-500 animate-pulse'
//                             : 'bg-gray-400'
//                         }`}
//                       ></div>
//                       <p className='text-sm text-gray-500'>
//                         {webSocketConnected ? 'Live' : 'Polling'}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Messages Container */}
//               <div className='flex-1 overflow-y-auto bg-gray-50'>
//                 <div className='min-h-full flex flex-col justify-end'>
//                   <div className='p-4'>
//                     {loading &&
//                     initialMessagesLoadedRef.current !== currentMatch?._id ? (
//                       <div className='flex items-center justify-center h-full py-8'>
//                         <div className='text-center'>
//                           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
//                           <p className='text-gray-600'>Loading messages...</p>
//                         </div>
//                       </div>
//                     ) : messages.length === 0 ? (
//                       <div className='flex flex-col items-center justify-center h-full py-8 text-center'>
//                         <div className='text-gray-400 mb-4'>
//                           <svg
//                             className='w-16 h-16'
//                             fill='none'
//                             stroke='currentColor'
//                             viewBox='0 0 24 24'
//                           >
//                             <path
//                               strokeLinecap='round'
//                               strokeLinejoin='round'
//                               strokeWidth={1.5}
//                               d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
//                             />
//                           </svg>
//                         </div>
//                         <h3 className='text-lg font-semibold text-gray-700 mb-2'>
//                           No messages yet
//                         </h3>
//                         <p className='text-gray-500'>
//                           Send a message to start the conversation!
//                         </p>
//                       </div>
//                     ) : (
//                       <div className='space-y-6'>
//                         {Object.entries(groupedMessages).map(
//                           ([date, dateMessages]) => {
//                             const hasUnreadMessages = dateMessages.some(
//                               (msg) =>
//                                 msg.sender !== currentUserId && !msg.isRead
//                             )

//                             return (
//                               <div key={date}>
//                                 <div className='flex items-center justify-center my-4'>
//                                   <div className='bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full'>
//                                     {formatDate(dateMessages[0].createdAt)}
//                                   </div>
//                                 </div>
//                                 {hasUnreadMessages && firstUnreadMessage && (
//                                   <div className='flex items-center justify-center my-2'>
//                                     <div className='bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full flex items-center gap-1'>
//                                       <svg
//                                         className='w-3 h-3'
//                                         fill='currentColor'
//                                         viewBox='0 0 20 20'
//                                       >
//                                         <path
//                                           fillRule='evenodd'
//                                           d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
//                                           clipRule='evenodd'
//                                         />
//                                       </svg>
//                                       <span>Unread messages</span>
//                                     </div>
//                                   </div>
//                                 )}
//                                 <div className='space-y-4'>
//                                   {dateMessages.map(
//                                     (message: any, index: number) => {
//                                       const isCurrentUser =
//                                         message.sender === currentUserId
//                                       const isOptimistic =
//                                         message.isOptimistic ||
//                                         message._id?.startsWith('temp-')
//                                       const readStatus =
//                                         getMessageReadStatus(message)
//                                       const isEditing =
//                                         editingMessageId === message._id
//                                       const isUnread =
//                                         !isCurrentUser && !message.isRead
//                                       const isFirstUnread =
//                                         firstUnreadMessage?._id === message._id

//                                       // NEW: Check if message can be edited
//                                       const canEdit = canEditMessage(message)

//                                       return (
//                                         <div
//                                           key={message._id || index}
//                                           id={`message-${message._id}`}
//                                           className={`flex ${
//                                             isCurrentUser
//                                               ? 'justify-end'
//                                               : 'justify-start'
//                                           }`}
//                                         >
//                                           {isUnread && (
//                                             <div className='flex items-center mr-2'>
//                                               <div className='w-2 h-2 bg-red-500 rounded-full'></div>
//                                             </div>
//                                           )}
//                                           <div
//                                             className={`max-w-[70%] rounded-2xl px-4 py-3 relative group ${
//                                               isCurrentUser
//                                                 ? 'bg-blue-500 text-white rounded-br-none'
//                                                 : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
//                                             } ${
//                                               isOptimistic ? 'opacity-80' : ''
//                                             } ${
//                                               isEditing
//                                                 ? 'ring-2 ring-blue-300'
//                                                 : ''
//                                             } ${
//                                               isFirstUnread
//                                                 ? 'ring-2 ring-red-300'
//                                                 : ''
//                                             }`}
//                                             onDoubleClick={() => {
//                                               if (canEdit) {
//                                                 startEditingMessage(message)
//                                               }
//                                             }}
//                                           >
//                                             {!isCurrentUser &&
//                                               message.senderId?.name && (
//                                                 <p className='text-xs font-semibold text-gray-600 mb-1'>
//                                                   {message.senderId.name}
//                                                 </p>
//                                               )}

//                                             {isEditing ? (
//                                               <div className='mb-2'>
//                                                 <input
//                                                   type='text'
//                                                   value={editMessageContent}
//                                                   onChange={(e) =>
//                                                     setEditMessageContent(
//                                                       e.target.value
//                                                     )
//                                                   }
//                                                   className='w-full bg-blue-600 text-white px-3 py-2 rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300'
//                                                   onKeyPress={(e) => {
//                                                     if (e.key === 'Enter') {
//                                                       saveEditedMessage()
//                                                     }
//                                                     if (e.key === 'Escape') {
//                                                       cancelEditing()
//                                                     }
//                                                   }}
//                                                   autoFocus
//                                                 />
//                                                 <div className='flex gap-2 mt-2'>
//                                                   <button
//                                                     onClick={saveEditedMessage}
//                                                     className='px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600'
//                                                   >
//                                                     Save
//                                                   </button>
//                                                   <button
//                                                     onClick={cancelEditing}
//                                                     className='px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600'
//                                                   >
//                                                     Cancel
//                                                   </button>
//                                                 </div>
//                                               </div>
//                                             ) : (
//                                               <>
//                                                 <p className='break-words'>
//                                                   {message.content}
//                                                 </p>
//                                                 {/* NEW: Only show edit button if message can be edited */}
//                                                 {canEdit && (
//                                                   <button
//                                                     onClick={() =>
//                                                       startEditingMessage(
//                                                         message
//                                                       )
//                                                     }
//                                                     className='absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md'
//                                                     title='Edit message'
//                                                   >
//                                                     <svg
//                                                       className='w-3 h-3'
//                                                       fill='none'
//                                                       stroke='currentColor'
//                                                       viewBox='0 0 24 24'
//                                                     >
//                                                       <path
//                                                         strokeLinecap='round'
//                                                         strokeLinejoin='round'
//                                                         strokeWidth={2}
//                                                         d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
//                                                       />
//                                                     </svg>
//                                                   </button>
//                                                 )}
//                                               </>
//                                             )}

//                                             <div
//                                               className={`text-xs mt-1 flex items-center justify-between ${
//                                                 isCurrentUser
//                                                   ? 'text-blue-100'
//                                                   : 'text-gray-400'
//                                               }`}
//                                             >
//                                               <span>
//                                                 {formatTime(message.createdAt)}
//                                               </span>
//                                               {isCurrentUser && (
//                                                 <span className='ml-2 flex items-center gap-1'>
//                                                   {readStatus === 'loading' ? (
//                                                     <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
//                                                   ) : readStatus === 'read' ? (
//                                                     <>
//                                                       <span>✓✓</span>
//                                                       <span className='ml-1'>
//                                                         Read
//                                                       </span>
//                                                     </>
//                                                   ) : (
//                                                     '✓ Sent'
//                                                   )}
//                                                 </span>
//                                               )}
//                                             </div>
//                                           </div>
//                                         </div>
//                                       )
//                                     }
//                                   )}
//                                 </div>
//                               </div>
//                             )
//                           }
//                         )}

//                         {isOtherUserTyping && (
//                           <div className='flex justify-start'>
//                             <div className='max-w-[70%] rounded-2xl px-4 py-3 bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'>
//                               <div className='flex items-center gap-1'>
//                                 <div className='flex gap-1'>
//                                   <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
//                                   <div
//                                     className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
//                                     style={{ animationDelay: '0.1s' }}
//                                   ></div>
//                                   <div
//                                     className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
//                                     style={{ animationDelay: '0.2s' }}
//                                   ></div>
//                                 </div>
//                                 <span className='text-sm text-gray-500 ml-2'>
//                                   typing...
//                                 </span>
//                               </div>
//                             </div>
//                           </div>
//                         )}
//                         <div ref={messagesEndRef} />
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Message Input */}
//               <div className='bg-white border-t border-gray-200 p-4 shrink-0'>
//                 {editingMessageId && (
//                   <div className='mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md'>
//                     <div className='flex items-center justify-between'>
//                       <span className='text-sm text-blue-700'>
//                         <span className='font-medium'>Editing message:</span>{' '}
//                         {editMessageContent.substring(0, 50)}
//                         {editMessageContent.length > 50 ? '...' : ''}
//                       </span>
//                       <button
//                         onClick={cancelEditing}
//                         className='text-blue-700 hover:text-blue-900'
//                       >
//                         <svg
//                           className='w-4 h-4'
//                           fill='none'
//                           stroke='currentColor'
//                           viewBox='0 0 24 24'
//                         >
//                           <path
//                             strokeLinecap='round'
//                             strokeLinejoin='round'
//                             strokeWidth={2}
//                             d='M6 18L18 6M6 6l12 12'
//                           />
//                         </svg>
//                       </button>
//                     </div>
//                   </div>
//                 )}
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
//                       if (e.key === 'Escape' && editingMessageId) {
//                         cancelEditing()
//                       }
//                     }}
//                     placeholder={
//                       editingMessageId
//                         ? 'Edit your message...'
//                         : 'Type a message...'
//                     }
//                     className='flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
//                   />
//                   <button
//                     onClick={sendMessage}
//                     disabled={!messageInput.trim()}
//                     className={`ml-3 ${
//                       editingMessageId
//                         ? 'bg-green-500 hover:bg-green-600'
//                         : 'bg-blue-500 hover:bg-blue-600'
//                     } text-white rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
//                   >
//                     {editingMessageId ? (
//                       <svg
//                         className='w-5 h-5'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M5 13l4 4L19 7'
//                         />
//                       </svg>
//                     ) : (
//                       <svg
//                         className='w-5 h-5'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
//                         />
//                       </svg>
//                     )}
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
//             // Empty state when no chat is selected on desktop
//             <div className='flex-1 flex flex-col items-center justify-center p-8 md:flex hidden'>
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
  editMessageRequest,
  clearMessages,
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editMessageContent, setEditMessageContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const lastUnreadMessageRef = useRef<string | null>(null)

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

  // Responsive state
  const [isMobile, setIsMobile] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const matchIdFromUrl = searchParams.get('matchId')

  // ============ EDIT PERMISSION HELPERS ============
  const canEditMessage = useCallback(
    (message: any): boolean => {
      if (message.sender !== currentUserId) {
        return false
      }

      const messageAge = Date.now() - new Date(message.createdAt).getTime()
      const editTimeLimit = 15 * 60 * 1000
      if (messageAge > editTimeLimit) {
        return false
      }

      if (editingMessageId === message._id) {
        return false
      }

      return true
    },
    [currentUserId, editingMessageId]
  )

  // ============ RESPONSIVE HANDLING ============
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      if (mobile) {
        if (currentMatch) {
          setShowChat(true)
        } else {
          setShowChat(false)
        }
      } else {
        setShowChat(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [currentMatch])

  // ============ AUTHENTICATION FIX - OPTIMIZED ============
  useEffect(() => {
    const checkTokenInCookies = () => {
      const cookies = document.cookie.split('; ')
      const tokenCookie = cookies.find((row) => row.startsWith('token='))
      return !!tokenCookie
    }

    const initializeAuth = async () => {
      if (checkingAuth || authUser) {
        setCheckingAuthLocally(false)
        return
      }

      const hasToken = checkTokenInCookies()

      if (!hasToken) {
        console.log('🚫 No token found in cookies, redirecting to login')
        setCheckingAuthLocally(false)
        router.push('/login')
        return
      }

      try {
        console.log('🔐 Token found, checking authentication...')
        setCheckingAuthLocally(true)

        await dispatch(checkAuthRequest())

        setTimeout(() => {
          setCheckingAuthLocally(false)
          setAuthInitialized(true)
        }, 1000)
      } catch (error) {
        console.error('❌ Auth check error:', error)
        setCheckingAuthLocally(false)
      }
    }

    if (!authInitialized) {
      initializeAuth()
    }
  }, [dispatch, router, authInitialized])

  // Handle auth state changes
  useEffect(() => {
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

  // ============ MESSAGE EDITING FUNCTIONS ============
  const startEditingMessage = (message: any) => {
    if (!canEditMessage(message)) return

    setEditingMessageId(message._id)
    setEditMessageContent(message.content)
    setMessageInput(message.content)

    setTimeout(() => {
      const input = document.querySelector(
        'input[type="text"]'
      ) as HTMLInputElement
      input?.focus()
    }, 100)
  }

  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditMessageContent('')
    setMessageInput('')
  }

  const saveEditedMessage = async () => {
    if (!editingMessageId || !editMessageContent.trim() || !currentMatch) return

    try {
      await dispatch(
        editMessageRequest({
          messageId: editingMessageId,
          matchId: currentMatch._id,
          content: editMessageContent.trim(),
        })
      )

      cancelEditing()
    } catch (error) {
      console.error('Failed to edit message:', error)
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

      if (
        message.sender !== currentUserId &&
        currentMatch?._id === message.matchId
      ) {
        lastUnreadMessageRef.current = message._id
      } else if (message.sender === currentUserId) {
        scrollToBottom()
      }

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
      if (match) {
        if (!currentMatch || currentMatch._id !== matchIdFromUrl) {
          handleSelectMatch(match)
        }

        if (isMobile) {
          setShowChat(true)
        }
      }
    }
  }, [matchIdFromUrl, matches, isMobile])

  // ============ LOAD INITIAL MESSAGES ============
  useEffect(() => {
    if (
      currentMatch &&
      authUser &&
      initialMessagesLoadedRef.current !== currentMatch._id
    ) {
      console.log(`📨 Loading messages for match: ${currentMatch._id}`)
      initialMessagesLoadedRef.current = currentMatch._id

      dispatch(clearMessages())

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

  // ============ SCROLL TO BOTTOM WHEN MESSAGES ARE LOADED ============
  useEffect(() => {
    if (currentMatch && messages.length > 0 && !loading) {
      console.log(
        `📋 Messages loaded for ${currentMatch._id} (${messages.length} messages), scrolling to bottom...`
      )

      // Wait for DOM to update, then scroll to bottom
      const timer = setTimeout(() => {
        scrollToBottom()
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [currentMatch, messages, loading])

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
            }/messages/${matchId}`,
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

    if (editingMessageId) {
      await saveEditedMessage()
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
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        console.log('⬇️ Scrolled to bottom')
      }
    }, 100)
  }

  const scrollToUnread = () => {
    if (lastUnreadMessageRef.current) {
      const unreadElement = document.getElementById(
        `message-${lastUnreadMessageRef.current}`
      )
      if (unreadElement) {
        unreadElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } else {
      scrollToBottom()
    }
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

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // ============ handleSelectMatch function ============
  const handleSelectMatch = (match: any) => {
    console.log(`🔄 Selecting match: ${match._id}`)

    if (currentMatch?._id === match._id) {
      if (isMobile) {
        setShowChat(true)
      }
      return
    }

    if (isTypingRef.current && currentMatch) {
      sendTypingIndicator(false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }

    if (currentMatch && webSocketService.isConnected()) {
      webSocketService.leaveMatch(currentMatch._id)
    }

    dispatch(clearMessages())
    initialMessagesLoadedRef.current = null

    dispatch(setCurrentMatch(match))

    if (isMobile) {
      setShowChat(true)
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set('matchId', match._id)
    router.replace(`?${params.toString()}`, { scroll: false })

    setTimeout(() => {
      dispatch(getMessagesRequest({ matchId: match._id }))
      dispatch(markMessagesReadRequest(match._id))

      if (webSocketService.isConnected()) {
        webSocketService.joinMatch(match._id)
      } else {
        startPolling(match._id)
      }
    }, 50)
  }

  // ============ handleBack function ============
  const handleBack = () => {
    console.log('🔙 Going back to matches list')

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
    dispatch(clearMessages())

    setShowChat(false)
    setEditingMessageId(null)
    setEditMessageContent('')
    setMessageInput('')

    initialMessagesLoadedRef.current = null

    const params = new URLSearchParams(searchParams.toString())
    params.delete('matchId')
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  // ============ Component Cleanup ============
  useEffect(() => {
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

      initialMessagesLoadedRef.current = null
      isPollingRef.current = false
      isTypingRef.current = false
    }
  }, [currentMatch, stopPolling])

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

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
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

  // Find first unread message for the current match
  const findFirstUnreadMessage = () => {
    if (!currentMatch) return null

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]
      if (
        message.matchId === currentMatch._id &&
        message.sender !== currentUserId &&
        !message.isRead
      ) {
        return message
      }
    }
    return null
  }

  const firstUnreadMessage = findFirstUnreadMessage()

  // Determine what to show
  const showUserList = !isMobile || !showChat
  const showChatArea = !isMobile || showChat

  // ============ RENDER LOGIC ============
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
        <div
          className={`${
            showUserList ? 'block' : 'hidden'
          } md:block w-full md:w-80 bg-white border-r border-gray-200 flex flex-col`}
        >
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
        <div
          className={`${
            showChatArea ? 'flex' : 'hidden'
          } md:flex flex-1 flex-col`}
          ref={messagesContainerRef}
        >
          {currentMatch ? (
            <>
              {/* Chat Header */}
              <div className='bg-white border-b border-gray-200 p-4 shrink-0'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <button
                      onClick={handleBack}
                      className={`${
                        isMobile ? 'block' : 'md:hidden'
                      } mr-3 text-gray-500 hover:text-gray-700`}
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
                  <div className='flex items-center gap-4'>
                    {firstUnreadMessage && (
                      <button
                        onClick={scrollToUnread}
                        className='px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1'
                        title='Scroll to unread messages'
                      >
                        <span>Unread</span>
                        <svg
                          className='w-4 h-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 14l-7 7m0 0l-7-7m7 7V3'
                          />
                        </svg>
                      </button>
                    )}
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
              </div>

              {/* Messages Container */}
              <div className='flex-1 overflow-y-auto bg-gray-50'>
                <div className='min-h-full flex flex-col justify-end'>
                  <div className='p-4'>
                    {loading &&
                    initialMessagesLoadedRef.current !== currentMatch?._id ? (
                      <div className='flex items-center justify-center h-full py-8'>
                        <div className='text-center'>
                          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
                          <p className='text-gray-600'>Loading messages...</p>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className='flex flex-col items-center justify-center h-full py-8 text-center'>
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
                          ([date, dateMessages]) => {
                            const hasUnreadMessages = dateMessages.some(
                              (msg) =>
                                msg.sender !== currentUserId && !msg.isRead
                            )

                            return (
                              <div key={date}>
                                <div className='flex items-center justify-center my-4'>
                                  <div className='bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full'>
                                    {formatDate(dateMessages[0].createdAt)}
                                  </div>
                                </div>
                                {hasUnreadMessages && firstUnreadMessage && (
                                  <div className='flex items-center justify-center my-2'>
                                    <div className='bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full flex items-center gap-1'>
                                      <svg
                                        className='w-3 h-3'
                                        fill='currentColor'
                                        viewBox='0 0 20 20'
                                      >
                                        <path
                                          fillRule='evenodd'
                                          d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                                          clipRule='evenodd'
                                        />
                                      </svg>
                                      <span>Unread messages</span>
                                    </div>
                                  </div>
                                )}
                                <div className='space-y-4'>
                                  {dateMessages.map(
                                    (message: any, index: number) => {
                                      const isCurrentUser =
                                        message.sender === currentUserId
                                      const isOptimistic =
                                        message.isOptimistic ||
                                        message._id?.startsWith('temp-')
                                      const readStatus =
                                        getMessageReadStatus(message)
                                      const isEditing =
                                        editingMessageId === message._id
                                      const isUnread =
                                        !isCurrentUser && !message.isRead
                                      const isFirstUnread =
                                        firstUnreadMessage?._id === message._id

                                      // NEW: Check if message can be edited
                                      const canEdit = canEditMessage(message)

                                      return (
                                        <div
                                          key={message._id || index}
                                          id={`message-${message._id}`}
                                          className={`flex ${
                                            isCurrentUser
                                              ? 'justify-end'
                                              : 'justify-start'
                                          }`}
                                        >
                                          {isUnread && (
                                            <div className='flex items-center mr-2'>
                                              <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                                            </div>
                                          )}
                                          <div
                                            className={`max-w-[70%] rounded-2xl px-4 py-3 relative group ${
                                              isCurrentUser
                                                ? 'bg-blue-500 text-white rounded-br-none'
                                                : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
                                            } ${
                                              isOptimistic ? 'opacity-80' : ''
                                            } ${
                                              isEditing
                                                ? 'ring-2 ring-blue-300'
                                                : ''
                                            } ${
                                              isFirstUnread
                                                ? 'ring-2 ring-red-300'
                                                : ''
                                            }`}
                                            onDoubleClick={() => {
                                              if (canEdit) {
                                                startEditingMessage(message)
                                              }
                                            }}
                                          >
                                            {!isCurrentUser &&
                                              message.senderId?.name && (
                                                <p className='text-xs font-semibold text-gray-600 mb-1'>
                                                  {message.senderId.name}
                                                </p>
                                              )}

                                            {isEditing ? (
                                              <div className='mb-2'>
                                                <input
                                                  type='text'
                                                  value={editMessageContent}
                                                  onChange={(e) =>
                                                    setEditMessageContent(
                                                      e.target.value
                                                    )
                                                  }
                                                  className='w-full bg-blue-600 text-white px-3 py-2 rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300'
                                                  onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                      saveEditedMessage()
                                                    }
                                                    if (e.key === 'Escape') {
                                                      cancelEditing()
                                                    }
                                                  }}
                                                  autoFocus
                                                />
                                                <div className='flex gap-2 mt-2'>
                                                  <button
                                                    onClick={saveEditedMessage}
                                                    className='px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600'
                                                  >
                                                    Save
                                                  </button>
                                                  <button
                                                    onClick={cancelEditing}
                                                    className='px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600'
                                                  >
                                                    Cancel
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                <p className='break-words'>
                                                  {message.content}
                                                </p>
                                                {/* NEW: Only show edit button if message can be edited */}
                                                {canEdit && (
                                                  <button
                                                    onClick={() =>
                                                      startEditingMessage(
                                                        message
                                                      )
                                                    }
                                                    className='absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md'
                                                    title='Edit message'
                                                  >
                                                    <svg
                                                      className='w-3 h-3'
                                                      fill='none'
                                                      stroke='currentColor'
                                                      viewBox='0 0 24 24'
                                                    >
                                                      <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                                      />
                                                    </svg>
                                                  </button>
                                                )}
                                              </>
                                            )}

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
                                                      <span className='ml-1'>
                                                        Read
                                                      </span>
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
                                    }
                                  )}
                                </div>
                              </div>
                            )
                          }
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
                </div>
              </div>

              {/* Message Input */}
              <div className='bg-white border-t border-gray-200 p-4 shrink-0'>
                {editingMessageId && (
                  <div className='mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-blue-700'>
                        <span className='font-medium'>Editing message:</span>{' '}
                        {editMessageContent.substring(0, 50)}
                        {editMessageContent.length > 50 ? '...' : ''}
                      </span>
                      <button
                        onClick={cancelEditing}
                        className='text-blue-700 hover:text-blue-900'
                      >
                        <svg
                          className='w-4 h-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M6 18L18 6M6 6l12 12'
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
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
                      if (e.key === 'Escape' && editingMessageId) {
                        cancelEditing()
                      }
                    }}
                    placeholder={
                      editingMessageId
                        ? 'Edit your message...'
                        : 'Type a message...'
                    }
                    className='flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                    className={`ml-3 ${
                      editingMessageId
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    {editingMessageId ? (
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
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                    ) : (
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
                    )}
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
            // Empty state when no chat is selected on desktop
            <div className='flex-1 flex flex-col items-center justify-center p-8 md:flex hidden'>
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
