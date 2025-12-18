// 'use client'
// import React, { useState, useEffect, useRef, useCallback } from 'react'
// import { useRouter } from 'next/router'
// import { useDispatch, useSelector } from 'react-redux'
// import Head from 'next/head'
// import { Message } from '@/types/messaging'
// import {
//   getMatchesRequest,
//   getMessagesRequest,
//   sendMessageRequest,
//   setCurrentMatch,
//   markMessagesReadRequest,
//   clearError,
// } from '../../store/slices/messageSlice'
// import { webSocketService } from '../../store/services/websocket'
// import { RootState, AppDispatch } from '../../store/store'

// interface TypingTimeoutRef {
//   current: NodeJS.Timeout | null
// }

// const MessagesPage: React.FC = () => {
//   const router = useRouter()
//   const dispatch = useDispatch<AppDispatch>()
//   const { matches, currentMatch, messages, loading, error } = useSelector(
//     (state: RootState) => state.messages
//   )

//   const [messageInput, setMessageInput] = useState('')
//   const [isTyping, setIsTyping] = useState(false)
//   const [otherUserTyping, setOtherUserTyping] = useState(false)
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//   const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

//   // Initialize WebSocket
//   useEffect(() => {
//     const token = localStorage.getItem('token')
//     if (token) {
//       webSocketService.connect(token)
//     }

//     // Listen for new messages
//     const unsubscribeNewMessage = webSocketService.onNewMessage(
//       (message: Message) => {
//         if (currentMatch && message.matchId === currentMatch._id) {
//           // Message is already added via Redux newMessageReceived
//         }
//       }
//     )

//     // Listen for typing indicators
//     const unsubscribeUserTyping = webSocketService.onUserTyping(
//       (data: { matchId: string; userId: string }) => {
//         if (
//           currentMatch &&
//           data.matchId === currentMatch._id &&
//           data.userId !== getCurrentUserId()
//         ) {
//           setOtherUserTyping(true)
//         }
//       }
//     )

//     const unsubscribeUserStoppedTyping = webSocketService.onUserStoppedTyping(
//       (data: { matchId: string; userId: string }) => {
//         if (
//           currentMatch &&
//           data.matchId === currentMatch._id &&
//           data.userId !== getCurrentUserId()
//         ) {
//           setOtherUserTyping(false)
//         }
//       }
//     )

//     return () => {
//       webSocketService.disconnect()
//       unsubscribeNewMessage()
//       unsubscribeUserTyping()
//       unsubscribeUserStoppedTyping()
//       if (typingTimeoutRef.current) {
//         clearTimeout(typingTimeoutRef.current)
//       }
//     }
//   }, [])

//   // Load matches on mount
//   useEffect(() => {
//     dispatch(getMatchesRequest())
//   }, [dispatch])

//   // Join match room when selected
//   useEffect(() => {
//     if (currentMatch) {
//       webSocketService.joinMatch(currentMatch._id)
//       dispatch(getMessagesRequest({ matchId: currentMatch._id }))
//       dispatch(markMessagesReadRequest(currentMatch._id))
//     }

//     return () => {
//       if (currentMatch) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }
//     }
//   }, [currentMatch, dispatch])

//   const getCurrentUserId = (): string => {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('userId') || ''
//     }
//     return ''
//   }

//   const handleTyping = () => {
//     if (!currentMatch) return

//     if (!isTyping) {
//       setIsTyping(true)
//       webSocketService.typing(currentMatch._id)
//     }

//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current)
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       setIsTyping(false)
//       webSocketService.stopTyping(currentMatch._id)
//     }, 2000)
//   }

//   const sendMessage = async () => {
//     if (!messageInput.trim() || !currentMatch) return

//     const content = messageInput.trim()
//     setMessageInput('')

//     // Send via Redux Saga
//     dispatch(sendMessageRequest({ matchId: currentMatch._id, content }))

//     // Also send via WebSocket for real-time
//     webSocketService.sendMessage(currentMatch._id, content)

