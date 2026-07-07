import express from 'express';
import { prisma } from '../db.js';
import auth from './auth.middleware.js';

const router = express.Router();

// Get all messages for current user
router.get('/', auth, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ]
      },
      orderBy: { timestamp: 'asc' }
    });

    const now = new Date();
    const processedMessages = messages.map(msg => {
      if (msg.type === 'location_live' && msg.expiresAt && new Date(msg.expiresAt) < now) {
        try {
          const parsed = JSON.parse(msg.content);
          return {
            ...msg,
            content: JSON.stringify({ ...parsed, lat: 0, lng: 0, expired: true })
          };
        } catch (e) {
          return {
            ...msg,
            content: JSON.stringify({ lat: 0, lng: 0, expired: true })
          };
        }
      }
      return msg;
    });

    res.json(processedMessages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, content, requestId, type, expiresAt } = req.body;
    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId,
        content,
        requestId,
        type: type || 'text',
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
