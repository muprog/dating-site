const express = require('express')
const http = require('http')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config()
const cors = require('cors')
const cookieParser = require('cookie-parser')
const passport = require('./config/passport')
import session = require('express-session')
const path = require('path')

const app = express()

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
)

// Initialize passport AFTER session middleware
app.use(passport.initialize())
app.use(passport.session())

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)

app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Create HTTP server FIRST
const server = http.createServer(app)

// Now setup WebSocket with the HTTP server
const setupWebSocket = require('./server/websocket')
const io = setupWebSocket(server) // Pass the HTTP server

// Set io on app for use in routes
app.set('io', io)

// Routes
const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)
app.use('/api/users', require('./routes/recommendations'))
app.use('/api/swipes', require('./routes/swipes'))
app.use('/messages', require('./routes/message'))

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    websocket: io.engine ? 'running' : 'not running',
    connections: io.engine?.clientsCount || 0,
  })
})

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')

    const PORT = process.env.PORT || 5000

    // IMPORTANT: Use server.listen(), NOT app.listen()
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`🌐 HTTP API: http://localhost:${PORT}`)
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`)
      console.log(`🔗 Health check: http://localhost:${PORT}/health`)
      console.log(
        `🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`
      )
    })
  })
  .catch((err: Error) => console.error('MongoDB error:', err))
