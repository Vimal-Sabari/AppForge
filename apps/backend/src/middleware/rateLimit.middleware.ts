import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import Redis from 'ioredis'
import { env } from '../config/env'
import { Request } from 'express'

const redis = new Redis(env.REDIS_URL)

export const authRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many registration/login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // Disable header validation to avoid warnings in dev
})

export const apiRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req: Request) => {
    return (req as Request & { user?: { id: string } }).user?.id || req.ip || 'anonymous'
  },
  message: { error: 'Too many API requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
})

export const importRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => {
    return (req as Request & { user?: { id: string } }).user?.id || req.ip || 'anonymous'
  },
  message: { error: 'Import quota exceeded. Maximum 5 imports per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
})
