import dotenv from 'dotenv'
dotenv.config()

import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import User from '../model/User'

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({
          providerId: profile.id,
          provider: 'google',
        })

        if (!user) {
          // Create new user
          user = new User({
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            picture: profile.photos?.[0]?.value,
            provider: 'google',
            providerId: profile.id,
          })
          await user.save()
        }

        return done(null, user)
      } catch (error) {
        return done(error as Error)
      }
    }
  )
)

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      callbackURL: '/api/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'emails', 'photos'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({
          providerId: profile.id,
          provider: 'facebook',
        })

        if (!user) {
          // Create new user
          user = new User({
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            picture: profile.photos?.[0]?.value,
            provider: 'facebook',
            providerId: profile.id,
          })
          await user.save()
        }

        return done(null, user)
      } catch (error) {
        return done(error as Error)
      }
    }
  )
)

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (error) {
    done(error)
  }
})

export default passport
