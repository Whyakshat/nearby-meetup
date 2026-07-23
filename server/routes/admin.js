import express from 'express';
import { prisma } from '../db.js';
import auth from './auth.middleware.js';

const router = express.Router();

const ADMIN_EMAILS = ['testuser@heyo.com', 'akshatojha820@gmail.com'];

// ─── In-memory reports & audit logs ───────────────────────────────────
const auditLog = [];
const userReports = [
  {
    id: 'rep_101',
    reporterId: 'usr_sample1',
    reporterName: 'Rahul Verma',
    reporterEmail: 'rahul.v@gmail.com',
    targetUserId: 'usr_sample2',
    targetName: 'Spam Bot 3000',
    targetEmail: 'spambot@temp.com',
    reason: 'Spam / Crypto Promotions',
    details: 'User sending automated promo links in chat.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'rep_102',
    reporterId: 'usr_sample3',
    reporterName: 'Sneha Kapoor',
    reporterEmail: 'sneha.k@gmail.com',
    targetUserId: 'usr_sample4',
    targetName: 'Fake Account',
    targetEmail: 'fakeacc@gmail.com',
    reason: 'Impersonation / Fake Profile',
    details: 'Using photos of a famous influencer without consent.',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

function logAction(adminId, action, targetType, targetId, details = '') {
  auditLog.push({
    id: Date.now().toString(),
    adminId,
    action,
    targetType,
    targetId,
    details,
    timestamp: new Date().toISOString()
  });
  if (auditLog.length > 500) auditLog.shift();
}

// ─── Middleware: Require admin role ────────────────────────────────────
const requireAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return res.status(403).json({ message: 'Access denied: Admin permissions required' });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/admin/dashboard ─────────────────────────────────────────
router.get('/dashboard', auth, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      disabledUsers,
      totalPosts,
      totalMeetups,
      totalMessages,
      pendingRequests,
      acceptedRequests
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isDisabled: false } }),
      prisma.user.count({ where: { isDisabled: true } }),
      prisma.post.count(),
      prisma.meetup.count(),
      prisma.message.count(),
      prisma.request.count({ where: { status: 'pending' } }),
      prisma.request.count({ where: { status: 'accepted' } })
    ]);

    // Recent signups (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = await prisma.user.count({
      where: { createdAt: { gte: weekAgo } }
    });

    res.json({
      totalUsers,
      activeUsers,
      disabledUsers,
      totalPosts,
      totalMeetups,
      totalMessages,
      pendingRequests,
      acceptedRequests,
      recentSignups,
      auditLogCount: auditLog.length
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status === 'active') where.isDisabled = false;
    if (status === 'disabled') where.isDisabled = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, username: true,
          avatar: true, gender: true, isDisabled: true,
          isPrivate: true, isGoogleAuth: true, createdAt: true,
          interests: true,
          _count: { select: { posts: true, meetups: true, sentMessages: true } }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    const mapped = users.map(u => ({
      ...u,
      interests: JSON.parse(u.interests || '[]'),
      stats: u._count,
      _count: undefined
    }));

    res.json({
      users: mapped,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PUT /api/admin/users/:id/ban ─────────────────────────────────────
router.put('/users/:id/ban', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { banned } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isDisabled: !!banned }
    });

    logAction(req.user.id, banned ? 'BAN_USER' : 'UNBAN_USER', 'user', id, `User ${user.name} was ${banned ? 'banned' : 'unbanned'}`);

    res.json({ message: `User ${banned ? 'banned' : 'unbanned'} successfully`, userId: id });
  } catch (err) {
    console.error('Admin ban error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── DELETE /api/admin/content/:type/:id ──────────────────────────────
router.delete('/content/:type/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;

    if (type === 'post') {
      await prisma.post.delete({ where: { id } });
      logAction(req.user.id, 'DELETE_POST', 'post', id);
    } else if (type === 'meetup') {
      await prisma.meetup.delete({ where: { id } });
      logAction(req.user.id, 'DELETE_MEETUP', 'meetup', id);
    } else {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    res.json({ message: `${type} deleted successfully` });
  } catch (err) {
    console.error('Admin content delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/admin/content ───────────────────────────────────────────
router.get('/content', auth, requireAdmin, async (req, res) => {
  try {
    const { type = 'posts', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (type === 'posts') {
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          include: { author: { select: { id: true, name: true, avatar: true } } },
          skip,
          take: parseInt(limit),
          orderBy: { timestamp: 'desc' }
        }),
        prisma.post.count()
      ]);
      return res.json({ items: posts, total, page: parseInt(page) });
    }

    if (type === 'meetups') {
      const [meetups, total] = await Promise.all([
        prisma.meetup.findMany({
          include: { author: { select: { id: true, name: true, avatar: true } } },
          skip,
          take: parseInt(limit),
          orderBy: { timestamp: 'desc' }
        }),
        prisma.meetup.count()
      ]);
      return res.json({ items: meetups, total, page: parseInt(page) });
    }

    res.status(400).json({ message: 'Invalid content type' });
  } catch (err) {
    console.error('Admin content error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/admin/report (Public user submits report) ────────────
router.post('/report', auth, async (req, res) => {
  try {
    const { targetUserId, reason, details } = req.body;
    if (!targetUserId || !reason) {
      return res.status(400).json({ message: 'Target user ID and reason are required' });
    }

    const [reporter, target] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.id } }),
      prisma.user.findUnique({ where: { id: targetUserId } })
    ]);

    const newReport = {
      id: `rep_${Date.now()}`,
      reporterId: req.user.id,
      reporterName: reporter?.name || 'Anonymous',
      reporterEmail: reporter?.email || '',
      targetUserId,
      targetName: target?.name || 'Unknown User',
      targetEmail: target?.email || '',
      reason,
      details: details || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    userReports.push(newReport);
    res.json({ message: 'Report submitted successfully. Thank you for keeping Heyo safe!', reportId: newReport.id });
  } catch (err) {
    console.error('Report submission error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/admin/reports (Admin views reports) ───────────────────
router.get('/reports', auth, requireAdmin, async (req, res) => {
  try {
    res.json({ reports: userReports.slice().reverse(), total: userReports.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PUT /api/admin/reports/:id/action (Admin resolves report) ───────
router.put('/reports/:id/action', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'dismiss', 'ban_target', 'warning'

    const report = userReports.find(r => r.id === id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (action === 'ban_target') {
      await prisma.user.update({
        where: { id: report.targetUserId },
        data: { isDisabled: true }
      });
      report.status = 'banned';
      logAction(req.user.id, 'BAN_REPORTED_USER', 'user', report.targetUserId, `Banned user ${report.targetName} due to report: ${report.reason}`);
    } else if (action === 'dismiss') {
      report.status = 'dismissed';
      logAction(req.user.id, 'DISMISS_REPORT', 'report', id, `Dismissed report against ${report.targetName}`);
    } else if (action === 'warning') {
      report.status = 'warned';
      logAction(req.user.id, 'WARN_USER', 'user', report.targetUserId, `Issued official warning to ${report.targetName}`);
    }

    res.json({ message: `Report updated to ${report.status}`, report });
  } catch (err) {
    console.error('Report action error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/admin/audit-log ─────────────────────────────────────────
router.get('/audit-log', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const pageItems = auditLog.slice().reverse().slice(start, start + parseInt(limit));
    
    res.json({
      entries: pageItems,
      total: auditLog.length,
      page: parseInt(page)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
