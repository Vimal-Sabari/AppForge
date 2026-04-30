import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { env } from '../config/env'
import { redis } from '../core/redis'
import { Request } from 'express'

export const authRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip || '0.0.0.0', 6),
  skip: () => env.NODE_ENV === 'test',
  message: { error: 'Too many registration/login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const apiRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip || '0.0.0.0', 6),
  skip: () => env.NODE_ENV === 'test',
  message: { error: 'Too many API requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const importRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip || '0.0.0.0', 6),
  skip: () => env.NODE_ENV === 'test',
  message: { error: 'Import quota exceeded. Maximum 5 imports per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
})
