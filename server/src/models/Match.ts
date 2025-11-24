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
const mongoose = require('mongoose')

const matchSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Ensure unique pairs of users
matchSchema.index({ users: 1 }, { unique: true })

module.exports = mongoose.model('Match', matchSchema)
