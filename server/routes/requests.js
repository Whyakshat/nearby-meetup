import express from 'express';
import { prisma } from '../db.js';
import auth from './auth.middleware.js';
import { trainInterestAffinity } from './ai.js';

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
      include: {
        from: { select: { id: true, name: true, avatar: true, bio: true } },
        to: { select: { id: true, name: true, avatar: true, bio: true } }
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
      },
      include: {
        from: { select: { id: true, name: true, avatar: true, bio: true } },
        to: { select: { id: true, name: true, avatar: true, bio: true } }
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
      data: { status },
      include: {
        from: { select: { id: true, name: true, avatar: true, bio: true } },
        to: { select: { id: true, name: true, avatar: true, bio: true } }
      }
    });

    if (status === 'accepted') {
      const fullRequest = await prisma.request.findUnique({
        where: { id: req.params.id },
        include: {
          from: { select: { interests: true } },
          to: { select: { interests: true } }
        }
      });
      if (fullRequest && fullRequest.from && fullRequest.to) {
        try {
          const interestsA = JSON.parse(fullRequest.from.interests || '[]');
          const interestsB = JSON.parse(fullRequest.to.interests || '[]');
          await trainInterestAffinity(interestsA, interestsB);
        } catch (e) {
          console.error('Failed to train AI affinity on acceptance:', e);
        }
      }
    }

    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Cancel/delete a request
router.delete('/:id', auth, async (req, res) => {
  try {
    const request = await prisma.request.findUnique({
      where: { id: req.params.id }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only the sender can cancel a pending/accepted request
    if (request.fromId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await prisma.request.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Request cancelled successfully', requestId: req.params.id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
