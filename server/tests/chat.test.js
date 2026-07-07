import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../db.js', () => {
  return {
    prisma: {
      message: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      request: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      }
    }
  };
});

import { prisma } from '../db.js';

// Set NODE_ENV to test to bypass CORS restrictions
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

import app from '../index.js';

describe('Chat Polling and Messaging API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const userId = 'user-123';
  const token = jwt.sign({ user: { id: userId } }, 'test_secret');

  describe('GET /api/messages (polling)', () => {
    it('should return 401 if unauthorized', async () => {
      const res = await request(app).get('/api/messages');
      expect(res.status).toBe(401);
    });

    it('should return a list of messages for the authenticated user', async () => {
      const mockMessages = [
        { id: '1', senderId: userId, receiverId: 'user-456', content: 'Hello', type: 'text', expiresAt: null, timestamp: new Date() },
        { id: '2', senderId: 'user-456', receiverId: userId, content: 'Hey', type: 'text', expiresAt: null, timestamp: new Date() }
      ];

      prisma.message.findMany.mockResolvedValue(mockMessages);

      const res = await request(app)
        .get('/api/messages')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].content).toBe('Hello');
      expect(prisma.message.findMany).toHaveBeenCalled();
    });
  });

  describe('POST /api/messages', () => {
    it('should create and return a new message', async () => {
      const requestMock = {
        fromId: userId,
        toId: 'user-456'
      };

      prisma.request.findMany.mockResolvedValue([requestMock]);

      const mockCreatedMsg = {
        id: 'msg-999',
        senderId: userId,
        receiverId: 'user-456',
        content: 'Testing message',
        requestId: 'req-777',
        type: 'text',
        expiresAt: null,
        timestamp: new Date()
      };

      prisma.message.create.mockResolvedValue(mockCreatedMsg);

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiverId: 'user-456',
          content: 'Testing message',
          requestId: 'req-777',
          type: 'text'
        });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('msg-999');
      expect(res.body.content).toBe('Testing message');
    });
  });

  describe('GET /api/requests (polling)', () => {
    it('should return a list of connection/meetup requests for the authenticated user', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          fromId: userId,
          toId: 'user-456',
          activity: 'Coffee chat',
          status: 'pending',
          createdAt: new Date(),
          from: { id: userId, name: 'Sender', avatar: '', bio: '' },
          to: { id: 'user-456', name: 'Receiver', avatar: '', bio: '' }
        }
      ];

      prisma.request.findMany.mockResolvedValue(mockRequests);

      const res = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].activity).toBe('Coffee chat');
    });
  });
});
