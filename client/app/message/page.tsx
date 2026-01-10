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

// const MessagesPage: React.FC = () => {
//   const searchParams = useSearchParams()
//   const router = useRouter()
//   const dispatch = useDispatch<AppDispatch>()

//   const { matches, currentMatch, messages, loading, error } = useSelector(
//     (state: RootState) => state.messages
//   )

//   // Get auth user from Redux store
//   const { user: authUser, checkingAuth } = useSelector(
//     (state: RootState) => state.auth
//   )

//   // Get current user ID from Redux auth state
//   const currentUserId =
//     authUser?.id?.toString() || authUser?._id?.toString() || ''

//   console.log('🔵 Messages Page - Current User ID:', currentUserId)

//   const [messageInput, setMessageInput] = useState('')
//   const [sendingMessages, setSendingMessages] = useState<{
//     [key: string]: boolean
//   }>({})
//   const messagesEndRef = useRef<HTMLDivElement>(null)

//   // Use refs for better control
//   const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
//   const authCheckStartedRef = useRef(false)
//   const initialMessagesLoadedRef = useRef<string | null>(null)
//   const isPollingRef = useRef(false)
//   const lastPollTimeRef = useRef<number>(0)

//   // Get matchId from URL query params
//   const matchIdFromUrl = searchParams.get('matchId')

//   // Get the other user from the current match
//   const getOtherUser = useCallback(() => {
//     if (!currentMatch) return null

//     if (currentMatch.otherUser) {
//       return currentMatch.otherUser
//     }

//     if (currentMatch.users && Array.isArray(currentMatch.users)) {
//       return currentMatch.users.find(
//         (user: any) => user && user._id && user._id.toString() !== currentUserId
//       )
//     }

//     return null
//   }, [currentMatch, currentUserId])

//   // ============ AUTHENTICATION ============
//   useEffect(() => {
//     if (!authUser && !checkingAuth && !authCheckStartedRef.current) {
//       console.log('🔐 No auth user in Redux, checking authentication...')
//       authCheckStartedRef.current = true
//       dispatch(checkAuthRequest())
//     }
//   }, [dispatch, authUser, checkingAuth])

//   // ============ LOAD MATCHES ============
//   useEffect(() => {
//     if (authUser && !checkingAuth) {
//       console.log('📨 Loading matches for authenticated user:', currentUserId)
//       dispatch(getMatchesRequest())
//     }
//   }, [dispatch, authUser, checkingAuth, currentUserId])

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

//   // ============ STOP POLLING WHEN NO MATCH ============
//   useEffect(() => {
//     if (!currentMatch || !authUser) {
//       stopPolling()
//       initialMessagesLoadedRef.current = null
//     }
//   }, [currentMatch, authUser])

//   // ============ LOAD INITIAL MESSAGES ============
//   useEffect(() => {
//     if (
//       currentMatch &&
//       authUser &&
//       initialMessagesLoadedRef.current !== currentMatch._id
//     ) {
//       console.log(`📱 Loading initial messages for match: ${currentMatch._id}`)

//       // Mark this match as having loaded initial messages
//       initialMessagesLoadedRef.current = currentMatch._id

//       // Load initial messages
//       dispatch(getMessagesRequest({ matchId: currentMatch._id }))
//       dispatch(markMessagesReadRequest(currentMatch._id))

//       // Update URL
//       const params = new URLSearchParams(searchParams.toString())
//       params.set('matchId', currentMatch._id)
//       router.replace(`?${params.toString()}`, { scroll: false })

//       // Start polling after a delay
//       setTimeout(() => {
//         startPolling(currentMatch._id)
//       }, 1000)
//     }
//   }, [currentMatch, authUser, dispatch, router, searchParams])

//   // ============ POLLING FUNCTIONS ============
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
//       lastPollTimeRef.current = Date.now()

//       const pollMessages = async () => {
//         // Throttle polling - don't poll more than once every 3 seconds
//         const now = Date.now()
//         if (now - lastPollTimeRef.current < 3000) {
//           return
//         }

//         lastPollTimeRef.current = now

//         try {
//           console.log(`🔄 Polling match ${matchId}...`)

