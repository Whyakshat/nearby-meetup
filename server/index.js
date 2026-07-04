import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import postsRoutes from './routes/posts.js';
import meetupsRoutes from './routes/meetups.js';
import requestsRoutes from './routes/requests.js';
import messagesRoutes from './routes/messages.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' })); // for large image uploads

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/meetups', meetupsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/ai', aiRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, (err) => {
  if (err) {
    console.error('Server failed to start:', err);
    process.exit(1);
  }
  console.log(`Server running on port ${PORT}`);
});
