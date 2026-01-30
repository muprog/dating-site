// import mongoose = require('mongoose')
// const { Schema } = mongoose

// const messageSchema = new Schema(
//   {
//     matchId: {
//       type: Schema.Types.ObjectId,
//       ref: 'Match',
//       required: true,
//     },
//     senderId: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     content: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     isRead: {
//       type: Boolean,
//       default: false,
//     },
//     isEdited: {
//       type: Boolean,
//       default: false,
//     },
//     readAt: {
//       type: Date,
//     },
//   },
//   {
//     timestamps: true,
//   }
// )

// // Index for faster queries
// messageSchema.index({ matchId: 1, createdAt: -1 })

// const Message = mongoose.model('Message', messageSchema)
// export default Message

import mongoose, { Schema, Document, Model, Types } from 'mongoose'
import { IUser } from './User'
export interface IMessage extends Document {
  matchId: Types.ObjectId
  senderId: Types.ObjectId
  content: string
  isRead: boolean
  isEdited: boolean
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface IPopulatedMessage extends Omit<IMessage, 'senderId'> {
  senderId: IUser
}

const messageSchema = new Schema<IMessage>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

messageSchema.index({ matchId: 1, createdAt: -1 })

const Message: Model<IMessage> = mongoose.model<IMessage>(
  'Message',
  messageSchema
)
export default Message
