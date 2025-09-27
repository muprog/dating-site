const mongoose = require('mongoose')
const { Schema } = mongoose

import type { Model } from 'mongoose' // type import

export interface IUser {
  email: string
  password: string
  name: string
  age?: number
  gender?: 'male' | 'female' | 'other'
  location?: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  bio?: string
  photos?: string[]
  interests?: string[]
  preferences?: {
    ageRange: [number, number]
    genders: string[]
    maxDistance: number
  }
  verified?: boolean
  otp?: string
  otpExpires?: Date
}

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: Number, required: false },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: false,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0], // ✅ fix: prevents Mongo error
      },
    },
    bio: String,
    photos: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    preferences: {
      ageRange: { type: [Number], default: [18, 99] },
      genders: { type: [String], default: ['male', 'female', 'other'] },
      maxDistance: { type: Number, default: 50 },
    },
    verified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true }
)

UserSchema.index({ location: '2dsphere' })

// Create model
const User = mongoose.model('User', UserSchema)

// Export with type casting
module.exports = User as Model<IUser>
