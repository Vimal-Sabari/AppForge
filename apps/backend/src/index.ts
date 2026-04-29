import { env } from './config/env'
import { createApp } from './app'

const app = createApp()
const port = env.PORT

app.listen(port, () => {
  console.log(`🚀 Backend listening on port ${port}`)
  console.log(`🛡️  Security: helmet enabled, rate-limiting: active`)
  console.log(`📈 Monitoring: Sentry ${env.SENTRY_DSN ? 'active' : 'disabled (missing DSN)'}`)
})