//           const response = await fetch(
//             `${
//               process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
//             }/messages/${matchId}`,
//             {
//               credentials: 'include',
//               headers: {
//                 'Content-Type': 'application/json',
//               },
//             }
//           )

//           if (response.ok) {
//             const data = await response.json()

//             if (data.success && data.messages) {
//               console.log(`📊 Got ${data.messages.length} messages from API`)

//               // Filter out optimistic messages from current state
//               const realMessages = messages.filter(
//                 (msg) => !msg._id?.startsWith('temp-')
//               )

//               // Create a Set of existing message IDs for quick lookup
//               const existingMessageIds = new Set(
//                 realMessages.map((msg) => msg._id)
//               )

//               // Find new messages
//               const newMessages = data.messages.filter((apiMsg: any) => {
//                 // Skip if already exists
//                 if (existingMessageIds.has(apiMsg._id)) {
//                   return false
//                 }

//                 // Also check if it's a duplicate of an optimistic message
//                 const isDuplicateOfOptimistic = messages.some(
//                   (msg) =>
//                     msg._id?.startsWith('temp-') &&
//                     msg.content === apiMsg.content &&
//                     msg.sender === apiMsg.sender &&
//                     Math.abs(
//                       new Date(msg.createdAt).getTime() -
//                         new Date(apiMsg.createdAt).getTime()
//                     ) < 5000
//                 )

//                 return !isDuplicateOfOptimistic
//               })

//               if (newMessages.length > 0) {
//                 console.log(`📩 Found ${newMessages.length} new messages`)

//                 // Dispatch new messages
//                 newMessages.forEach((msg: any) => {
//                   dispatch(newMessageReceived(msg))
//                 })

//                 // Scroll to bottom
//                 scrollToBottom()
//               }
//             }
//           }
//         } catch (error) {
//           console.error('❌ Polling error:', error)
//         }
//       }

//       // Initial poll
//       pollMessages()

//       // Set up polling interval (every 5 seconds - less aggressive)
//       pollIntervalRef.current = setInterval(pollMessages, 5000)

//       // Cleanup function
//       return () => {
//         stopPolling()
//       }
//     },
//     [messages, dispatch]
//   )

//   // ============ CLEANUP ON UNMOUNT ============
//   useEffect(() => {
//     return () => {
//       stopPolling()
//     }
//   }, [stopPolling])

//   // ============ MESSAGE SENDING ============
//   const sendMessage = async () => {
//     if (!messageInput.trim() || !currentMatch || !currentUserId || !authUser)
//       return

//     const content = messageInput.trim()
//     setMessageInput('')

//     const tempId = `temp-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`

//     console.log(`💬 Sending message with temp ID: ${tempId}`)

//     // Mark this message as sending
//     setSendingMessages((prev) => ({ ...prev, [tempId]: true }))

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
//       // 3. Send to backend (async - won't block UI)
//       dispatch(
//         sendMessageRequest({
//           matchId: currentMatch._id,
//           content,
//         })
//       )

//       // Mark as not sending after delay (optimistic)
//       setTimeout(() => {
//         setSendingMessages((prev) => ({ ...prev, [tempId]: false }))
//       }, 2000)
//     } catch (error: any) {
//       console.error('❌ Failed to send message:', error)

//       // Mark as failed
//       setSendingMessages((prev) => ({ ...prev, [tempId]: false }))
//     }
//   }

//   // Helper function to check if message is optimistic
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
//   }

//   const handleBack = () => {
//     dispatch(setCurrentMatch(null))
//     router.push('/messages')
//   }

//   // Show loading while checking auth
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

//   // Show login redirect if not authenticated
//   if (!authUser && !checkingAuth && authCheckStartedRef.current) {
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

//   return (
//     <>
//       <Head>
//         <title>Messages | Dating App</title>
//         <meta name='description' content='Chat with your matches' />
//       </Head>

