import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import postsRoutes from './routes/posts.js';
import meetupsRoutes from './routes/meetups.js';
import requestsRoutes from './routes/requests.js';
import messagesRoutes from './routes/messages.js';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '50mb' })); // for large image uploads

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/meetups', meetupsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/messages', messagesRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
