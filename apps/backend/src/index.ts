import express from 'express'
import dotenv from 'dotenv-safe'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRoutes from './modules/auth/auth.routes'
import appsRoutes from './modules/apps/apps.routes'
import dynamicRoutes from './modules/dynamic/dynamic.routes'
import { requireAuth } from './middleware/auth.middleware'
import { errorHandler } from './middleware/error.middleware'
import { requestLogger } from './middleware/logging.middleware'

dotenv.config({ allowEmptyValues: true })

const app = express()
const port = process.env.PORT || 3001

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())
app.use(requestLogger)

app.use('/api/auth', authRoutes)
app.use('/api/apps', appsRoutes)
app.use('/api/apps/:appId/data/:tableName', dynamicRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/protected', requireAuth, (req: express.Request & { user?: unknown }, res) => {
  res.json({ message: 'You have accessed a protected route', user: req.user })
})

app.use(errorHandler)

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})
