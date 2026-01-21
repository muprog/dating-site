// hooks/useUnreadCount.ts
import { useEffect, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import {
  getUnreadTotalRequest,
  incrementTotalUnread,
  decrementTotalUnread,
  resetTotalUnread,
} from '../store/slices/messageSlice'
import { webSocketService } from '../store/services/websocket'

export const useUnreadCount = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { totalUnread, loadingUnread } = useSelector(
    (state: RootState) => state.messages
  )
  const { user: authUser } = useSelector((state: RootState) => state.auth)

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchUnreadCount = useCallback(() => {
    if (authUser?._id) {
      console.log('🔔 Fetching unread count...')
      dispatch(getUnreadTotalRequest())
    }
  }, [authUser, dispatch])

  const incrementUnread = useCallback(() => {
    dispatch(incrementTotalUnread())
  }, [dispatch])

  const decrementUnread = useCallback(
    (count: number = 1) => {
      dispatch(decrementTotalUnread(count))
    },
    [dispatch]
  )

  const resetUnread = useCallback(() => {
    dispatch(resetTotalUnread())
  }, [dispatch])

  // Initialize WebSocket connection and fetch unread count
  useEffect(() => {
    if (authUser?._id) {
      console.log(
        '🔌 Setting up unread count monitoring for user:',
        authUser._id
      )

      // Fetch initial unread count
      fetchUnreadCount()

      // Connect to WebSocket
      webSocketService.connect()

      // Set up WebSocket listener for unread updates
      const handleUnreadUpdate = (data: any) => {
        console.log('📊 Received real-time unread update:', data)
      }

      webSocketService.on('unread-update', handleUnreadUpdate)

      // Start polling as fallback (every 60 seconds)
      pollingIntervalRef.current = setInterval(() => {
        console.log('🔄 Polling for unread count updates...')
        fetchUnreadCount()
      }, 60000)

      return () => {
        // Cleanup
        webSocketService.off('unread-update', handleUnreadUpdate)

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    }
  }, [authUser, fetchUnreadCount])

  // Also fetch when window regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && authUser?._id) {
        console.log('🔄 Window focused, refreshing unread count...')
        fetchUnreadCount()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [authUser, fetchUnreadCount])

  return {
    totalUnread,
    loadingUnread,
    fetchUnreadCount,
    incrementUnread,
    decrementUnread,
    resetUnread,
  }
}
