import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  email: string
  password?: string
  name: string
  googleId?: string
  facebookId?: string
  age?: number
  gender?: 'male' | 'female' | 'other'
  geoLocation?: {
    type: 'Point'
    coordinates: [number, number]
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
  otp?: string | null
  otpExpires?: Date | null
  resetPasswordOTP?: string | undefined
  resetPasswordExpires?: Date | undefined
  lastActive?: Date
}

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String },
    name: { type: String, required: true },
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    age: { type: Number, required: false },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: false,
    },
    geoLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    location: { type: String },
    bio: String,
    photos: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    preferences: {
      ageRange: { type: [Number], default: [18, 99] },
      genders: { type: [String], default: ['male', 'female', 'other'] },
      maxDistance: { type: Number, default: 50 },
    },
    verified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpires: { type: Date },
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

UserSchema.index({ geoLocation: '2dsphere' })

const User = mongoose.model<IUser>('User', UserSchema)

export default User
