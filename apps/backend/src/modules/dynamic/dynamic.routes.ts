import { Router } from 'express'
import * as dynamicController from './dynamic.controller'
import { requireAuth } from '../../middleware/auth.middleware'
import { apiRateLimiter } from '../../middleware/rateLimit.middleware'

const router = Router({ mergeParams: true })

// Protect all dynamic routes
router.use(requireAuth)
router.use(apiRateLimiter)

// Ensure config exists and user has access
router.use(dynamicController.validateConfigAndTable)

// CRUD routes
router.get('/', dynamicController.listRecords)
router.get('/:id', dynamicController.getRecord)
router.post('/', dynamicController.createRecord)
router.put('/:id', dynamicController.updateRecord)
router.delete('/:id', dynamicController.deleteRecord)

export default router
