import { Router, Request } from 'express'
import * as authController from './auth.controller'
import passport from 'passport'
import './google.strategy' // Initialize passport strategy

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/refresh', authController.refresh)
router.delete('/logout', authController.logout)

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  (req: Request & { user?: { accessToken: string; refreshToken: string } }, res) => {
    // req.user contains { accessToken, refreshToken }
    if (req.user) {
      res.cookie('refreshToken', req.user.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      // Redirect to frontend with access token in hash or query param (since we need it on client side)
      // A better way is to set a short-lived cookie for access token just for the redirect, or send it in URL.
      res.redirect(`http://localhost:3000/dashboard?token=${req.user.accessToken}`)
    } else {
      res.redirect('http://localhost:3000/login?error=oauth_failed')
    }
  }
)

export default router
