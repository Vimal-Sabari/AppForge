import * as Sentry from '@sentry/node'
import { env } from './env'
import { Express } from 'express'

export function initSentry() {
  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      integrations: [Sentry.httpIntegration()],
      // Performance Monitoring
      tracesSampleRate: 1.0,
    })

    // In Sentry v8+, requestHandler and tracingHandler are automatic.
    // No need to call them manually.
  }
}

export function initSentryErrorHandler(app: Express) {
  if (env.SENTRY_DSN) {
    // The error handler must be before any other error middleware and after all controllers
    Sentry.setupExpressErrorHandler(app)
  }
}

export { Sentry }
