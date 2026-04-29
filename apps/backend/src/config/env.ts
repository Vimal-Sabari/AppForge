import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  ACCESS_SECRET: z.string().min(20),
  REFRESH_SECRET: z.string().min(20),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
})

function validateEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(result.error.format(), null, 2))
    process.exit(1)
  }

  return result.data
}

export const env = validateEnv()
