import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();
const resetTokens = new Map();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Strict rate limiters for OTP flows to prevent brute-force attacks
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 5, // Limit each IP to 5 OTP requests per 10 minutes
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many OTP requests. Please try again after 10 minutes.' }
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 10, // Limit each IP to 10 verification attempts per 10 minutes
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many OTP verification attempts. Please try again after 10 minutes.' }
});

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
router.post('/google/send-otp', otpLimiter, async (req, res) => {
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
router.post('/google/verify-otp', otpVerifyLimiter, async (req, res) => {
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

// ─── REAL Google Sign-In: Verify Google ID Token ──────────────────────
router.post('/google/verify-token', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google Client ID not configured on server. Add GOOGLE_CLIENT_ID to server/.env' });
    }

    // Verify the ID token with Google
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
    } catch (verifyErr) {
      console.error('Google token verification failed:', verifyErr.message);
      return res.status(401).json({ message: 'Invalid Google token. Please try again.' });
    }

    const payload = ticket.getPayload();
    const googleEmail = payload.email.toLowerCase().trim();
    const googleName = payload.name || googleEmail.split('@')[0];
    const googleAvatar = payload.picture || '/default-avatar.svg';
    const emailVerified = payload.email_verified;

    if (!emailVerified) {
      return res.status(400).json({ message: 'Google email is not verified.' });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email: googleEmail } });

    if (user) {
      // Existing user — log them in
      if (user.isDisabled) {
        return res.status(400).json({ message: 'Account is disabled. Please contact support.' });
      }

      // Mark as Google-authenticated if not already
      if (!user.isGoogleAuth) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isGoogleAuth: true }
        });
      }

      // Update avatar from Google if user still has default
      if (user.avatar === '/default-avatar.svg' && googleAvatar !== '/default-avatar.svg') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatar: googleAvatar }
        });
      }
    } else {
      // New user — create account
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(20).toString('hex'), salt);
      const uniqueUsername = await generateUniqueUsername(googleEmail);

      user = await prisma.user.create({
        data: {
          email: googleEmail,
          password: hashedPassword,
          name: googleName,
          username: uniqueUsername,
          bio: '',
          interests: JSON.stringify([]),
          avatar: googleAvatar,
          gender: 'Prefer not to say',
          blockedUsers: JSON.stringify([]),
          isGoogleAuth: true
        }
      });
    }

    // Generate JWT
    const jwtPayload = { user: { id: user.id } };
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

    user.interests = JSON.parse(user.interests);
    user.blockedUsers = JSON.parse(user.blockedUsers);

    console.log(`[Google Auth] User signed in: ${googleEmail} (${user.id})`);

    res.json({
      token,
      user: {
        id: user.id, email: user.email, name: user.name, username: user.username,
        bio: user.bio, interests: user.interests, avatar: user.avatar,
        gender: user.gender, isPrivate: user.isPrivate, blockedUsers: user.blockedUsers
      }
    });
  } catch (err) {
    console.error('Google verify-token error:', err.message);
    res.status(500).json({ message: 'Server error during Google authentication' });
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

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store in-memory map with 15 minutes expiration
    resetTokens.set(token, {
      email: user.email,
      expires: Date.now() + 15 * 60 * 1000
    });

    const origin = req.headers.origin || 'http://localhost:5173';
    const resetLink = `${origin}/reset-password?token=${token}`;

    let infoMsg = '';
    const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    if (hasSmtpConfig) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Heyo App" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Reset Password - Heyo',
          text: `You requested a password reset. Click this link to reset your password: ${resetLink}\n\nThis link is valid for 15 minutes.`,
          html: `<p>You requested a password reset.</p>
                 <p>Click the link below to reset your password:</p>
                 <p><a href="${resetLink}">${resetLink}</a></p>
                 <p>This link is valid for 15 minutes.</p>`,
        });
        infoMsg = `A password reset link has been sent to your email address ${email}.`;
      } catch (mailErr) {
        console.error('Failed to send real email via Nodemailer:', mailErr.message);
        return res.status(500).json({ message: `Failed to send reset email: ${mailErr.message}` });
      }
    } else {
      infoMsg = `A password reset link has been sent to ${email} (Simulated: check server console logs)`;
      console.log(`\n==============================================`);
      console.log(`[Password Reset Link] URL: ${resetLink}`);
      console.log(`==============================================\n`);
    }

    res.json({ message: infoMsg });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    const cached = resetTokens.get(token);
    if (!cached || cached.expires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password
    await prisma.user.update({
      where: { email: cached.email },
      data: { password: hashedPassword }
    });

    // Delete token
    resetTokens.delete(token);

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
