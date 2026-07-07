import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../db.js', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      }
    }
  };
});

import { prisma } from '../db.js';

// Set NODE_ENV to test to bypass CORS restrictions during test execution
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

// Now import the app
import app from '../index.js';

describe('Auth & OTP API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/google/send-otp', () => {
    it('should send an OTP verification code and return needsPasswordLink = false if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/google/send-otp')
        .send({ email: 'newuser@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Verification code sent');
      expect(res.body.needsPasswordLink).toBe(false);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'newuser@example.com' }
      });
    });

    it('should return needsPasswordLink = true if user exists and does not have isGoogleAuth set', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'existing@example.com',
        isGoogleAuth: false
      });

      const res = await request(app)
        .post('/api/auth/google/send-otp')
        .send({ email: 'existing@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.needsPasswordLink).toBe(true);
    });

    it('should fail if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/google/send-otp')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email is required');
    });
  });

  describe('POST /api/auth/google/verify-otp', () => {
    it('should reject invalid or expired OTP', async () => {
      const res = await request(app)
        .post('/api/auth/google/verify-otp')
        .send({ email: 'user@example.com', otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid or expired verification code');
    });

    it('should verify correct OTP and return token + user details', async () => {
      // Step 1: Send OTP to generate it
      prisma.user.findUnique.mockResolvedValue(null);
      await request(app)
        .post('/api/auth/google/send-otp')
        .send({ email: 'testotp@example.com' });

      // In real code, the OTP is printed to the console. We need to mock Math.random to get a deterministic OTP.
      const mockMath = Object.create(global.Math);
      mockMath.random = () => 0.123456; // Will result in code "211110"
      global.Math = mockMath;

      await request(app)
        .post('/api/auth/google/send-otp')
        .send({ email: 'testotp@example.com' });

      // Reset Math.random
      delete global.Math.random;

      // Mock user creation
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'testotp@example.com',
        name: 'testotp',
        username: 'testotp',
        bio: '',
        interests: '[]',
        avatar: '/default-avatar.svg',
        gender: 'Prefer not to say',
        blockedUsers: '[]',
        isPrivate: false
      });

      const res = await request(app)
        .post('/api/auth/google/verify-otp')
        .send({
          email: 'testotp@example.com',
          otp: '211110',
          name: 'Test OTP User'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('testotp@example.com');
    });
  });

  describe('OTP Rate Limiting', () => {
    it('should trigger rate limiting after exceeding limit', async () => {
      // The limit is 5 requests per 10 minutes.
      // We will make 6 requests. The 6th should return 429.
      prisma.user.findUnique.mockResolvedValue(null);

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/google/send-otp')
          .send({ email: `rate${i}@example.com` });
      }

      // 6th request should fail with 429
      const res = await request(app)
        .post('/api/auth/google/send-otp')
        .send({ email: 'rateexceeded@example.com' });

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Too many OTP requests');
    });
  });
});
