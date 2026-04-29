import { Request, Response } from 'express'
import { RegisterSchema, LoginSchema } from 'shared-types'
import * as authService from './auth.service'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

export async function register(req: Request, res: Response) {
  try {
    const data = RegisterSchema.parse(req.body)
    const { accessToken, refreshToken } = await authService.register(data)

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
    res.status(201).json({
      accessToken,
      refreshToken,
      user: { email: data.email },
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: (error as Error & { errors: unknown }).errors,
      })
    } else if (error instanceof Error && error.message === 'Email already in use') {
      res.status(409).json({
        error: error.message,
        code: 'DUPLICATE_EMAIL',
      })
    } else {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Registration failed',
        code: 'REGISTRATION_FAILED',
      })
    }
  }
}

export async function login(req: Request, res: Response) {
  try {
    const data = LoginSchema.parse(req.body)
    const { accessToken, refreshToken } = await authService.login(data)

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
    res.json({ accessToken })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: (error as Error & { errors: unknown }).errors,
      })
    } else {
      res.status(401).json({
        error: error instanceof Error ? error.message : 'Login failed',
        code: 'UNAUTHORIZED',
      })
    }
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token provided', code: 'UNAUTHORIZED' })
      return
    }

    const tokens = await authService.refresh(refreshToken)

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS)
    res.json({ accessToken: tokens.accessToken })
  } catch (error: unknown) {
    res.clearCookie('refreshToken')
    res.status(401).json({
      error: error instanceof Error ? error.message : 'Refresh failed',
      code: 'UNAUTHORIZED',
    })
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refreshToken
    const authHeader = req.headers.authorization
    const accessToken = authHeader?.split(' ')[1] || ''

    await authService.logout(refreshToken, accessToken)

    res.clearCookie('refreshToken')
    res.json({ message: 'Logged out successfully' })
  } catch (error: unknown) {
    res.status(500).json({ error: 'Logout failed', code: 'INTERNAL_ERROR' })
  }
}