//     // Scroll to bottom
//     scrollToBottom()
//   }

//   const scrollToBottom = () => {
//     setTimeout(() => {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//     }, 100)
//   }

//   const formatTime = (dateString: string) => {
//     const date = new Date(dateString)
//     const now = new Date()
//     const diffMs = now.getTime() - date.getTime()
//     const diffHours = diffMs / (1000 * 60 * 60)

//     if (diffHours < 24) {
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//     } else if (diffHours < 48) {
//       return 'Yesterday'
//     } else {
//       return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
//     }
//   }

//   const formatDateHeader = (dateString: string) => {
//     const date = new Date(dateString)
//     const today = new Date()
//     const yesterday = new Date(today)
//     yesterday.setDate(yesterday.getDate() - 1)

//     if (date.toDateString() === today.toDateString()) {
//       return 'Today'
//     } else if (date.toDateString() === yesterday.toDateString()) {
//       return 'Yesterday'
//     } else {
//       return date.toLocaleDateString([], {
//         weekday: 'long',
//         month: 'short',
//         day: 'numeric',
//       })
//     }
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

//   if (error) {
//     return (
//       <div className='flex items-center justify-center h-screen'>
//         <div className='text-center'>
//           <div className='text-red-500 mb-4'>{error}</div>
//           <button
//             onClick={() => dispatch(clearError())}
//             className='bg-blue-500 text-white px-4 py-2 rounded'
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

//       <div className='flex h-screen bg-gray-50'>
//         {/* Sidebar - Matches List */}
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
//               matches.map((match) => (
//                 <div
//                   key={match._id}
//                   onClick={() => dispatch(setCurrentMatch(match))}
//                   className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
//                     currentMatch?._id === match._id
//                       ? 'bg-blue-50'
//                       : 'hover:bg-gray-50'
//                   }`}
//                 >
//                   <div className='flex items-center'>
//                     <div className='relative'>
//                       <img
//                         src={match.otherUser.photos[0] || '/default-avatar.png'}
//                         alt={match.otherUser.name}
//                         className='w-12 h-12 rounded-full object-cover'
//                       />
//                       {match.unreadCount > 0 && (
//                         <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
//                           {match.unreadCount}
//                         </span>
//                       )}
//                     </div>
//                     <div className='ml-3 flex-1 min-w-0'>
//                       <div className='flex justify-between items-start'>
//                         <h3 className='font-semibold text-gray-800 truncate'>
//                           {match.otherUser.name}, {match.otherUser.age}
//                         </h3>
//                         {match.lastMessageAt && (
//                           <span className='text-xs text-gray-400 whitespace-nowrap'>
//                             {formatTime(match.lastMessageAt)}
//                           </span>
//                         )}
//                       </div>
//                       <p className='text-sm text-gray-600 truncate mt-1'>
//                         {match.lastMessage || 'Start a conversation'}
//                       </p>
//                       {match.otherUser.location && (
//                         <p className='text-xs text-gray-400 truncate mt-1'>
//                           {match.otherUser.location}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>

//         {/* Main Chat Area */}
//         <div className='flex-1 flex flex-col'>
//           {currentMatch ? (
//             <>
//               {/* Chat Header */}
//               <div className='bg-white border-b border-gray-200 p-4'>
//                 <div className='flex items-center'>
//                   <button
//                     onClick={() => dispatch(setCurrentMatch(null))}
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
//                       currentMatch.otherUser.photos[0] || '/default-avatar.png'
//                     }
//                     alt={currentMatch.otherUser.name}
//                     className='w-10 h-10 rounded-full object-cover'
//                   />
//                   <div className='ml-3'>
//                     <h3 className='font-semibold text-gray-800'>
//                       {currentMatch.otherUser.name},{' '}
//                       {currentMatch.otherUser.age}
//                     </h3>
//                     <div className='flex items-center'>
//                       <span
//                         className={`w-2 h-2 rounded-full mr-2 ${
//                           otherUserTyping ? 'bg-green-500' : 'bg-gray-300'
//                         }`}
//                       ></span>
//                       <p className='text-sm text-gray-500'>
//                         {otherUserTyping ? 'Typing...' : 'Online'}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Messages Container */}
//               <div className='flex-1 overflow-y-auto p-4 bg-gray-50'>
//                 {loading && messages.length === 0 ? (
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
//                     {Object.entries(groupMessagesByDate()).map(
//                       ([date, dateMessages]) => (
//                         <div key={date}>
//                           <div className='flex items-center justify-center my-4'>
//                             <div className='bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full'>
//                               {formatDateHeader(date)}
//                             </div>
//                           </div>
//                           {dateMessages.map((message, index) => {
//                             const isCurrentUser =
//                               message.senderId._id === getCurrentUserId()

