import api from './api'
import { Match, Message } from '../../types/messaging'

export const messageApi = {
  // Get user's matches
  getMatches: async (): Promise<{ success: boolean; matches: Match[] }> => {
    const response = await api.get('/messages/matches')
    return response.data
  },

  // Get messages for a match
  getMessages: async (
    matchId: string
  ): Promise<{ success: boolean; messages: Message[] }> => {
    const response = await api.get(`/messages/match/${matchId}/messages`)
    return response.data
  },

  // Send a message
  sendMessage: async (
    matchId: string,
    content: string
  ): Promise<{ success: boolean; message: Message }> => {
    const response = await api.post('/messages/send', { matchId, content })
    return response.data
  },

  // Mark messages as read
  markAsRead: async (matchId: string): Promise<{ success: boolean }> => {
    const response = await api.post(`/messages/mark-read/${matchId}`)
    return response.data
  },
}
