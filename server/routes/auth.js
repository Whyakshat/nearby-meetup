import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

const router = express.Router();

async function generateUniqueUsername(email) {
  let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
  let username = baseUsername;
  let count = 1;
  while (true) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (!existing) break;
    username = `${baseUsername}${count}`;
    count++;
  }
  return username;
}

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
    const uniqueUsername = await generateUniqueUsername(email);

    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        username: uniqueUsername,
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

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, username: user.username, bio: user.bio, interests: user.interests, avatar: user.avatar, gender: user.gender, isPrivate: user.isPrivate, blockedUsers: user.blockedUsers } });
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

    if (user.isDisabled) {
      return res.status(400).json({ message: 'Account is disabled. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    user.interests = JSON.parse(user.interests);
    user.blockedUsers = JSON.parse(user.blockedUsers);

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, username: user.username, bio: user.bio, interests: user.interests, avatar: user.avatar, gender: user.gender, isPrivate: user.isPrivate, blockedUsers: user.blockedUsers } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Google Authentication
router.post('/google', async (req, res) => {
  try {
    const { email, name, avatar } = req.body;

    let user = await prisma.user.findUnique({ where: { email } });
    
    if (user && user.isDisabled) {
      return res.status(400).json({ message: 'Account is disabled. Please contact support.' });
    }

    if (!user) {
      // Create user if they don't exist (signup)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), salt); // dummy password
      const uniqueUsername = await generateUniqueUsername(email);
      
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || email.split('@')[0],
          username: uniqueUsername,
          bio: '',
          interests: JSON.stringify([]),
          avatar: avatar || '/default-avatar.svg',
          gender: 'Prefer not to say',
          blockedUsers: JSON.stringify([])
        }
      });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    user.interests = JSON.parse(user.interests);
    user.blockedUsers = JSON.parse(user.blockedUsers);

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, username: user.username, bio: user.bio, interests: user.interests, avatar: user.avatar, gender: user.gender, isPrivate: user.isPrivate, blockedUsers: user.blockedUsers } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email address' });
    }

    res.json({ message: `A password reset link has been sent to ${email}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
