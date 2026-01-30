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

app.use(passport.initialize())
app.use(passport.session())

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)

app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

const server = http.createServer(app)

const setupWebSocket = require('./server/websocket')
const io = setupWebSocket(server)

app.set('io', io)

const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)
app.use('/api/users', require('./routes/recommendations'))
app.use('/api/swipes', require('./routes/swipes'))
app.use('/messages', require('./routes/message'))

app.get('/health', (req: any, res: any) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    websocket: io.engine ? 'running' : 'not running',
    connections: io.engine?.clientsCount || 0,
  })
})

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')

    const PORT = process.env.PORT || 5000

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
    })
  })
  .catch((err: Error) => console.error('MongoDB error:', err))
