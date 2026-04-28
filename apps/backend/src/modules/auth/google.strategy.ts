import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { prisma } from '../../core/prisma'
import { generateTokens } from './auth.service'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'dummy_client_id'
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value
        if (!email) {
          return done(new Error('No email found from Google'), false)
        }

        let user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              oauthProvider: 'google',
              oauthId: profile.id,
            },
          })
        } else if (!user.oauthProvider) {
          // Link account if it exists but wasn't created via OAuth
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              oauthProvider: 'google',
              oauthId: profile.id,
            },
          })
        }

        const tokens = await generateTokens(user.id)
        return done(null, tokens)
      } catch (error) {
        return done(error, false)
      }
    }
  )
)
