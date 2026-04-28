import { Router } from 'express'
import * as appsController from './apps.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.get('/', requireAuth, appsController.listApps)
router.post('/validate', requireAuth, appsController.validateAppConfig)
router.post('/', requireAuth, appsController.createApp)
router.get('/:appId', requireAuth, appsController.getApp)
router.put('/:appId', requireAuth, appsController.updateApp)
router.delete('/:appId', requireAuth, appsController.deleteApp)

export default router
