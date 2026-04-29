import express from 'express'
import { env } from './config/env'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import authRoutes from './modules/auth/auth.routes'
import appsRoutes from './modules/apps/apps.routes'
import dynamicRoutes from './modules/dynamic/dynamic.routes'
import importRoutes from './modules/import/import.routes'
import { requireAuth } from './middleware/auth.middleware'
import { errorHandler } from './middleware/error.middleware'
import { requestLogger } from './middleware/logging.middleware'
import { initSentry, initSentryErrorHandler } from './config/sentry'

export function createApp() {
  const app = express()

  initSentry()

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'strict-dynamic'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        preload: true,
      },
    })
  )

  app.use(
    compression({
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false
        return compression.filter(req, res)
      },
    })
  )

  app.use(
    cors({
      origin: env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      exposedHeaders: ['X-Notification-Sent'],
    })
  )
  app.use(express.json())
  app.use(cookieParser())
  app.use(requestLogger)

  app.use('/api/auth', authRoutes)
  app.use('/api/apps', appsRoutes)
  app.use('/api/apps/:appId/data/:tableName', dynamicRoutes)
  app.use('/api/apps/:appId/import', importRoutes)

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  app.get('/api/protected', requireAuth, (req: express.Request & { user?: unknown }, res) => {
    res.json({ message: 'You have accessed a protected route', user: req.user })
  })

  initSentryErrorHandler(app)
  app.use(errorHandler)

  return app
}
