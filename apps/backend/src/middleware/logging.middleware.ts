import { Request, Response, NextFunction } from 'express'

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const appId = req.params.appId || 'N/A'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.id || 'anonymous'

    console.log(
      `[REQ] ${req.method} ${req.originalUrl} | App: ${appId} | User: ${userId} | Status: ${res.statusCode} | Duration: ${duration}ms`
    )
  })

  next()
}
