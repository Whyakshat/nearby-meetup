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

const googleOtps = new Map();

// Send Google OTP
router.post('/google/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // If user exists and is a password user, they must enter their password to link
    const needsPasswordLink = user ? !user.isGoogleAuth : false;

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    googleOtps.set(normalizedEmail, {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000
    });

    console.log(`\n==============================================`);
    console.log(`[Google Auth OTP] Code for ${normalizedEmail}: ${otp}`);
    console.log(`==============================================\n`);

    res.json({ message: 'Verification code sent.', needsPasswordLink });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify Google OTP
router.post('/google/verify-otp', async (req, res) => {
  try {
    const { email, otp, name, avatar, password } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cached = googleOtps.get(normalizedEmail);
    if (!cached || cached.expires < Date.now() || cached.code !== otp) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    googleOtps.delete(normalizedEmail);

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      if (user.isDisabled) {
        return res.status(400).json({ message: 'Account is disabled. Please contact support.' });
      }

      // If user exists and requires password verification
      if (!user.isGoogleAuth) {
        if (!password) {
          return res.status(400).json({ message: 'This email is registered with password. Please enter password to link.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Incorrect password for this account.' });
        }
        
        // Link to google login
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isGoogleAuth: true }
        });
      }
    } else {
      // Create user if they don't exist (signup)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), salt); // dummy password
      const uniqueUsername = await generateUniqueUsername(normalizedEmail);
      
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: name || normalizedEmail.split('@')[0],
          username: uniqueUsername,
          bio: '',
          interests: JSON.stringify([]),
          avatar: avatar || '/default-avatar.svg',
          gender: 'Prefer not to say',
          blockedUsers: JSON.stringify([]),
          isGoogleAuth: true
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
