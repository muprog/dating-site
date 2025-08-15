import mongoose from 'mongoose'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import passport from './config/auth'
import authRoutes from './routes/auth'

const app = express()

// Middleware
app.use(express.json())
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
)

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
)

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize())
app.use(passport.session())

// Routes
app.use('/api/auth', authRoutes)
app.use('/', require('./routes/route'))

const PORT = process.env.PORT || 5000

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.log('MongoDB connection error:', error))

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
