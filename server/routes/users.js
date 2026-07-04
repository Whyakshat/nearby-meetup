import express from 'express';
import { prisma } from '../db.js';
import auth from './auth.middleware.js';

const router = express.Router();

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isDisabled: false },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        interests: true,
        gender: true,
        isPrivate: true,
        latitude: true,
        longitude: true,
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

// Check Username Availability
router.get('/check-username/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const normalizedUsername = username.toLowerCase().trim();
    
    // Regex for valid username (alphanumeric and underscore, 3-20 chars)
    const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername);
    if (!isValid) {
      return res.json({ available: false, message: 'Invalid format (3-20 chars, letters/numbers/underscore)' });
    }
    
    const existing = await prisma.user.findFirst({
      where: {
        username: {
          equals: normalizedUsername,
          mode: 'insensitive'
        },
        id: {
          not: req.user.id
        }
      }
    });
    
    res.json({ available: !existing });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, username, bio, interests, avatar, gender, isPrivate, blockedUsers, latitude, longitude } = req.body;
    
    const data = {};
    if (name !== undefined) data.name = name;
    if (bio !== undefined) data.bio = bio;
    if (interests !== undefined) data.interests = JSON.stringify(interests);
    if (avatar !== undefined) data.avatar = avatar;
    if (gender !== undefined) data.gender = gender;
    if (isPrivate !== undefined) data.isPrivate = isPrivate;
    if (blockedUsers !== undefined) data.blockedUsers = JSON.stringify(blockedUsers);
    if (latitude !== undefined) data.latitude = latitude;
    if (longitude !== undefined) data.longitude = longitude;
    
    if (username !== undefined) {
      const normalizedUsername = username.toLowerCase().trim();
      const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid username format' });
      }
      
      const existing = await prisma.user.findFirst({
        where: {
          username: { equals: normalizedUsername, mode: 'insensitive' },
          id: { not: req.user.id }
        }
      });
      if (existing) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      data.username = normalizedUsername;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data
    });

    user.interests = JSON.parse(user.interests);
    user.blockedUsers = JSON.parse(user.blockedUsers);

    res.json({ id: user.id, email: user.email, name: user.name, username: user.username, bio: user.bio, interests: user.interests, avatar: user.avatar, gender: user.gender, isPrivate: user.isPrivate, blockedUsers: user.blockedUsers, latitude: user.latitude, longitude: user.longitude });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Disable account
router.put('/profile/disable', auth, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isDisabled: true }
    });
    res.json({ message: 'Account disabled successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete account
router.delete('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Manually delete related resources to prevent foreign key errors
    await prisma.post.deleteMany({ where: { authorId: userId } });
    await prisma.meetup.deleteMany({ where: { authorId: userId } });
    await prisma.request.deleteMany({
      where: {
        OR: [
          { fromId: userId },
          { toId: userId }
        ]
      }
    });
    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });
    
    await prisma.user.delete({ where: { id: userId } });
    
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