//                             return (
//                               <div
//                                 key={message._id}
//                                 className={`flex ${
//                                   isCurrentUser
//                                     ? 'justify-end'
//                                     : 'justify-start'
//                                 } mb-2`}
//                               >
//                                 <div
//                                   className={`max-w-[70%] rounded-2xl px-4 py-2 ${
//                                     isCurrentUser
//                                       ? 'bg-blue-500 text-white rounded-br-none'
//                                       : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
//                                   }`}
//                                 >
//                                   <p className='break-words'>
//                                     {message.content}
//                                   </p>
//                                   <div
//                                     className={`text-xs mt-1 ${
//                                       isCurrentUser
//                                         ? 'text-blue-100'
//                                         : 'text-gray-400'
//                                     }`}
//                                   >
//                                     {formatTime(message.createdAt)}
//                                     {isCurrentUser && message.isRead && (
//                                       <span className='ml-1'>✓✓</span>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>
//                             )
//                           })}
//                         </div>
//                       )
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
//                     onChange={(e) => {
//                       setMessageInput(e.target.value)
//                       handleTyping()
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
//     </>
//   )
// }

// export default MessagesPage

'use client' // Important: This must be a client component

import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Head from 'next/head'
import { useSearchParams, useRouter } from 'next/navigation' // Changed import
import {
  getMatchesRequest,
  getMessagesRequest,
  sendMessageRequest,
  setCurrentMatch,
  markMessagesReadRequest,
  clearError,
} from '../../store/slices/messageSlice'
import { webSocketService } from '../../store/services/websocket'
import { RootState, AppDispatch } from '../../store/store'
import { Message } from '../../types/messaging'

