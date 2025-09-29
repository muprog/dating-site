const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cors = require('cors')
dotenv.config()

const app = express()
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // your Next.js frontend
    credentials: true, // allow cookies if you use them
  })
)
app.use(express.json())
//
const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    )
  })
  .catch((err: Error) => console.error('MongoDB error:', err))
