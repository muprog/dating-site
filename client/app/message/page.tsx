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
//   //   clearTypingIndicator,
//   //   clearLoading,
//   markMessageAsRead,
//   markMessagesReadSuccess,
//   editMessageRequest,
//   clearMessages,
// } from '../../store/slices/messageSlice'
// import { User, Message, Match } from '@/types/messaging'
// import { RootState, AppDispatch } from '../../store/store'
// import { checkAuthRequest } from '../../store/slices/authSlice'
// import { webSocketService } from '../../store/services/websocket'
// import Image from 'next/image'
// interface TypingIndicator {
//   userId: string
//   matchId: string
//   isTyping: boolean
//   name?: string
//   user?: User
//   timestamp: string
// }

// interface OnlineStatus {
//   userId: string
//   isOnline: boolean
//   lastSeen?: string
//   user?: User
//   status: string
// }

// // interface EditMessageRequest {
// //   messageId: string
// //   matchId: string
// //   content: string
// // }
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

//   // ============ EDIT PERMISSION HELPERS ============
//   const canEditMessage = useCallback(
//     (message: Message): boolean => {
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
//   }, [dispatch, router, authInitialized, checkingAuth, authUser])

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
//         (user: User) =>
//           user && user._id && user._id.toString() !== currentUserId
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
//   const startEditingMessage = (message: Message) => {
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
//                 (msg: Message) =>
//                   !existingIds.has(msg._id) && !msg._id?.startsWith('temp-')
//               )

//               if (newMessages.length > 0) {
//                 newMessages.forEach((msg: Message) => {
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

//     const newMessageHandler = (message: Message) => {
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

//     const typingHandler = (data: TypingIndicator) => {
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

//     const statusHandler = (data: OnlineStatus) => {
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

//     const statusBatchHandler = (statuses: OnlineStatus[]) => {
//       dispatch(setOnlineStatusBatch(statuses))
//     }

//     webSocketService.on('online-status-batch', statusBatchHandler)

//     const messagesReadHandler = (data: { userId: string; matchId: string }) => {
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
//   }, [
//     authUser,
//     checkingAuth,
//     currentMatch,
//     dispatch,
//     messages,
//     currentUserId,
//     startPolling,
//     stopPolling,
//   ])

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

//   const handleSelectMatch = useCallback(
//     (match: Match) => {
//       console.log(`🔄 Selecting match: ${match._id}`)

//       if (currentMatch?._id === match._id) {
//         if (isMobile) {
//           setShowChat(true)
//         }
//         return
//       }

//       if (isTypingRef.current && currentMatch) {
//         sendTypingIndicator(false)
//         if (typingTimeoutRef.current) {
//           clearTimeout(typingTimeoutRef.current)
//         }
//       }

//       if (currentMatch && webSocketService.isConnected()) {
//         webSocketService.leaveMatch(currentMatch._id)
//       }

//       dispatch(clearMessages())
//       initialMessagesLoadedRef.current = null

//       dispatch(setCurrentMatch(match))

//       if (isMobile) {
//         setShowChat(true)
//       }

//       const params = new URLSearchParams(searchParams.toString())
//       params.set('matchId', match._id)
//       router.replace(`?${params.toString()}`, { scroll: false })

//       setTimeout(() => {
//         dispatch(getMessagesRequest({ matchId: match._id }))
//         dispatch(markMessagesReadRequest(match._id))

//         if (webSocketService.isConnected()) {
//           webSocketService.joinMatch(match._id)
//         } else {
//           startPolling(match._id)
//         }
//       }, 50)
//     },
//     [
//       currentMatch,
//       isMobile,
//       sendTypingIndicator,
//       dispatch,
//       searchParams,
//       router,
//       //   webSocketService,
//       startPolling,
//     ]
//   )
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
//   }, [matchIdFromUrl, matches, isMobile, currentMatch, handleSelectMatch])

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
//     startPolling,
//   ])

//   // ============ SCROLL TO BOTTOM WHEN MESSAGES ARE LOADED ============
//   useEffect(() => {
//     if (currentMatch && messages.length > 0 && !loading) {
//       console.log(
//         `📋 Messages loaded for ${currentMatch._id} (${messages.length} messages), scrolling to bottom...`
//       )

//       // Wait for DOM to update, then scroll to bottom
//       const timer = setTimeout(() => {
//         scrollToBottom()
//       }, 300)

//       return () => clearTimeout(timer)
//     }
//   }, [currentMatch, messages, loading])

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
//     } catch (error) {
//       console.log(error)
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
//       if (messagesEndRef.current) {
//         messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
//         console.log('⬇️ Scrolled to bottom')
//       }
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
//   }

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
//     const groups: { [key: string]: Message[] } = {}

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

