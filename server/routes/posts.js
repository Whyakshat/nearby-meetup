import express from 'express';
import { prisma } from '../index.js';
import auth from './auth.middleware.js';

const router = express.Router();

// Get all posts
router.get('/', auth, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { timestamp: 'desc' }
    });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a post
router.post('/', auth, async (req, res) => {
  try {
    const { text, image, imageRatio } = req.body;
    const post = await prisma.post.create({
      data: {
        text,
        image,
        imageRatio: imageRatio || 'auto',
        authorId: req.user.id
      }
    });
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Archive a post
router.put('/:id/archive', auth, async (req, res) => {
  try {
    const { isArchived } = req.body;
    const post = await prisma.post.updateMany({
      where: { id: req.params.id, authorId: req.user.id },
      data: { isArchived }
    });
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a post
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.post.deleteMany({
      where: { id: req.params.id, authorId: req.user.id }
    });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
