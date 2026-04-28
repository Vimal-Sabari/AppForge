import express from 'express'
import dotenv from 'dotenv-safe'

dotenv.config({ allowEmptyValues: true })

const app = express()
const port = process.env.PORT || 3001

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})
