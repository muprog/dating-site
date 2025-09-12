import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  email: string
  name: string
  picture?: string
  photos?: (string | File)[]
  provider: 'google' | 'facebook' | 'local'
  providerId: string
  password?: string // For local authentication
  age?: number
  gender?: 'male' | 'female' | 'other'
  location?: string
  resetPasswordOTP?: string | null
  resetPasswordOTPExpires: Date | null
  otp?: string | null
  otpExpires?: Date | null
  isVerified?: boolean
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    picture: {
      type: String,
      default: '',
    },
    photos: {
      type: [String || File],
      default: [],
    },
    provider: {
      type: String,
      enum: ['google', 'facebook', 'local'],
      required: true,
    },
    providerId: {
      type: String,
      required: function () {
        return this.provider !== 'local' // only required if provider is NOT local
      },
    },
    password: {
      type: String,
      // Password is required only for local users
      required: function () {
        return this.provider === 'local'
      },
    },
    age: {
      type: Number,
      min: 18,
      max: 100,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    location: {
      type: String,
    },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

// Compound index for provider + providerId (unique combination)
userSchema.index({ provider: 1, providerId: 1 }, { unique: true })

// Index for email lookups
userSchema.index({ email: 1 })

export default mongoose.model<IUser>('User', userSchema)
