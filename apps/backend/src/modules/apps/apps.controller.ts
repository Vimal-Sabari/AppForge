import { Request, Response } from 'express'
import { ConfigValidator } from '../../core/ConfigValidator'
import { prisma } from '../../core/prisma'

export async function createApp(
  req: Request & { user?: { id: string } },
  res: Response
): Promise<void> {
  try {
    const rawConfig = req.body
    const userId = req.user?.id

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
