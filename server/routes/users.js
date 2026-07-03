import express from 'express';
import { prisma } from '../index.js';
import auth from './auth.middleware.js';

const router = express.Router();

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        interests: true,
        gender: true,
        isPrivate: true,
      }
    });
    
    // Parse JSON strings
    const mappedUsers = users.map(u => ({
      ...u,
      interests: JSON.parse(u.interests)
    }));

    res.json(mappedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, interests, avatar, gender, isPrivate, blockedUsers } = req.body;
    
    const data = {};
    if (name !== undefined) data.name = name;
    if (bio !== undefined) data.bio = bio;
    if (interests !== undefined) data.interests = JSON.stringify(interests);
    if (avatar !== undefined) data.avatar = avatar;
    if (gender !== undefined) data.gender = gender;
    if (isPrivate !== undefined) data.isPrivate = isPrivate;
    if (blockedUsers !== undefined) data.blockedUsers = JSON.stringify(blockedUsers);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data
    });

    user.interests = JSON.parse(user.interests);
    user.blockedUsers = JSON.parse(user.blockedUsers);

    res.json({ id: user.id, email: user.email, name: user.name, bio: user.bio, interests: user.interests, avatar: user.avatar, gender: user.gender, isPrivate: user.isPrivate, blockedUsers: user.blockedUsers });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
