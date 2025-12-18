// const express = require('express')
// const mongoose = require('mongoose')
// const dotenv = require('dotenv')
// dotenv.config()
// const cors = require('cors')
// const cookieParser = require('cookie-parser')
// const passport = require('./config/passport')
// import session = require('express-session')
// const path = require('path')
// const app = express()
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || 'keyboard cat',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false },
//   })
// )

// // initialize passport AFTER session middleware
// app.use(passport.initialize())
// app.use(passport.session())
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL, // your Next.js frontend
//     credentials: true, // allow cookies if you use them
//   })
// )
// app.use(express.json())
// app.use(cookieParser())
// app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// //
// const authRoutes = require('./routes/auth')
// app.use('/api/auth', authRoutes)
// app.use('/api/users', require('./routes/recommendations'))
// app.use('/api/swipes', require('./routes/swipes'))
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log('✅ MongoDB connected')
//     app.listen(process.env.PORT || 5000, () =>
//       console.log(`Server running on port ${process.env.PORT}`)
//     )
//   })
//   .catch((err: Error) => console.error('MongoDB error:', err))

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
const server = http.createServer(app)
const setupWebSocket = require('./server/websocket')
const io = setupWebSocket(server)

app.set('io', io)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
)

// initialize passport AFTER session middleware
app.use(passport.initialize())
app.use(passport.session())
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // your Next.js frontend
    credentials: true, // allow cookies if you use them
  })
)
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

//
const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)
app.use('/api/users', require('./routes/recommendations'))
app.use('/api/swipes', require('./routes/swipes'))
app.use('/messages', require('./routes/message'))
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    )
  })
  .catch((err: Error) => console.error('MongoDB error:', err))
