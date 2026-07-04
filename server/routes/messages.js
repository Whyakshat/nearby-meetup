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
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, content, requestId } = req.body;
    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId,
        content,
        requestId
      }
    });
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
