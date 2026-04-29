import { Router } from 'express'
import * as appsController from './apps.controller'
import { requireAuth } from '../../middleware/auth.middleware'
import { apiRateLimiter } from '../../middleware/rateLimit.middleware'

const router = Router()

router.use(requireAuth)
router.use(apiRateLimiter)

router.get('/', appsController.listApps)
router.post('/validate', appsController.validateAppConfig)
router.post('/', appsController.createApp)
router.get('/:appId', appsController.getApp)
router.put('/:appId', appsController.updateApp)
router.delete('/:appId', appsController.deleteApp)

export default router
