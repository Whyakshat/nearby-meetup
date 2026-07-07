import express from 'express';
import { prisma } from '../db.js';
import auth from './auth.middleware.js';
import { z } from 'zod';

const router = express.Router();

const meetupSchema = z.object({
  activity: z.string().min(3, 'Activity description must be at least 3 characters').max(100),
  maxParticipants: z.preprocess((val) => parseInt(val, 10), z.number().int().min(2, 'Must have at least 2 participants').max(100)),
});

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
    const result = meetupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: result.error.errors[0]?.message || 'Invalid input data',
        errors: result.error.errors
      });
    }

    const { activity, maxParticipants } = result.data;
    const meetup = await prisma.meetup.create({
      data: {
        activity,
        maxParticipants,
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
