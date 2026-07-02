import express from 'express';
import { prisma } from '../index.js';
import auth from './auth.middleware.js';

const router = express.Router();

// Get all requests for current user
router.get('/', auth, async (req, res) => {
  try {
    const requests = await prisma.request.findMany({
      where: {
        OR: [
          { fromId: req.user.id },
          { toId: req.user.id }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a request
router.post('/', auth, async (req, res) => {
  try {
    const { toId, activity } = req.body;
    
    // Check if pending request exists
    const existing = await prisma.request.findFirst({
      where: {
        fromId: req.user.id,
        toId,
        status: 'pending'
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    const request = await prisma.request.create({
      data: {
        fromId: req.user.id,
        toId,
        activity
      }
    });
    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update request status
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await prisma.request.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
