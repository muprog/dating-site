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
  users: any
}

// types/messaging.ts
export interface Message {
  _id: string
  matchId: string
  sender: string // This is the string ID
  senderId: {
    _id: string
    name: string
    photos: string[]
    age?: number
  }
  content: string
  createdAt: string
  updatedAt: string
  isRead: boolean
  read?: boolean
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
