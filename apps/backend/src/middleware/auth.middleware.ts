import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { redis } from '../core/redis'
import { prisma } from '../core/prisma'
import { env } from '../config/env'

const ACCESS_SECRET = env.ACCESS_SECRET

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res
        .status(401)
        .json({ error: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' })
      return
    }

    const token = authHeader.split(' ')[1]

    // Check Redis blocklist
    const isBlocked = await redis.get(`bl_${token}`)
    if (isBlocked) {
      res.status(401).json({ error: 'Token has been revoked', code: 'UNAUTHORIZED' })
      return
    }

    // Verify token
    const decoded = jwt.verify(token, ACCESS_SECRET) as { sub: string }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true },
    })

    if (!user) {
      res.status(401).json({ error: 'User not found', code: 'UNAUTHORIZED' })
      return
    }

    // Attach user to request
    Object.assign(req, { user })

    // Set Sentry user context
    import('../config/sentry').then(({ Sentry }) => {
      Sentry.setUser({ id: user.id, email: user.email })
    })

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' })
      return
    }
    // Pass other errors (like Redis connection failures) to the global error handler
    next(error)
  }
}
