export interface User {
  _id: string
  name: string
  age: number
  photos: string[]
  location?: string
  bio?: string
}

export interface Match {
  _id: string
  otherUser: User
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  createdAt: string
}

export interface Message {
  _id: string
  matchId: string
  senderId: User
  content: string
  isRead: boolean
  createdAt: string
}

export interface MessageState {
  matches: Match[]
  currentMatch: Match | null
  messages: Message[]
  loading: boolean
  error: string | null
  hasMore: boolean
  page: number
  limit: number
}
