// // models/Swipe.js
// const mongoose = require('mongoose')

// const swipeSchema = new mongoose.Schema(
//   {
//     swiper: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     swiped: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     action: {
//       type: String,
//       enum: ['like', 'pass'],
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// )

// // Ensure a user can only swipe on another user once
// swipeSchema.index({ swiper: 1, swiped: 1 }, { unique: true })

// // Index for finding mutual likes
// swipeSchema.index({ swiped: 1, swiper: 1, action: 1 })

// module.exports = mongoose.model('Swipe', swipeSchema)

// models/Swipe.ts
const mongoose = require('mongoose')

const swipeSchema = new mongoose.Schema(
  {
    swiper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    swiped: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['like', 'pass'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure a user can only swipe on another user once
swipeSchema.index({ swiper: 1, swiped: 1 }, { unique: true })

// Index for finding mutual likes
swipeSchema.index({ swiped: 1, swiper: 1, action: 1 })

module.exports = mongoose.model('Swipe', swipeSchema)
