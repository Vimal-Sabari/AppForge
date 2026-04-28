import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  console.error(`[Error Handler] ${req.method} ${req.path}`, err)

  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.issues,
    })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Record not found',
        code: 'NOT_FOUND',
      })
      return
    }
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'Unique constraint failed',
        code: 'CONFLICT',
      })
      return
    }
    // Handle other known Prisma errors genericly
    res.status(400).json({
      error: 'Database operation failed',
      code: `PRISMA_ERROR_${err.code}`,
    })
    return
  }

  // Fallback for unknown errors (do not leak stack trace)
  res.status(500).json({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  })
}
