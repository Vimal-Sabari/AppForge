import { Router } from 'express'
import * as appsController from './apps.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.post('/', requireAuth, appsController.createApp)
router.get('/:appId', appsController.getApp)

export default router
