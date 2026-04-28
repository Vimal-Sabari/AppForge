import { Request, Response } from 'express'
import { ConfigValidator } from '../../core/ConfigValidator'
import { prisma } from '../../core/prisma'
import { ConfigCache } from '../../core/ConfigCache'

export async function validateAppConfig(req: Request, res: Response): Promise<void> {
  const rawConfig = req.body
  const { valid, config, warnings } = ConfigValidator.validateConfig(rawConfig)

  if (!valid) {
    res.status(400).json({ valid: false, error: 'Invalid configuration', warnings, config })
    return
  }

  res.json({ valid, config, warnings })
}

export async function listApps(req: Request, res: Response): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.id

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
      return
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string) || 12))
    const skip = (page - 1) * limit

    const [apps, total] = await Promise.all([
      prisma.app.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.app.count({ where: { userId } }),
    ])

    res.json({ data: apps, meta: { total, page, limit } })
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch apps', code: 'INTERNAL_ERROR' })
  }
}

export async function updateApp(req: Request, res: Response): Promise<void> {
  try {
    const { appId } = req.params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.id

    const app = await prisma.app.findUnique({ where: { id: appId } })
    if (!app || app.userId !== userId) {
      res.status(404).json({ error: 'App not found', code: 'NOT_FOUND' })
      return
    }

    const { valid, config, warnings } = ConfigValidator.validateConfig(req.body)
    if (!valid) {
      res.status(400).json({ error: 'Invalid configuration', warnings })
      return
    }

    const updatedApp = await prisma.app.update({
      where: { id: appId },
      data: {
        name: config.name,
        config: config as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    })

    // Invalidate Cache
    await ConfigCache.invalidateConfig(appId)

    res.json({ app: updatedApp, warnings })
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to update app', code: 'INTERNAL_ERROR' })
  }
}

export async function deleteApp(req: Request, res: Response): Promise<void> {
  try {
    const { appId } = req.params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.id

    const app = await prisma.app.findUnique({ where: { id: appId } })
    if (!app || app.userId !== userId) {
      res.status(404).json({ error: 'App not found', code: 'NOT_FOUND' })
      return
    }

    await prisma.appData.deleteMany({ where: { appId } })
    await prisma.app.delete({ where: { id: appId } })

    await ConfigCache.invalidateConfig(appId)

    res.json({ success: true })
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to delete app', code: 'INTERNAL_ERROR' })
  }
}

export async function createApp(req: Request, res: Response): Promise<void> {
  try {
    const rawConfig = req.body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.id

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
      return
    }

    const { valid, config, warnings } = ConfigValidator.validateConfig(rawConfig)

    if (!valid) {
      res.status(400).json({ error: 'Invalid configuration', warnings })
      return
    }

    const slug =
      config.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
      '-' +
      Math.random().toString(36).substring(2, 7)

    const app = await prisma.app.create({
      data: {
        userId,
        name: config.name,
        slug,
        config: config as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    })

    res.status(201).json({ appId: app.id, slug: app.slug, warnings })
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to create app', code: 'INTERNAL_ERROR' })
  }
}

export async function getApp(req: Request, res: Response): Promise<void> {
  try {
    const { appId } = req.params

    const app = await prisma.app.findUnique({
      where: { id: appId },
    })

    if (!app) {
      res.status(404).json({ error: 'App not found', code: 'NOT_FOUND' })
      return
    }

    res.json(app)
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch app', code: 'INTERNAL_ERROR' })
  }
}
