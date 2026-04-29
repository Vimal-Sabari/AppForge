import { redis } from './redis'
import { prisma } from './prisma'
import { AppConfig } from 'shared-types'

export class ConfigCache {
  /**
   * Retrieves the config for an app, checking Redis first, then the database.
   * Caches the result in Redis for 5 minutes.
   * @param appId The ID of the app.
   * @returns The AppConfig object or null if not found.
   */
  static async getConfig(appId: string): Promise<{ config: AppConfig; userId: string } | null> {
    const cacheKey = `app:${appId}:config_v2`

    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (err) {
      console.error('Redis cache read error:', err)
    }

    const app = await prisma.app.findUnique({
      where: { id: appId },
    })

    if (!app || !app.config) {
      return null
    }

    const result = {
      config: app.config as unknown as AppConfig,
      userId: app.userId,
    }

    try {
      await redis.setex(cacheKey, 300, JSON.stringify(result)) // 5 minutes TTL
    } catch (err) {
      console.error('Redis cache write error:', err)
    }

    return result
  }

  /**
   * Invalidates the cached config for an app.
   * @param appId The ID of the app.
   */
  static async invalidateConfig(appId: string): Promise<void> {
    try {
      await redis.del(`app:${appId}:config`)
    } catch (err) {
      console.error('Redis cache delete error:', err)
    }
  }
}
