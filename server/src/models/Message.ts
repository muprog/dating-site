const mongoose = require('mongoose')
const { Schema } = mongoose

const messageSchema = new Schema(
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

// Index for faster queries
messageSchema.index({ matchId: 1, createdAt: -1 })

module.exports = mongoose.model('Message', messageSchema)
