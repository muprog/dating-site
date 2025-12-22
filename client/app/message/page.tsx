'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Head from 'next/head'
import { useSearchParams, useRouter } from 'next/navigation'
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
import { checkAuthRequest } from '../../store/slices/authSlice'

const MessagesPage: React.FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  // Get data from Redux store
  const { matches, currentMatch, messages, loading, error } = useSelector(
    (state: RootState) => state.messages
  )

  // Get auth user from Redux store
  const { user: authUser, checkingAuth } = useSelector(
    (state: RootState) => state.auth
  )

  // Get current user ID from Redux auth state
  const currentUserId =
    authUser?.id?.toString() || authUser?._id?.toString() || ''

  console.log('🔵 Messages Page - Current User ID:', currentUserId)
  console.log('🔵 Messages Page - Auth User:', authUser)

  const [messageInput, setMessageInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get matchId from URL query params
  const matchIdFromUrl = searchParams.get('matchId')

  // Get the other user from the current match
  const getOtherUser = () => {
    if (!currentMatch) return null

    // First try to use otherUser object
    if (currentMatch.otherUser) {
      return currentMatch.otherUser
    }

    // If not, try to find from users array
    if (currentMatch.users && Array.isArray(currentMatch.users)) {
      return currentMatch.users.find(
        (user: any) => user && user._id && user._id.toString() !== currentUserId
      )
    }

    return null
  }

  // Check authentication on mount
  useEffect(() => {
    // Check if we have auth user in Redux
    if (!authUser && !checkingAuth) {
      console.log('🔐 No auth user in Redux, checking authentication...')
      dispatch(checkAuthRequest())
    }
  }, [dispatch, authUser, checkingAuth])

  // Handle redirect to login if not authenticated
  useEffect(() => {
    if (!authUser && !checkingAuth) {
      console.log('❌ No auth user, redirecting to login')
      router.push('/login')
    }
  }, [authUser, checkingAuth, router])

  // Initialize WebSocket when authenticated
  useEffect(() => {
    if (!authUser) return

    console.log('🔌 Initializing WebSocket connection...')

    // Connect WebSocket - it will use cookies automatically
    webSocketService.connect()
    // Or if you have a token, you can still pass it: webSocketService.connect(token)

    const socket = (webSocketService as any).socket

    if (socket) {
      // Listen for typing indicators
      const handleUserTyping = (data: { matchId: string; userId: string }) => {
        console.log('⌨️ Typing event received:', data)
        if (
          currentMatch &&
          data.matchId === currentMatch._id &&
          data.userId !== currentUserId
        ) {
          setOtherUserTyping(true)
        }
      }

      const handleUserStoppedTyping = (data: {
        matchId: string
        userId: string
      }) => {
        console.log('💤 Stopped typing event received:', data)
        if (
          currentMatch &&
          data.matchId === currentMatch._id &&
          data.userId !== currentUserId
        ) {
          setOtherUserTyping(false)
        }
      }

      socket.on('user-typing', handleUserTyping)
      socket.on('user-stopped-typing', handleUserStoppedTyping)

      // Cleanup
      return () => {
        if (socket) {
          socket.off('user-typing', handleUserTyping)
          socket.off('user-stopped-typing', handleUserStoppedTyping)
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
      }
    }
  }, [currentMatch, currentUserId, authUser])

  // Load matches when authenticated
  useEffect(() => {
    if (authUser && !checkingAuth) {
      console.log('📨 Loading matches for authenticated user:', currentUserId)
      dispatch(getMatchesRequest())
    }
  }, [dispatch, authUser, checkingAuth, currentUserId])

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
    if (currentMatch && authUser) {
      console.log(`🚪 Joining match room: ${currentMatch._id}`)
      webSocketService.joinMatch(currentMatch._id)
      dispatch(getMessagesRequest({ matchId: currentMatch._id }))
      dispatch(markMessagesReadRequest(currentMatch._id))

      const params = new URLSearchParams(searchParams.toString())
      params.set('matchId', currentMatch._id)
      router.replace(`?${params.toString()}`, { scroll: false })
    }

    return () => {
      if (currentMatch) {
        console.log(`🚪 Leaving match room: ${currentMatch._id}`)
        webSocketService.leaveMatch(currentMatch._id)
      }
    }
  }, [currentMatch, authUser, dispatch, router, searchParams])

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
    if (!messageInput.trim() || !currentMatch || !currentUserId) return

    const content = messageInput.trim()
    setMessageInput('')

    console.log(`💬 Sending message: ${content}`)

    // Send via Redux Saga (which will call API)
    dispatch(sendMessageRequest({ matchId: currentMatch._id, content }))

    // Also send via WebSocket for real-time
    webSocketService.sendMessage(currentMatch._id, content)

    scrollToBottom()
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
    dispatch(setCurrentMatch(match))
  }

  const handleBack = () => {
    dispatch(setCurrentMatch(null))
    router.push('/messages')
  }

  // Show loading while checking auth
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

  // Show login redirect if not authenticated
  if (!authUser && !checkingAuth) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Redirecting to login...</p>
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
                  (match.users &&
                    match.users.find(
                      (user: any) =>
                        user &&
                        user._id &&
                        user._id.toString() !== currentUserId
                    ))

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
                        {otherUser?.location && (
                          <p className='text-xs text-gray-400 truncate mt-1'>
                            📍 {otherUser.location}
                          </p>
                        )}
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
                      getOtherUser()?.photos?.[0]
                        ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${
                            getOtherUser()?.photos[0]
                          }`
                        : '/default-avatar.png'
                    }
                    alt={getOtherUser()?.name || 'User'}
                    className='w-10 h-10 rounded-full object-cover'
                  />
                  <div className='ml-3'>
                    <h3 className='font-semibold text-gray-800'>
                      {getOtherUser()?.name || 'Unknown'},{' '}
                      {getOtherUser()?.age || ''}
                    </h3>
                    <div className='flex items-center'>
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          otherUserTyping
                            ? 'bg-green-500 animate-pulse'
                            : 'bg-gray-300'
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
                  <div className='space-y-4'>
                    {messages.map((message: any, index: number) => {
                      // Debug each message
                      console.log(`📝 Message ${index}:`, {
                        sender: message.sender,
                        currentUserId: currentUserId,
                        isCurrentUser: message.sender === currentUserId,
                        content: message.content.substring(0, 50) + '...',
                      })

                      const isCurrentUser = message.sender === currentUserId

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
                            {/* Only show sender name for other user's messages */}
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