const MessagesPage: React.FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter() // This is correct for App Router
  const dispatch = useDispatch<AppDispatch>()
  const { matches, currentMatch, messages, loading, error } = useSelector(
    (state: RootState) => state.messages
  )

  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get matchId from URL query params
  const matchIdFromUrl = searchParams.get('matchId')

  // Initialize WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      webSocketService.connect(token)
    }

    // Get socket instance for direct event listening
    const socket = (webSocketService as any).socket

    if (socket) {
      // Listen for typing indicators
      socket.on('user-typing', (data: { matchId: string; userId: string }) => {
        if (
          currentMatch &&
          data.matchId === currentMatch._id &&
          data.userId !== getCurrentUserId()
        ) {
          setOtherUserTyping(true)
        }
      })

      socket.on(
        'user-stopped-typing',
        (data: { matchId: string; userId: string }) => {
          if (
            currentMatch &&
            data.matchId === currentMatch._id &&
            data.userId !== getCurrentUserId()
          ) {
            setOtherUserTyping(false)
          }
        }
      )

      // Cleanup
      return () => {
        if (socket) {
          socket.off('user-typing')
          socket.off('user-stopped-typing')
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
      }
    }
  }, [currentMatch])

  // Load matches on mount
  useEffect(() => {
    dispatch(getMatchesRequest())
  }, [dispatch])

  // Handle URL matchId parameter
  useEffect(() => {
    if (matchIdFromUrl && matches.length > 0) {
      const match = matches.find((m) => m._id === matchIdFromUrl)
      if (match) {
        dispatch(setCurrentMatch(match))
      }
    }
  }, [matchIdFromUrl, matches, dispatch])

  // Join match room when selected
  useEffect(() => {
    if (currentMatch) {
      webSocketService.joinMatch(currentMatch._id)
      dispatch(getMessagesRequest({ matchId: currentMatch._id }))
      dispatch(markMessagesReadRequest(currentMatch._id))

      // Update URL without navigation
      const params = new URLSearchParams(searchParams.toString())
      params.set('matchId', currentMatch._id)
      router.replace(`?${params.toString()}`, { scroll: false })
    }

    return () => {
      if (currentMatch) {
        webSocketService.leaveMatch(currentMatch._id)
      }
    }
  }, [currentMatch, dispatch, router, searchParams])

  const getCurrentUserId = (): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || ''
    }
    return ''
  }

  const handleTyping = () => {
    if (!currentMatch) return

    if (!isTyping) {
      setIsTyping(true)
      webSocketService.typing(currentMatch._id)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      webSocketService.stopTyping(currentMatch._id)
    }, 2000)
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !currentMatch) return

    const content = messageInput.trim()
    setMessageInput('')

    // Send via Redux Saga
    dispatch(sendMessageRequest({ matchId: currentMatch._id, content }))

    // Also send via WebSocket for real-time
    webSocketService.sendMessage(currentMatch._id, content)

    // Scroll to bottom
    scrollToBottom()
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const handleSelectMatch = (match: any) => {
    dispatch(setCurrentMatch(match))
  }

  const handleBack = () => {
    dispatch(setCurrentMatch(null))
    router.push('/messages')
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='text-red-500 mb-4'>{error}</div>
          <button
            onClick={() => dispatch(clearError())}
            className='bg-blue-500 text-white px-4 py-2 rounded'
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Messages | Dating App</title>
        <meta name='description' content='Chat with your matches' />
      </Head>

      <div className='flex h-screen bg-gray-50'>
        {/* Sidebar - Matches List */}
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
              matches.map((match) => (
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
                        src={match.otherUser.photos[0] || '/default-avatar.png'}
                        alt={match.otherUser.name}
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
                          {match.otherUser.name}, {match.otherUser.age}
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
                      {match.otherUser.location && (
                        <p className='text-xs text-gray-400 truncate mt-1'>
                          {match.otherUser.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
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
                      currentMatch.otherUser.photos[0] || '/default-avatar.png'
                    }
                    alt={currentMatch.otherUser.name}
                    className='w-10 h-10 rounded-full object-cover'
                  />
                  <div className='ml-3'>
                    <h3 className='font-semibold text-gray-800'>
                      {currentMatch.otherUser.name},{' '}
                      {currentMatch.otherUser.age}
                    </h3>
                    <div className='flex items-center'>
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          otherUserTyping ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      ></span>
                      <p className='text-sm text-gray-500'>
                        {otherUserTyping ? 'Typing...' : 'Online'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className='flex-1 overflow-y-auto p-4 bg-gray-50'>
                {loading && messages.length === 0 ? (
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
                  <>
                    {messages.map((message, index) => {
                      const isCurrentUser =
                        message.senderId._id === getCurrentUserId()

                      return (
                        <div
                          key={message._id || index}
                          className={`flex ${
                            isCurrentUser ? 'justify-end' : 'justify-start'
                          } mb-2`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isCurrentUser
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                            }`}
                          >
                            <p className='break-words'>{message.content}</p>
                            <div
                              className={`text-xs mt-1 ${
                                isCurrentUser
                                  ? 'text-blue-100'
                                  : 'text-gray-400'
                              }`}
                            >
                              {formatTime(message.createdAt)}
                              {isCurrentUser && message.isRead && (
                                <span className='ml-1'>✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className='bg-white border-t border-gray-200 p-4'>
                <div className='flex items-center'>
                  <input
                    type='text'
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value)
                      handleTyping()
                    }}
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
                    disabled={!messageInput.trim() || loading}
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
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default MessagesPage
