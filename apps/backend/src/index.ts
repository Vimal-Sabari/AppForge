import express from 'express'
import dotenv from 'dotenv-safe'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRoutes from './modules/auth/auth.routes'
import { requireAuth } from './middleware/auth.middleware'

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

app.use('/api/auth', authRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/protected', requireAuth, (req: express.Request & { user?: unknown }, res) => {
  res.json({ message: 'You have accessed a protected route', user: req.user })
})

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})
