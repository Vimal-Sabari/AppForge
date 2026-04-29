import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../../middleware/auth.middleware'
import { importCsv } from './import.controller'
import { importRateLimiter } from '../../middleware/rateLimit.middleware'

const router = Router({ mergeParams: true })

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
})

// Mounted at /api/apps/:appId/import/:tableName
router.post('/:tableName', requireAuth, importRateLimiter, upload.single('file'), importCsv)

export default router
