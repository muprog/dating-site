# Dating Site with Social Authentication

A modern dating platform built with Next.js, Express.js, and MongoDB, featuring social authentication with Google and Facebook using better-auth.

## Features

- 🔐 Social Authentication (Google & Facebook)
- 🎨 Modern, responsive UI with Tailwind CSS
- 📱 Mobile-first design
- 🔄 Redux state management
- 🚀 Real-time authentication status
- 👤 User profile management
- 🛡️ Protected routes
- 📊 Session management

## Tech Stack

### Frontend

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Redux Toolkit** - State management
- **Framer Motion** - Animations
- **React Icons** - Icon library

### Backend

- **Express.js** - Node.js web framework
- **TypeScript** - Type safety
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **better-auth** - Authentication library
- **Express Session** - Session management

## Prerequisites

- Node.js 18+
- MongoDB
- Google OAuth 2.0 credentials
- Facebook OAuth 2.0 credentials

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dating-site
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file
cp env.example .env

# Edit .env with your credentials
# Add your Google and Facebook OAuth credentials
# Set your MongoDB connection string
# Set your session secret

# Start the development server
npm run dev
```

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Create .env.local file
cp env.example .env.local

# Edit .env.local with your backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Start the development server
npm run dev
```

### 4. OAuth Configuration

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
6. Copy Client ID and Client Secret to your `.env` file

#### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Set OAuth redirect URIs:
   - `http://localhost:5000/api/auth/facebook/callback` (development)
   - `https://yourdomain.com/api/auth/facebook/callback` (production)
5. Copy App ID and App Secret to your `.env` file

### 5. MongoDB Setup

1. Install MongoDB locally or use MongoDB Atlas
2. Create a database named `dating-site`
3. Update `MONGO_URI` in your server `.env` file

## Environment Variables

### Server (.env)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/dating-site
SESSION_SECRET=your-super-secret-session-key
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
```

### Client (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Project Structure

```
dating-site/
├── client/                 # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   └── navigation/   # Navigation components
│   ├── store/            # Redux store
│   │   ├── auth/         # Auth slice
│   │   └── user/         # User slice
│   └── public/           # Static assets
├── server/                # Express.js backend
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── model/        # Database models
│   │   └── routes/       # API routes
│   └── uploads/          # File uploads
└── README.md
```

## API Endpoints

### Authentication

- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/facebook` - Facebook OAuth login
- `GET /api/auth/facebook/callback` - Facebook OAuth callback
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/session` - Get current session
- `GET /api/auth/profile` - Get user profile

### User Management

- `POST /api/auth/user` - Create or update user
- `GET /api/auth/user/:id` - Get user by ID
- `PUT /api/auth/user/:id` - Update user profile

## Usage

### Authentication Flow

1. User clicks "Sign in with Google" or "Sign in with Facebook"
2. User is redirected to OAuth provider
3. After successful authentication, user is redirected back
4. User data is saved to database
5. User is redirected to profile page

### Protected Routes

The following routes require authentication:

- `/profile` - User profile page
- `/dashboard` - User dashboard
- `/matches` - User matches

### State Management

The app uses Redux Toolkit for state management with the following slices:

- `auth` - Authentication state (user, isAuthenticated, loading, error)
- `user` - User-specific data

## Development

### Running in Development Mode

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Building for Production

```bash
# Backend
cd server
npm run build
npm start

# Frontend
cd client
npm run build
npm start
```

## Troubleshooting

### Common Issues

1. **OAuth Redirect URI Mismatch**

   - Ensure redirect URIs in OAuth provider settings match your callback URLs
   - Check that `CLIENT_URL` in server `.env` is correct

2. **CORS Errors**

   - Verify `CLIENT_URL` in server `.env` matches your frontend URL
   - Check that CORS middleware is properly configured

3. **Session Not Persisting**

   - Ensure `SESSION_SECRET` is set in server `.env`
   - Check that cookies are enabled in browser
   - Verify session middleware configuration

4. **MongoDB Connection Issues**
   - Check `MONGO_URI` in server `.env`
   - Ensure MongoDB service is running
   - Verify network connectivity

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
DEBUG=better-auth:*
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