//       {/* Polling Status Indicator */}
//       {currentMatch && isPollingRef.current && (
//         <div
//           style={{
//             position: 'fixed',
//             bottom: 10,
//             right: 10,
//             background: '#4CAF50',
//             color: 'white',
//             padding: '5px 10px',
//             borderRadius: 4,
//             fontSize: 12,
//             zIndex: 1000,
//             display: 'flex',
//             alignItems: 'center',
//             gap: 5,
//           }}
//         >
//           <div
//             style={{
//               width: 8,
//               height: 8,
//               borderRadius: '50%',
//               background: 'white',
//               animation: 'pulse 2s infinite',
//             }}
//           ></div>
//           <span>Live Polling Active</span>
//         </div>
//       )}

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
//                   (match.users &&
//                     match.users.find(
//                       (user: any) =>
//                         user &&
//                         user._id &&
//                         user._id.toString() !== currentUserId
//                     ))

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
//                         {otherUser?.location && (
//                           <p className='text-xs text-gray-400 truncate mt-1'>
//                             📍 {otherUser.location}
//                           </p>
//                         )}
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
//                       getOtherUser()?.photos?.[0]
//                         ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${
//                             getOtherUser()?.photos[0]
//                           }`
//                         : '/default-avatar.png'
//                     }
//                     alt={getOtherUser()?.name || 'User'}
//                     className='w-10 h-10 rounded-full object-cover'
//                   />
//                   <div className='ml-3'>
//                     <h3 className='font-semibold text-gray-800'>
//                       {getOtherUser()?.name || 'Unknown'},{' '}
//                       {getOtherUser()?.age || ''}
//                     </h3>
//                     <p className='text-sm text-gray-500'>Online</p>
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
//                       const isOptimistic = isOptimisticMessage(message)
//                       const isSending =
//                         isOptimistic && sendingMessages[message._id]

//                       return (
//                         <div
//                           key={message._id || index}
//                           className={`flex ${
//                             isCurrentUser ? 'justify-end' : 'justify-start'
//                           } ${isOptimistic ? 'opacity-90' : ''}`}
//                         >
//                           <div
//                             className={`max-w-[70%] rounded-2xl px-4 py-3 relative ${
//                               isCurrentUser
//                                 ? 'bg-blue-500 text-white rounded-br-none'
//                                 : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
//                             }`}
//                           >
//                             {/* Sending indicator for optimistic messages */}
//                             {isOptimistic && isSending && (
//                               <div className='absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center'>
//                                 <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
//                               </div>
//                             )}

//                             {/* Only show sender name for other user's messages */}
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
//                               <span>
//                                 {isOptimistic
//                                   ? 'Sending...'
//                                   : formatTime(message.createdAt)}
//                               </span>

//                               {isCurrentUser && !isOptimistic && (
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
//                     onChange={(e) => {
//                       setMessageInput(e.target.value)
//                     }}
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
//                     disabled={!messageInput.trim() || loading}
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
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       <style jsx>{`
//         @keyframes pulse {
//           0% {
//             opacity: 1;
//           }
//           50% {
//             opacity: 0.5;
//           }
//           100% {
//             opacity: 1;
//           }
//         }
//       `}</style>
//     </>
//   )
// }

// export default MessagesPage

// app/messages/page.tsx - COMPLETELY FIXED VERSION
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
} from '../../store/slices/messageSlice'
import { RootState, AppDispatch } from '../../store/store'
import { checkAuthRequest } from '../../store/slices/authSlice'
import { webSocketService } from '../../store/services/websocket'

