import dotenv from 'dotenv'
import path from 'path'

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.test') })

// Global setup for tests
process.env.NODE_ENV = 'test'
