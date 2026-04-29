import request from 'supertest'
import { Express } from 'express'
import { createApp } from '../../app'
import { prisma } from '../../core/prisma'
import { env } from '../../config/env'
import { NotificationService } from '../../modules/notifications/notification.service'
import jwt from 'jsonwebtoken'

jest.setTimeout(15000)

describe('Dynamic CRUD Integration Tests', () => {
  let app: Express
  let testApp: { id: string }
  let authToken: string

  beforeAll(async () => {
    app = createApp()
    await NotificationService.ensureInitialized()

    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'dynamic@example.com',
        passwordHash: 'password',
      },
    })
    authToken = jwt.sign({ sub: user.id }, env.ACCESS_SECRET, {
      expiresIn: '1h',
    })

    // Create a test app config
    testApp = (await prisma.app.create({
      data: {
        name: 'Test Dynamic App',
        slug: 'test-dynamic',
        userId: user.id,
        config: {
          version: '1.0',
          name: 'Test Dynamic App',
          auth: { enabled: true, methods: ['email'], userScoped: true },
          database: {
            tables: [
              {
                name: 'tasks',
                fields: [
                  { name: 'title', type: 'text', label: 'Title', required: true },
                  { name: 'completed', type: 'boolean', label: 'Completed' },
                ],
              },
            ],
          },
          ui: { pages: [] },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
    })) as unknown as { id: string }
  })

  afterAll(async () => {
    await prisma.appData.deleteMany()
    await prisma.app.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('CRUD Operations', () => {
    let recordId: string

    it('should return empty array initially', async () => {
      const res = await request(app)
        .get(`/api/apps/${testApp.id}/data/tasks`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    })

    it('should create a record', async () => {
      const res = await request(app)
        .post(`/api/apps/${testApp.id}/data/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Buy milk',
          completed: false,
        })

      expect(res.status).toBe(201)
      expect(res.body.data).toMatchObject({
        title: 'Buy milk',
        completed: false,
      })
      recordId = res.body.data.id
    })

    it('should get a single record', async () => {
      const res = await request(app)
        .get(`/api/apps/${testApp.id}/data/tasks/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe('Buy milk')
    })

    it('should update a record', async () => {
      const res = await request(app)
        .put(`/api/apps/${testApp.id}/data/tasks/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Buy milk and bread',
          completed: true,
        })

      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe('Buy milk and bread')
      expect(res.body.data.completed).toBe(true)
    })

    it('should delete a record', async () => {
      const res = await request(app)
        .delete(`/api/apps/${testApp.id}/data/tasks/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)

      const check = await request(app)
        .get(`/api/apps/${testApp.id}/data/tasks/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(check.status).toBe(404)
    })
  })

  describe('Error Handling & Security', () => {
    it('should return 404 for unknown table', async () => {
      const res = await request(app)
        .get(`/api/apps/${testApp.id}/data/unknown_table`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })

    it('should reject invalid types', async () => {
      const res = await request(app)
        .post(`/api/apps/${testApp.id}/data/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 123, // Should be string
        })

      expect(res.status).toBe(422)
    })
  })

  afterAll(async () => {
    // Cleanup NotificationService
    await NotificationService.shutdown()

    // Disconnect Prisma
    await prisma.$disconnect()

    // Give process time to clean up
    await new Promise((resolve) => setTimeout(resolve, 100))
  })
})
