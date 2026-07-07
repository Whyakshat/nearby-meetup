import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../db.js', () => {
  return {
    prisma: {
      message: {
        findMany: vi.fn(),
      }
    }
  };
});

import { prisma } from '../db.js';

// Set NODE_ENV to test to bypass CORS restrictions
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

import app from '../index.js';

describe('Live Location Expiry Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return coordinates for active live location but redact for expired live location', async () => {
    const userId = 'user-123';
    const token = jwt.sign({ user: { id: userId } }, 'test_secret');

    const futureTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1 hour
    const pastTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();   // -1 hour

    const mockMessages = [
      {
        id: 'msg-active',
        senderId: userId,
        receiverId: 'user-456',
        type: 'location_live',
        content: JSON.stringify({ lat: 12.3456, lng: 78.9012 }),
        expiresAt: futureTime,
        timestamp: new Date()
      },
      {
        id: 'msg-expired',
        senderId: userId,
        receiverId: 'user-456',
        type: 'location_live',
        content: JSON.stringify({ lat: 23.4567, lng: 89.0123 }),
        expiresAt: pastTime,
        timestamp: new Date()
      },
      {
        id: 'msg-static',
        senderId: userId,
        receiverId: 'user-456',
        type: 'location_static',
        content: JSON.stringify({ lat: 34.5678, lng: 90.1234 }),
        expiresAt: null,
        timestamp: new Date()
      }
    ];

    prisma.message.findMany.mockResolvedValue(mockMessages);

    const res = await request(app)
      .get('/api/messages')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);

    const activeMsg = res.body.find(m => m.id === 'msg-active');
    const expiredMsg = res.body.find(m => m.id === 'msg-expired');
    const staticMsg = res.body.find(m => m.id === 'msg-static');

    // Active message coordinates must remain unchanged
    const activeContent = JSON.parse(activeMsg.content);
    expect(activeContent.lat).toBe(12.3456);
    expect(activeContent.lng).toBe(78.9012);
    expect(activeContent.expired).toBeUndefined();

    // Expired message coordinates must be redacted to 0
    const expiredContent = JSON.parse(expiredMsg.content);
    expect(expiredContent.lat).toBe(0);
    expect(expiredContent.lng).toBe(0);
    expect(expiredContent.expired).toBe(true);

    // Static location must not be redacted (expiresAt is null)
    const staticContent = JSON.parse(staticMsg.content);
    expect(staticContent.lat).toBe(34.5678);
    expect(staticContent.lng).toBe(90.1234);
  });
});
