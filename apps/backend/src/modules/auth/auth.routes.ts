import { Router, Request } from 'express'
import * as authController from './auth.controller'
import passport from 'passport'
import './google.strategy' // Initialize passport strategy
import { authRateLimiter } from '../../middleware/rateLimit.middleware'

const router = Router()

router.use(authRateLimiter)

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/refresh', authController.refresh)
router.delete('/logout', authController.logout)

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  (req: Request, res) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user
    if (user) {
      res.cookie('refreshToken', user.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      res.cookie('accessToken', user.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 15 * 60 * 1000,
      })
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/en/dashboard`)
    } else {
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/en/login?error=oauth_failed`
      )
    }
  }
)

export default router
