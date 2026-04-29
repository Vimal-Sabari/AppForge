import request from 'supertest'
import { Express } from 'express'
import { createApp } from '../../app'
import { prisma } from '../../core/prisma'
import { NotificationService } from '../../modules/notifications/notification.service'

jest.setTimeout(15000)
jest.clearAllMocks()
jest.resetModules()

describe('Auth Integration Tests', () => {
  let app: Express

  beforeAll(async () => {
    app = createApp()
    // Ensure async initialization completes
    await NotificationService.ensureInitialized()
    // Clean up database before tests
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    // Cleanup NotificationService
    await NotificationService.shutdown()

    // Disconnect Prisma
    await prisma.$disconnect()

    // Give process time to clean up
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 100)
      if (timeout.unref) timeout.unref()
    })
  })

  describe('POST /api/auth/register', () => {
    it('should create a new user and return tokens', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'Password123!',
      })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('accessToken')
      expect(res.body).toHaveProperty('refreshToken')
      expect(res.body.user).toHaveProperty('email', 'test@example.com')
    })

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/api/auth/register').send({
        email: 'dup@example.com',
        password: 'Password123!',
      })

      const res = await request(app).post('/api/auth/register').send({
        email: 'dup@example.com',
        password: 'Password123!',
      })

      expect(res.status).toBe(409)
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await prisma.user.deleteMany()
      await request(app).post('/api/auth/register').send({
        email: 'login@example.com',
        password: 'Password123!',
      })
    })

    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'Password123!',
      })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('accessToken')
    })

    it('should return 401 for wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'wrongpassword',
      })

      expect(res.status).toBe(401)
    })
  })

  describe('Protected Routes', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/apps')
      expect(res.status).toBe(401)
    })
  })
})
