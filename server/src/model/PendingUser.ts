import mongoose, { Schema, Document } from 'mongoose'

export interface IPendingUser extends Document {
  name: string
  email: string
  password: string
  age: number
  gender: string
  location: string
  profilePhoto?: string
  otp: string
  otpExpiresAt: Date
}

const PendingUserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number, required: true, min: 0 },
    gender: { type: String, required: true },
    location: { type: String, required: true },
    profilePhoto: { type: String },
    otp: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
  },
  { timestamps: true }
)

const PendingUser =
  (mongoose.models.PendingUser as mongoose.Model<IPendingUser>) ||
  mongoose.model<IPendingUser>('PendingUser', PendingUserSchema)

export default PendingUser
