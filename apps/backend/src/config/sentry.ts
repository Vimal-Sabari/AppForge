import * as Sentry from '@sentry/node'
import { env } from './env'
import { Express } from 'express'

export function initSentry(app: Express) {
  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0,
    })

    // The request handler must be the first middleware on the app
    app.use(Sentry.Handlers.requestHandler())
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler())
  }
}

export function initSentryErrorHandler(app: Express) {
  if (env.SENTRY_DSN) {
    // The error handler must be before any other error middleware and after all controllers
    app.use(
      Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
          // Only capture 5xx errors
          if (error.status && error.status < 500) {
            return false
          }
          return true
        },
      })
    )
  }
}

export { Sentry }
