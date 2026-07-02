import express from 'express';
import { prisma } from '../index.js';
import auth from './auth.middleware.js';

const router = express.Router();

// Get all meetups
router.get('/', auth, async (req, res) => {
  try {
    const meetups = await prisma.meetup.findMany({
      orderBy: { timestamp: 'desc' }
    });
    const mapped = meetups.map(m => ({ ...m, joinedParticipants: JSON.parse(m.joinedParticipants) }));
    res.json(mapped);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a meetup
router.post('/', auth, async (req, res) => {
  try {
    const { activity, maxParticipants } = req.body;
    const meetup = await prisma.meetup.create({
      data: {
        activity,
        maxParticipants: parseInt(maxParticipants, 10),
        authorId: req.user.id,
        joinedParticipants: JSON.stringify([req.user.id])
      }
    });
    meetup.joinedParticipants = JSON.parse(meetup.joinedParticipants);
    res.json(meetup);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
