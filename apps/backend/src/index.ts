import dotenv from 'dotenv-safe'
import { createApp } from './app'

dotenv.config({ allowEmptyValues: true })

const app = createApp()
const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})
