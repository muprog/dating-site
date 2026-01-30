// // models/Match.js
// const mongoose = require('mongoose')

// const matchSchema = new mongoose.Schema(
//   {
//     users: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true,
//       },
//     ],
//     // Track who initiated the match (both users liked each other)
//     initiatedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     // Track if the match is still active
//     active: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// )

// // Ensure unique pairs of users
// matchSchema.index({ users: 1 }, { unique: true })

// module.exports = mongoose.model('Match', matchSchema)

// models/Match.ts
// const mongoose = require('mongoose')

// const matchSchema = new mongoose.Schema(
//   {
//     users: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true,
//       },
//     ],
//     initiatedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     lastMessage: {
//       type: String,
//       default: null,
//     },
//     lastMessageAt: {
//       type: Date,
//       default: null,
//     },
//     unreadCounts: {
//       type: Map,
//       of: Number,
//       default: {},
//     },
//     active: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// )

// // Ensure unique pairs of users
// // matchSchema.index({ users: 1 }, { unique: true })
// matchSchema.index({ users: 1 })
// matchSchema.index({ createdAt: -1 })
// matchSchema.index({ 'users.0': 1, 'users.1': 1 })
// module.exports = mongoose.model('Match', matchSchema)

// models/Match.js - FINAL VERSION
// import mongoose from 'mongoose'

// const matchSchema = new mongoose.Schema(
//   {
//     users: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true,
//       },
//     ],
//     initiatedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     lastMessage: {
//       type: String,
//       default: null,
//     },
//     lastMessageAt: {
//       type: Date,
//       default: null,
//     },
//     unreadCounts: {
//       type: Map,
//       of: Number,
//       default: {},
//     },
//     active: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// )

// // ✅ CORRECT: Non-unique index for querying
// matchSchema.index({ users: 1 })

// // ✅ Optional: Index for sorting
// matchSchema.index({ createdAt: -1 })

// // ✅ Optional: Index for initiatedBy queries
// matchSchema.index({ initiatedBy: 1 })

// // Remove any pre-save hooks that might cause issues
// // matchSchema.pre('save', function(next) { ... }) // Remove if exists

// const Match = mongoose.model('Match', matchSchema)

// export default Match
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
