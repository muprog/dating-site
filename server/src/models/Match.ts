import mongoose, { Schema, Document, Model, Types } from 'mongoose'
import { IUser } from './User'
export interface IMatch extends Document {
  users: Types.ObjectId[]
  initiatedBy: Types.ObjectId
  lastMessage?: string
  lastMessageAt?: Date
  unreadCounts: Map<string, number> | { [key: string]: number }
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IPopulatedMatch extends Omit<IMatch, 'users' | 'initiatedBy'> {
  users: IUser[]
  initiatedBy: IUser
}

const matchSchema = new Schema<IMatch>(
  {
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      type: String,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

matchSchema.index({ users: 1 })
matchSchema.index({ createdAt: -1 })
matchSchema.index({ initiatedBy: 1 })

const Match: Model<IMatch> = mongoose.model<IMatch>('Match', matchSchema)
export default Match