const MessagesPage: React.FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const { matches, currentMatch, messages, loading, error } = useSelector(
    (state: RootState) => state.messages
  )

  const { user: authUser, checkingAuth } = useSelector(
    (state: RootState) => state.auth
  )

  const currentUserId =
    authUser?.id?.toString() || authUser?._id?.toString() || ''

  console.log('🔵 Messages Page - Current User ID:', currentUserId)

  const [messageInput, setMessageInput] = useState('')
  const [sendingMessages, setSendingMessages] = useState<{
    [key: string]: boolean
  }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // WebSocket state
  const [webSocketConnected, setWebSocketConnected] = useState(false)
  const [webSocketId, setWebSocketId] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  // Polling refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialMessagesLoadedRef = useRef<string | null>(null)
  const isPollingRef = useRef(false)

  const matchIdFromUrl = searchParams.get('matchId')

  // ============ WEBSOCKET MANAGEMENT ============
  useEffect(() => {
    if (!authUser || checkingAuth) return

    console.log('🔌 Setting up WebSocket...')

    // Initialize WebSocket connection
    const initWebSocket = async () => {
      try {
        setConnectionStatus('connecting')
        const connected = await webSocketService.connect()

        if (connected) {
          setConnectionStatus('connected')
          setWebSocketConnected(true)
          setWebSocketId(webSocketService.getSocket()?.id || null)
        } else {
          setConnectionStatus('failed')
          setWebSocketConnected(false)
          // Start polling as fallback
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

    // Listen for WebSocket connection changes
    const unsubscribeConnection = webSocketService.onConnectionChange(
      (connected: any) => {
        console.log('🔌 WebSocket connection changed:', connected)
        setWebSocketConnected(connected)
        setWebSocketId(webSocketService.getSocket()?.id || null)
        setConnectionStatus(connected ? 'connected' : 'disconnected')

        if (connected) {
          // Stop polling when WebSocket connects
          stopPolling()

          // Join current match room
          if (currentMatch) {
            webSocketService.joinMatch(currentMatch._id)
          }
        } else if (currentMatch) {
          // Start polling when WebSocket disconnects
          startPolling(currentMatch._id)
        }
      }
    )

    // Listen for new messages
    const unsubscribeMessages = webSocketService.onNewMessage((message) => {
      console.log('📩 Received WebSocket message:', {
        id: message._id,
        matchId: message.matchId,
        sender: message.sender,
      })

      dispatch(newMessageReceived(message))

      // Scroll to bottom
      scrollToBottom()
    })

    return () => {
      console.log('🧹 Cleaning up WebSocket listeners')
      unsubscribeConnection()
      unsubscribeMessages()
      stopPolling()
    }
  }, [authUser, checkingAuth, currentMatch, dispatch])

  // Join/leave match room when currentMatch changes
  useEffect(() => {
    if (!currentMatch || !webSocketConnected) return

    console.log(`🚪 Auto-joining match room: ${currentMatch._id}`)
    webSocketService.joinMatch(currentMatch._id)

    return () => {
      console.log(`🚪 Auto-leaving match room: ${currentMatch._id}`)
      webSocketService.leaveMatch(currentMatch._id)
    }
  }, [currentMatch?._id, webSocketConnected])

  // ============ AUTHENTICATION ============
  useEffect(() => {
    if (!authUser && !checkingAuth) {
      console.log('🔐 Checking authentication...')
      dispatch(checkAuthRequest())
    }
  }, [dispatch, authUser, checkingAuth])

  // ============ LOAD MATCHES ============
  useEffect(() => {
    if (authUser && !checkingAuth) {
      console.log('📨 Loading matches...')
      dispatch(getMatchesRequest())
    }
  }, [dispatch, authUser, checkingAuth])

  // ============ HANDLE URL MATCH ID ============
  useEffect(() => {
    if (matchIdFromUrl && matches.length > 0) {
      const match = matches.find((m) => m._id === matchIdFromUrl)
      if (match && (!currentMatch || currentMatch._id !== matchIdFromUrl)) {
        console.log('🎯 Selecting match from URL:', matchIdFromUrl)
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
      console.log(`📱 Loading initial messages for match: ${currentMatch._id}`)

      initialMessagesLoadedRef.current = currentMatch._id

      // Load messages
      dispatch(getMessagesRequest({ matchId: currentMatch._id }))
      dispatch(markMessagesReadRequest(currentMatch._id))

      // Update URL
      const params = new URLSearchParams(searchParams.toString())
      params.set('matchId', currentMatch._id)
      router.replace(`?${params.toString()}`, { scroll: false })

      // Start polling only if WebSocket is not connected
      if (!webSocketConnected) {
        console.log('🔄 WebSocket not connected, starting polling...')
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

  // ============ POLLING FUNCTIONS (FALLBACK) ============
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      console.log('🛑 Stopping polling')
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
      isPollingRef.current = false
    }
  }, [])

  const startPolling = useCallback(
    (matchId: string) => {
      if (!matchId || isPollingRef.current) return

      console.log(`🔄 Starting polling for match: ${matchId}`)
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
              // Find new messages
              const existingIds = new Set(messages.map((msg) => msg._id))
              const newMessages = data.messages.filter(
                (msg: any) =>
                  !existingIds.has(msg._id) &&
                  !msg._id?.startsWith('temp-') &&
                  !msg._id?.startsWith('socket-')
              )

              if (newMessages.length > 0) {
                console.log(
                  `📩 Found ${newMessages.length} new messages via polling`
                )
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

      // Poll immediately and then every 5 seconds
      pollMessages()
      pollIntervalRef.current = setInterval(pollMessages, 5000)
    },
    [messages, dispatch]
  )

  // const sendMessage = async () => {
  //   if (!messageInput.trim() || !currentMatch || !currentUserId || !authUser)
  //     return

  //   const content = messageInput.trim()
  //   setMessageInput('')

  //   const tempId = `temp-${Date.now()}-${Math.random()
  //     .toString(36)
  //     .substr(2, 9)}`

  //   console.log(`💬 Sending message with temp ID: ${tempId}`)

  //   // Mark this message as sending
  //   setSendingMessages((prev) => ({ ...prev, [tempId]: true }))

  //   // 1. IMMEDIATELY: Add optimistic message to Redux (shows instantly)
  //   dispatch(
  //     sendMessageOptimistic({
  //       tempId,
  //       matchId: currentMatch._id,
  //       content,
  //       sender: currentUserId,
  //       senderId: {
  //         _id: currentUserId,
  //         name: authUser.name || 'You',
  //         photos: authUser.photos || [],
  //         age: authUser.age,
  //       },
  //     })
  //   )

  //   // 2. AFTER UI UPDATE: Scroll to bottom
  //   scrollToBottom()

  //   try {
  //     // 3. Try to send via WebSocket first (REAL-TIME)
  //     if (webSocketService.isConnected()) {
  //       console.log('📤 Sending via WebSocket...')
  //       const success = await webSocketService.sendMessage(
  //         currentMatch._id,
  //         content
  //       )

  //       if (success) {
  //         console.log('✅ Message sent via WebSocket')
  //       } else {
  //         throw new Error('WebSocket send failed')
  //       }
  //     } else {
  //       console.log('⚠️ WebSocket not connected, sending via HTTP...')
  //       // Fallback to HTTP
  //       dispatch(
  //         sendMessageRequest({
  //           matchId: currentMatch._id,
  //           content,
  //         })
  //       )
  //     }

  //     // Mark as not sending after delay (optimistic)
  //     setTimeout(() => {
  //       setSendingMessages((prev) => ({ ...prev, [tempId]: false }))
  //     }, 2000)
  //   } catch (error: any) {
  //     console.error('❌ Failed to send message:', error)

  //     // Mark as failed
  //     setSendingMessages((prev) => ({ ...prev, [tempId]: false }))

  //     // Try HTTP as final fallback
  //     console.log('🔄 Trying HTTP as fallback...')
  //     dispatch(
  //       sendMessageRequest({
  //         matchId: currentMatch._id,
  //         content,
  //       })
  //     )
  //   }
  // }

  // SIMPLIFIED sendMessage function (no optimistic messages)
  const sendMessage = async () => {
    if (!messageInput.trim() || !currentMatch || !currentUserId || !authUser)
      return

    const content = messageInput.trim()
    setMessageInput('')

    console.log(`💬 Sending message: "${content.substring(0, 30)}..."`)

    try {
      // 1. Try to send via WebSocket first
      if (webSocketService.isConnected()) {
        console.log('📤 Sending via WebSocket...')
        const success = await webSocketService.sendMessage(
          currentMatch._id,
          content
        )

        if (success) {
          console.log('✅ Message sent via WebSocket')
          // The WebSocket response will add the message to Redux
          return
        }
      }

      // 2. Fallback to HTTP
      console.log('⚠️ Using HTTP fallback...')
      dispatch(
        sendMessageRequest({
          matchId: currentMatch._id,
          content,
        })
      )
    } catch (error: any) {
      console.error('❌ Failed to send message:', error)
    }
  }

  // ============ HELPER FUNCTIONS ============
  const isOptimisticMessage = (message: any) => {
    return message._id?.startsWith('temp-') || message.isOptimistic
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleSelectMatch = (match: any) => {
    console.log('👆 Selecting match:', match._id)
    dispatch(setCurrentMatch(match))

    const params = new URLSearchParams(searchParams.toString())
    params.set('matchId', match._id)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const handleBack = () => {
    dispatch(setCurrentMatch(null))
    const params = new URLSearchParams(searchParams.toString())
    params.delete('matchId')
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const reconnectWebSocket = async () => {
    console.log('🔌 Manual WebSocket reconnection...')
    setConnectionStatus('connecting')

    const connected = await webSocketService.connect()
    if (connected) {
      console.log('✅ Manual reconnection successful')
      setConnectionStatus('connected')
    } else {
      console.log('❌ Manual reconnection failed')
      setConnectionStatus('failed')
    }
  }

  // ============ RENDER LOGIC ============
  if (checkingAuth) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Please log in to continue...</p>
          <button
            onClick={() => router.push('/login')}
            className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
          >
            Go to Login
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
        {connectionStatus === 'connected' && '✅ Live connection (WebSocket)'}
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
                const otherUser =
                  match.otherUser ||
                  match.users?.find(
                    (user: any) =>
                      user && user._id && user._id.toString() !== currentUserId
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
                            otherUser?.photos?.[0]
                              ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${otherUser.photos[0]}`
                              : '/default-avatar.png'
                          }
                          alt={otherUser?.name || 'User'}
                          className='w-12 h-12 rounded-full object-cover'
                        />
                        {match.unreadCount > 0 && (
                          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                            {match.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className='ml-3 flex-1 min-w-0'>
                        <div className='flex justify-between items-start'>
                          <h3 className='font-semibold text-gray-800 truncate'>
                            {otherUser?.name || 'Unknown'},{' '}
                            {otherUser?.age || ''}
                          </h3>
                          {match.lastMessageAt && (
                            <span className='text-xs text-gray-400 whitespace-nowrap'>
                              {formatTime(match.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <p className='text-sm text-gray-600 truncate mt-1'>
                          {match.lastMessage || 'Start a conversation'}
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
                  <img
                    src={
                      otherUser?.photos?.[0]
                        ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${otherUser.photos[0]}`
                        : '/default-avatar.png'
                    }
                    alt={otherUser?.name || 'User'}
                    className='w-10 h-10 rounded-full object-cover'
                  />
                  <div className='ml-3'>
                    <h3 className='font-semibold text-gray-800'>
                      {otherUser?.name || 'Unknown'}, {otherUser?.age || ''}
                    </h3>
                    <div className='flex items-center gap-2'>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          webSocketConnected
                            ? 'bg-green-500 animate-pulse'
                            : 'bg-gray-400'
                        }`}
                      ></div>
                      <p className='text-sm text-gray-500'>
                        {webSocketConnected ? 'Online' : 'Offline'}
                      </p>
                    </div>
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
                  <div className='space-y-4'>
                    {messages.map((message: any, index: number) => {
                      const isCurrentUser = message.sender === currentUserId
                      const isWebSocket = message._id?.startsWith('socket-')

                      return (
                        <div
                          key={message._id || index}
                          className={`flex ${
                            isCurrentUser ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                              isCurrentUser
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
                            }`}
                          >
                            {!isCurrentUser && message.senderId?.name && (
                              <p className='text-xs font-semibold text-gray-600 mb-1'>
                                {message.senderId.name}
                              </p>
                            )}

                            <p className='break-words'>{message.content}</p>

                            <div
                              className={`text-xs mt-1 flex items-center justify-between ${
                                isCurrentUser
                                  ? 'text-blue-100'
                                  : 'text-gray-400'
                              }`}
                            >
                              <span>{formatTime(message.createdAt)}</span>
                              {isCurrentUser && (
                                <span className='ml-2'>
                                  {message.isRead ? '✓✓ Read' : '✓ Sent'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
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
                    onChange={(e) => setMessageInput(e.target.value)}
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
                    <span className='text-green-600'>
                      ✅ Live WebSocket connection
                    </span>
                  ) : (
                    <span className='text-yellow-600'>
                      🔄 Using polling (5s intervals)
                    </span>
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
