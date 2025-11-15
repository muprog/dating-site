// import type passportGoogleOauth20 = require('passport-google-oauth20')

// const passport = require('passport')
// const GoogleStrategy = require('passport-google-oauth20').Strategy
// const FacebookStrategy = require('passport-facebook').Strategy
// const User = require('../models/User')

// // Google Strategy
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: '/api/auth/google/callback',
//     },
//     async (
//       _accessToken: string,
//       _refreshToken: string,
//       profile: passportGoogleOauth20.Profile,
//       done: passportGoogleOauth20.VerifyCallback
//     ) => {
//       try {
//         let user = await User.findOne({ googleId: profile.id })
//         if (!user) {
//           user = await User.create({
//             googleId: profile.id,
//             name: profile.displayName ?? 'Unnamed User',
//             email: profile.emails?.[0]?.value ?? '', // ✅ safe optional chaining
//           })
//         }
//         return done(null, user)
//       } catch (err) {
//         return done(err, undefined)
//       }
//     }
//   )
// )

// // Facebook Strategy
// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_CLIENT_ID,
//       clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//       callbackURL: '/api/auth/facebook/callback',
//       profileFields: ['id', 'emails', 'name'],
//     },
//     async (
//       _accessToken: string,
//       _refreshToken: string,
//       profile: passportGoogleOauth20.Profile,
//       done: passportGoogleOauth20.VerifyCallback
//     ) => {
//       try {
//         let user = await User.findOne({ facebookId: profile.id })
//         if (!user) {
//           user = await User.create({
//             facebookId: profile.id,
//             name: `${profile.name?.givenName ?? ''} ${
//               profile.name?.familyName ?? ''
//             }`, // ✅ safe
//             email: profile.emails?.[0]?.value ?? '',
//           })
//         }
//         return done(null, user)
//       } catch (err) {
//         return done(err, undefined)
//       }
//     }
//   )
// )

// // serialize / deserialize
// passport.serializeUser((user: any, done: any) => {
//   done(null, user.id)
// })

// passport.deserializeUser(async (id: string, done: any) => {
//   try {
//     const user = await User.findById(id)
//     done(null, user)
//   } catch (err) {
//     done(err, null)
//   }
// })

// module.exports = passport

import passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const User = require('../models/User')

/**
 * Configure Passport strategies.
 * Uses profile emails safely (optional chaining).
 */

passport.serializeUser((user: any, done) => {
  done(null, user._id?.toString() ?? user.id ?? user) // store id/string
})

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err as any, null)
  }
})

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${
        process.env.BACKEND_URL || 'http://localhost:5000'
      }/api/auth/google/callback`,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: any,
      done: any
    ) => {
      try {
        console.log('Google Profile', profile)
        const googleId = profile.id
        const email = profile.emails?.[0]?.value
        let user = await User.findOne({ googleId })
        if (!user) {
          // try by email (if exists, link accounts)
          if (email) {
            user = await User.findOne({ email })
          }
        }

        if (user) {
          // if existing user doesn't have googleId, add it
          if (!user.googleId) {
            user.googleId = googleId
            await user.save()
          }
          return done(null, user)
        }

        // create new user
        const newUser = await User.create({
          googleId,
          email: email ?? `no-email-${googleId}@example.com`,
          name: profile.displayName ?? 'No name',
          verified: true,
        })
        return done(null, newUser)
      } catch (err) {
        return done(err, null)
      }
    }
  )
)

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      callbackURL: `${
        process.env.BACKEND_URL || 'http://localhost:5000'
      }/api/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'displayName'],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: any,
      done: any
    ) => {
      try {
        const facebookId = profile.id
        const email = profile.emails?.[0]?.value
        let user = await User.findOne({ facebookId })
        if (!user && email) {
          user = await User.findOne({ email })
        }

        if (user) {
          if (!user.facebookId) {
            user.facebookId = facebookId
            await user.save()
          }
          return done(null, user)
        }

        const newUser = await User.create({
          facebookId,
          email: email ?? `no-email-${facebookId}@example.com`,
          name:
            profile.displayName ??
            (`${profile.name?.givenName ?? ''} ${
              profile.name?.familyName ?? ''
            }`.trim() ||
              'No name'),
          verified: true,
        })
        return done(null, newUser)
      } catch (err) {
        return done(err, null)
      }
    }
  )
)

module.exports = passport
