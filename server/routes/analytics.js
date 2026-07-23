import express from 'express';
import { prisma } from '../db.js';
import auth from './auth.middleware.js';

const router = express.Router();

// ─── Middleware: Admin-only access ────────────────────────────────────
const requireAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      // Allow all authenticated users for now (until roles are migrated)
      // In production, uncomment: return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/analytics/overview ──────────────────────────────────────
router.get('/overview', auth, async (req, res) => {
  try {
    const [totalUsers, totalPosts, totalMeetups, totalMessages, totalRequests] = await Promise.all([
      prisma.user.count({ where: { isDisabled: false } }),
      prisma.post.count(),
      prisma.meetup.count(),
      prisma.message.count(),
      prisma.request.count()
    ]);

    const acceptedRequests = await prisma.request.count({ where: { status: 'accepted' } });
    const connectionRate = totalRequests > 0
      ? Math.round((acceptedRequests / totalRequests) * 100)
      : 0;

    res.json({
      totalUsers,
      totalPosts,
      totalMeetups,
      totalMessages,
      totalRequests,
      acceptedRequests,
      connectionRate,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// ─── GET /api/analytics/users ─────────────────────────────────────────
router.get('/users', auth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isDisabled: false },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group by day
    const dailyGrowth = {};
    let cumulative = 0;
    users.forEach(u => {
      const day = u.createdAt.toISOString().split('T')[0];
      if (!dailyGrowth[day]) dailyGrowth[day] = { date: day, newUsers: 0, total: 0 };
      dailyGrowth[day].newUsers++;
      cumulative++;
      dailyGrowth[day].total = cumulative;
    });

    res.json({
      growth: Object.values(dailyGrowth),
      totalUsers: users.length
    });
  } catch (err) {
    console.error('Analytics users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/analytics/engagement ────────────────────────────────────
router.get('/engagement', auth, async (req, res) => {
  try {
    const [messages, requests, meetups, posts] = await Promise.all([
      prisma.message.findMany({
        select: { timestamp: true },
        orderBy: { timestamp: 'asc' }
      }),
      prisma.request.findMany({
        select: { createdAt: true, status: true },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.meetup.findMany({
        select: { timestamp: true, status: true },
        orderBy: { timestamp: 'asc' }
      }),
      prisma.post.findMany({
        select: { timestamp: true },
        orderBy: { timestamp: 'asc' }
      })
    ]);

    // Daily engagement
    const dailyEngagement = {};
    const addToDay = (date, key) => {
      const day = date.toISOString().split('T')[0];
      if (!dailyEngagement[day]) dailyEngagement[day] = { date: day, messages: 0, requests: 0, meetups: 0, posts: 0 };
      dailyEngagement[day][key]++;
    };

    messages.forEach(m => addToDay(m.timestamp, 'messages'));
    requests.forEach(r => addToDay(r.createdAt, 'requests'));
    meetups.forEach(m => addToDay(m.timestamp, 'meetups'));
    posts.forEach(p => addToDay(p.timestamp, 'posts'));

    res.json({
      daily: Object.values(dailyEngagement),
      totals: {
        messages: messages.length,
        requests: requests.length,
        meetups: meetups.length,
        posts: posts.length,
        acceptedRequests: requests.filter(r => r.status === 'accepted').length,
        openMeetups: meetups.filter(m => m.status === 'open').length
      }
    });
  } catch (err) {
    console.error('Analytics engagement error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/analytics/interests ─────────────────────────────────────
router.get('/interests', auth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isDisabled: false },
      select: { interests: true }
    });

    const interestCounts = {};
    users.forEach(u => {
      const interests = JSON.parse(u.interests || '[]');
      interests.forEach(interest => {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
      });
    });

    const sorted = Object.entries(interestCounts)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / users.length) * 100) }))
      .sort((a, b) => b.count - a.count);

    res.json({
      interests: sorted,
      totalUsers: users.length
    });
  } catch (err) {
    console.error('Analytics interests error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
