// // store/services/messageApi.ts
// import api from '../services/api'

// export interface MatchUser {
//   _id: string
//   id: string
//   name: string
//   photos: string[]
//   age?: number
//   email: string
// }

// export interface Match {
//   _id: string
//   matchId: string
//   otherUser: MatchUser
//   initiatedBy: string
//   lastMessage: string | null
//   lastMessageAt: string | null
//   unreadCount: number
//   createdAt: string
//   updatedAt: string
// }

// export interface ApiResponse<T> {
//   success: boolean
//   matches: T[]
//   count?: number
//   message?: string
// }

// export const messageApi = {
//   // Get user's matches
//   getMatches: async (): Promise<ApiResponse<Match>> => {
//     try {
//       console.log('📞 Fetching matches from API...')
//       const response = await api.get('/messages/matches')
//       console.log('✅ Matches response:', response.data)
//       return response.data
//     } catch (error: any) {
//       console.error('❌ Error fetching matches:', error)
//       throw error
//     }
//   },

//   // Get messages for a specific match
//   getMessages: async (matchId: string): Promise<any> => {
//     const response = await api.get(`/messages/${matchId}`)
//     return response.data
//   },

//   // Send a message
//   sendMessage: async (matchId: string, content: string): Promise<any> => {
//     const response = await api.post(`/messages/${matchId}`, { content })
//     return response.data
//   },

//   // Mark messages as read
//   markAsRead: async (matchId: string): Promise<any> => {
//     const response = await api.post(`/messages/${matchId}/read`)
//     return response.data
//   },
// }

// store/services/messageApi.ts
import api from '../services/api'

export interface MatchUser {
  _id: string
  id: string
  name: string
  photos: string[]
  age?: number
  email: string
}

export interface Match {
  _id: string
  matchId: string
  otherUser: MatchUser | null
  initiatedBy: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export interface Message {
  _id: string
  matchId: string
  sender: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  matches: T[]
  count?: number
  message?: string
}

export interface MessagesResponse {
  success: boolean
  messages: Message[]
}

export interface MessageResponse {
  success: boolean
  message: Message
}

export const messageApi = {
  // Get user's matches - UPDATED TO EXPECT NEW FORMAT
  // store/services/messageApi.ts - Update getMatches function
  getMatches: async (): Promise<{ success: boolean; matches: Match[] }> => {
    try {
      console.log('📞 [messageApi] Fetching matches...')

      const response = await api.get('/messages/matches')

      console.log('✅ [messageApi] Response received:', {
        success: response.data.success,
        count: response.data.count,
        matchesLength: response.data.matches?.length,
      })

      // Validate the response structure
      if (!response.data.success) {
        console.error(
          '❌ [messageApi] Response not successful:',
          response.data.message
        )
        return {
          success: false,
          matches: [],
        }
      }

      if (!Array.isArray(response.data.matches)) {
        console.error(
          '❌ [messageApi] Matches is not an array:',
          response.data.matches
        )
        return {
          success: false,
          matches: [],
        }
      }

      return {
        success: true,
        matches: response.data.matches,
      }
    } catch (error: any) {
      console.error('❌ [messageApi] Error fetching matches:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      })

      // Return empty matches instead of throwing
      return {
        success: false,
        matches: [],
      }
    }
  },

  // Get messages for a specific match
  getMessages: async (matchId: string): Promise<MessagesResponse> => {
    console.log(`📞 Fetching messages for match: ${matchId}`)
    const response = await api.get(`/messages/${matchId}`)
    return response.data
  },

  // Send a message
  sendMessage: async (
    matchId: string,
    content: string
  ): Promise<MessageResponse> => {
    try {
      console.log(`📞 [messageApi] Sending message to match: ${matchId}`)
      const response = await api.post('/messages/send', {
        matchId,
        content,
      })
      return response.data
    } catch (error: any) {
      console.error(`❌ [messageApi] Error sending message:`, error)
      throw error
    }
  },

  // Mark messages as read
  markAsRead: async (matchId: string): Promise<{ success: boolean }> => {
    try {
      const response = await api.post(`/messages/mark-read/${matchId}`)
      return response.data
    } catch (error: any) {
      console.error(`❌ [messageApi] Error marking as read:`, error)
      return { success: false }
    }
  },
  editMessage: async (
    messageId: string,
    matchId: string,
    content: string
  ): Promise<{ success: boolean; message?: Message; updatedAt?: string }> => {
    try {
      const response = await api.put(`/messages/${messageId}/edit`, {
        matchId,
        content,
      })

      return response.data
    } catch (error: any) {
      console.error(
        `❌ [messageApi] Error editing message ${messageId}:`,
        error
      )

      // Return a consistent error response
      return {
        success: false,
        message: undefined,
        updatedAt: undefined,
      }
    }
  },
  getUnreadTotal: async (): Promise<{
    success: boolean
    totalUnread: number
    matchesWithUnread: Array<{ matchId: string; unreadCount: number }>
    matchesWithUnreadCount: number
  }> => {
    try {
      const response = await api.get('/messages/unread/total')
      return response.data
    } catch (error) {
      console.error('❌ Error fetching unread total:', error)
      return {
        success: false,
        totalUnread: 0,
        matchesWithUnread: [],
        matchesWithUnreadCount: 0,
      }
    }
  },
}
