import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import { apiRateLimiter } from '../../middleware/rateLimit.middleware'
import * as aiController from './ai.controller'

const router = Router()

router.use(requireAuth)
router.use(apiRateLimiter)

router.post('/generate', aiController.generate)
router.post('/modify', aiController.modify)
router.post('/suggest-fields', aiController.suggest)

export default router
