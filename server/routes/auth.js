import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, bio, interests, avatar, gender } = req.body;
    
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        bio: bio || '',
        interests: JSON.stringify(interests || []),
        avatar: avatar || '/default-avatar.svg',
        gender: gender || null,
        blockedUsers: JSON.stringify([])
      }
    });

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Parse JSON string back to array before sending
    user.interests = JSON.parse(user.interests);
    user.blockedUsers = JSON.parse(user.blockedUsers);

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, bio: user.bio, interests: user.interests, avatar: user.avatar, gender: user.gender, isPrivate: user.isPrivate, blockedUsers: user.blockedUsers } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    user.interests = JSON.parse(user.interests);
    user.blockedUsers = JSON.parse(user.blockedUsers);

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, bio: user.bio, interests: user.interests, avatar: user.avatar, gender: user.gender, isPrivate: user.isPrivate, blockedUsers: user.blockedUsers } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