//   const getMessageReadStatus = (message: Message) => {
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
//               matches.map((match: Match) => {
//                 const matchOtherUser =
//                   match.otherUser ||
//                   match.users?.find(
//                     (user: User) =>
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
//                         <Image
//                           src={
//                             matchOtherUser?.photos?.[0]
//                               ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${matchOtherUser.photos[0]}`
//                               : '/default-avatar.png'
//                           }
//                           alt={matchOtherUser?.name || 'User'}
//                           fill
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
//                       <Image
//                         src={
//                           otherUser?.photos?.[0]
//                             ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${otherUser.photos[0]}`
//                             : '/default-avatar.png'
//                         }
//                         alt={otherUser?.name || 'User'}
//                         fill
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
//                                     (message: Message, index: number) => {
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

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from 'react'
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
  //   clearTypingIndicator,
  //   clearLoading,
  markMessageAsRead,
  markMessagesReadSuccess,
  editMessageRequest,
  clearMessages,
} from '../../store/slices/messageSlice'
import { User, Message, Match } from '@/types/messaging'
import { RootState, AppDispatch } from '../../store/store'
import { checkAuthRequest } from '../../store/slices/authSlice'
import { webSocketService } from '../../store/services/websocket'
import Image from 'next/image'

// Loading fallback component
function MessagesLoading() {
  return (
    <div className='flex items-center justify-center h-screen'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
        <p className='text-gray-600'>Loading messages...</p>
      </div>
    </div>
  )
}

// Main component wrapped in Suspense
function MessagesContent() {
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
    (message: Message): boolean => {
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
  }, [dispatch, router, authInitialized, checkingAuth, authUser])

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
        (user: User) =>
          user && user._id && user._id.toString() !== currentUserId
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
  const startEditingMessage = (message: Message) => {
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
                (msg: Message) =>
                  !existingIds.has(msg._id) && !msg._id?.startsWith('temp-')
              )

              if (newMessages.length > 0) {
                newMessages.forEach((msg: Message) => {
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

    const newMessageHandler = (message: Message) => {
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

    const typingHandler = (data: TypingIndicator) => {
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

    const statusHandler = (data: OnlineStatus) => {
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

    const statusBatchHandler = (statuses: OnlineStatus[]) => {
      dispatch(setOnlineStatusBatch(statuses))
    }

    webSocketService.on('online-status-batch', statusBatchHandler)

    const messagesReadHandler = (data: { userId: string; matchId: string }) => {
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
  }, [
    authUser,
    checkingAuth,
    currentMatch,
    dispatch,
    messages,
    currentUserId,
    startPolling,
    stopPolling,
  ])

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

  const handleSelectMatch = useCallback(
    (match: Match) => {
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
    },
    [
      currentMatch,
      isMobile,
      sendTypingIndicator,
      dispatch,
      searchParams,
      router,
      //   webSocketService,
      startPolling,
    ]
  )
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
  }, [matchIdFromUrl, matches, isMobile, currentMatch, handleSelectMatch])

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
    startPolling,
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
    } catch (error) {
      console.log(error)
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

  // ============ handleBack function ============
  const handleBack = () => {
    console.log('🔙 Going back to matches list')

    // if (isTypingRef.current && currentMatch) {
    //   sendTypingIndicator(false)
    //   if (typingTimeoutRef.current) {
    //     clearTimeout(typingTimeoutRef.current)
    //   }
    // }

    // if (currentMatch && webSocketService.isConnected()) {
    //   webSocketService.leaveMatch(currentMatch._id)
    // }

    // dispatch(setCurrentMatch(null))
    // dispatch(clearMessages())

    setShowChat(false)
    setEditingMessageId(null)
    setEditMessageContent('')
    setMessageInput('')

    // initialMessagesLoadedRef.current = null

    // const params = new URLSearchParams(searchParams.toString())
    // params.delete('matchId')
    router.push(`/matches`, { scroll: false })
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
    const groups: { [key: string]: Message[] } = {}

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

  const getMessageReadStatus = (message: Message) => {
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
              matches.map((match: Match) => {
                const matchOtherUser =
                  match.otherUser ||
                  match.users?.find(
                    (user: User) =>
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
                      <div className='relative w-12 h-12'>
                        {matchOtherUser?.photos?.[0] ? (
                          <img
                            src={`${
                              process.env.NEXT_PUBLIC_API_URL ||
                              'http://localhost:5000'
                            }/uploads/${matchOtherUser.photos[0]}`}
                            alt={matchOtherUser?.name || 'User'}
                            className='w-12 h-12 rounded-full object-cover'
                          />
                        ) : (
                          <div className='w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center'>
                            <span className='text-gray-600'>👤</span>
                          </div>
                        )}
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
                    <div className='relative w-10 h-10'>
                      {otherUser?.photos?.[0] ? (
                        <img
                          src={`${
                            process.env.NEXT_PUBLIC_API_URL ||
                            'http://localhost:5000'
                          }/uploads/${otherUser.photos[0]}`}
                          alt={otherUser?.name || 'User'}
                          className='w-10 h-10 rounded-full object-cover'
                        />
                      ) : (
                        <div className='w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center'>
                          <span className='text-gray-600'>👤</span>
                        </div>
                      )}
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
                                    (message: Message, index: number) => {
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

// Interfaces moved outside
interface TypingIndicator {
  userId: string
  matchId: string
  isTyping: boolean
  name?: string
  user?: User
  timestamp: string
}

interface OnlineStatus {
  userId: string
  isOnline: boolean
  lastSeen?: string
  user?: User
  status: string
}

// Main exported component with Suspense
const MessagesPage: React.FC = () => {
  return (
    <Suspense fallback={<MessagesLoading />}>
      <MessagesContent />
    </Suspense>
  )
}

export default MessagesPage
