import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../core/prisma'
import { redis } from '../../core/redis'
import crypto from 'crypto'
import { LoginInput, RegisterInput } from 'shared-types'
import { env } from '../../config/env'

const ACCESS_SECRET = env.ACCESS_SECRET
const REFRESH_SECRET = env.REFRESH_SECRET

/**
 * Generates an access and refresh token pair for a user
 */
export async function generateTokens(userId: string) {
  const accessToken = jwt.sign({ sub: userId }, ACCESS_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: '7d' })
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })

  return { accessToken, refreshToken }
}

/**
 * Registers a new user with email and password
 */
export async function register(data: RegisterInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
  if (existingUser) {
    throw new Error('Email already in use')
  }

  const passwordHash = await bcrypt.hash(data.password, 12)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
    },
  })

  return generateTokens(user.id)
}

/**
 * Authenticates a user with email and password
 */
export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } })
  if (!user || !user.passwordHash) {
    throw new Error('Invalid email or password')
  }

  const isValid = await bcrypt.compare(data.password, user.passwordHash)
  if (!isValid) {
    throw new Error('Invalid email or password')
  }

  return generateTokens(user.id)
}

/**
 * Rotates a refresh token
 */
export async function refresh(oldRefreshToken: string) {
  const tokenHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex')

  const tokenRecord = await prisma.refreshToken.findFirst({
    where: { tokenHash, isRevoked: false },
    include: { user: true },
  })

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token')
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { isRevoked: true },
  })

  return generateTokens(tokenRecord.userId)
}

/**
 * Logs out a user by revoking their refresh token and adding the access token to the blocklist
 */
export async function logout(refreshToken: string, accessToken: string) {
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    })
  }

  if (accessToken) {
    try {
      const decoded = jwt.decode(accessToken) as { exp?: number } | null
      if (decoded && decoded.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000)
        if (expiresIn > 0) {
          await redis.set(`bl_${accessToken}`, '1', 'EX', expiresIn)
        }
      }
    } catch (err) {
      // Ignore decode errors
    }
  }
}
