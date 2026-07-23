import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { ArrowLeft, Users, MessageSquare, FileText, Activity, TrendingUp, Eye, Trash2, ShieldOff, ShieldCheck, Search, BarChart3, ShieldAlert, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001/api'
  : 'https://nearby-meetup.onrender.com/api';

const ADMIN_EMAILS = ['testuser@heyo.com', 'akshatojha820@gmail.com'];

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div style={{
    background: 'var(--surface-color)',
    border: '1px solid var(--surface-border)',
    borderRadius: '20px',
    padding: '1.25rem',
    backdropFilter: 'blur(20px)',
    flex: '1 1 calc(50% - 0.5rem)',
    minWidth: '140px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '10px',
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={16} color={color} />
      </div>
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{value}</div>
    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{label}</div>
  </div>
);

// Canvas-based mini chart
const MiniChart = ({ data, width = 280, height = 80, color = '#667eea' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const max = Math.max(...data, 1);
    const step = width / Math.max(data.length - 1, 1);

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${color}30`);
    gradient.addColorStop(1, `${color}05`);

    ctx.beginPath();
    ctx.moveTo(0, height);
    data.forEach((val, i) => {
      const x = i * step;
      const y = height - (val / max) * (height - 10);
      if (i === 0) ctx.lineTo(x, y);
      else {
        const prevX = (i - 1) * step;
        const prevY = height - (data[i - 1] / max) * (height - 10);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    });
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = i * step;
      const y = height - (val / max) * (height - 10);
      if (i === 0) ctx.moveTo(x, y);
      else {
        const prevX = (i - 1) * step;
        const prevY = height - (data[i - 1] / max) * (height - 10);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [data, width, height, color]);

  return <canvas ref={canvasRef} style={{ width, height, display: 'block' }} />;
};

const AdminPanel = ({ onClose }) => {
  const { currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [reportsData, setReportsData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [contentData, setContentData] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('vibecheck_token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const isAdmin = currentUser?.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase());

  useEffect(() => {
    if (isAdmin) loadData();
  }, [activeTab, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard' && !dashboardData) {
        const [dash, interests] = await Promise.all([
          fetch(`${API_URL}/admin/dashboard`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/analytics/interests`, { headers }).then(r => r.json())
        ]);
        setDashboardData(dash);
        setInterestsData(interests);
      }
      if (activeTab === 'reports') {
        const data = await fetch(`${API_URL}/admin/reports`, { headers }).then(r => r.json());
        setReportsData(data);
      }
      if (activeTab === 'users' && !usersData) {
        const data = await fetch(`${API_URL}/admin/users`, { headers }).then(r => r.json());
        setUsersData(data);
      }
      if (activeTab === 'analytics' && !analyticsData) {
        const [overview, engagement, userGrowth] = await Promise.all([
          fetch(`${API_URL}/analytics/overview`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/analytics/engagement`, { headers }).then(r => r.json()),
          fetch(`${API_URL}/analytics/users`, { headers }).then(r => r.json())
        ]);
        setAnalyticsData({ overview, engagement, userGrowth });
      }
      if (activeTab === 'content' && !contentData) {
        const data = await fetch(`${API_URL}/admin/content?type=posts`, { headers }).then(r => r.json());
        setContentData(data);
      }
      if (activeTab === 'audit' && !auditData) {
        const data = await fetch(`${API_URL}/admin/audit-log`, { headers }).then(r => r.json());
        setAuditData(data);
      }
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      await fetch(`${API_URL}/admin/reports/${reportId}/action`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ action })
      });
      const data = await fetch(`${API_URL}/admin/reports`, { headers }).then(r => r.json());
      setReportsData(data);
    } catch (err) {
      console.error('Report action error:', err);
    }
  };

  const handleBanUser = async (userId, ban) => {
    try {
      await fetch(`${API_URL}/admin/users/${userId}/ban`, {
        method: 'PUT', headers,
        body: JSON.stringify({ banned: ban })
      });
      setUsersData(null);
      loadData();
    } catch (err) {
      console.error('Ban error:', err);
    }
  };

  const handleDeleteContent = async (type, id) => {
    try {
      await fetch(`${API_URL}/admin/content/${type}/${id}`, {
        method: 'DELETE', headers
      });
      setContentData(null);
      loadData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const TABS = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'reports', label: 'Reports', icon: ShieldAlert },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'audit', label: 'Audit Log', icon: Eye }
  ];

  if (!isAdmin) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-color)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 71, 87, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <Lock size={32} color="var(--danger-color)" />
        </div>
        <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem 0' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '320px', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
          Admin Panel is strictly restricted to authorized administrators (<strong>testuser@heyo.com</strong> & <strong>akshatojha820@gmail.com</strong>).
        </p>
        <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', borderRadius: '12px' }}>
          Back to Settings
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'var(--bg-color)', zIndex: 99999,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        maxHeight: '100vh', overflow: 'hidden'
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--surface-border)' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.5rem' }}>
            <ArrowLeft size={22} />
          </button>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Admin Panel</h2>
        </div>

        {/* Tabs */}
        <div className="hide-scrollbar" style={{
          display: 'flex', gap: '0.25rem', padding: '0.75rem 1rem',
          overflowX: 'auto', borderBottom: '1px solid var(--surface-border)'
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.45rem 0.85rem', borderRadius: '999px',
                border: activeTab === tab.id ? 'none' : '1px solid var(--surface-border)',
                background: activeTab === tab.id ? 'var(--primary-color)' : 'transparent',
                color: activeTab === tab.id ? 'var(--bg-color)' : 'var(--text-secondary)',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s'
              }}
            >
              <tab.icon size={13} />{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', paddingBottom: '6rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading...</div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && dashboardData && (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <StatCard label="Total Users" value={dashboardData.totalUsers} icon={Users} color="#667eea" />
                    <StatCard label="Active Users" value={dashboardData.activeUsers} icon={Activity} color="#43e97b" />
                    <StatCard label="Pending Reports" value={reportsData?.reports?.filter(r => r.status === 'pending').length || 2} icon={ShieldAlert} color="#ff4757" />
                    <StatCard label="Total Messages" value={dashboardData.totalMessages} icon={MessageSquare} color="#764ba2" />
                  </div>
                </>
              )}

              {/* Reports Queue Tab */}
              {activeTab === 'reports' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>User Reports Queue</div>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255, 71, 87, 0.15)', color: 'var(--danger-color)', padding: '0.2rem 0.55rem', borderRadius: '999px', fontWeight: 700 }}>
                      {reportsData?.reports?.filter(r => r.status === 'pending').length || 0} Pending
                    </span>
                  </div>

                  {(!reportsData?.reports || reportsData.reports.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      <CheckCircle size={36} color="#2ed573" style={{ marginBottom: '0.5rem', opacity: 0.8 }} />
                      <p>All clean! No user reports reported.</p>
                    </div>
                  ) : (
                    reportsData.reports.map(rep => (
                      <div key={rep.id} style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={16} color="var(--danger-color)" />
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{rep.reason}</span>
                          </div>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase',
                            background: rep.status === 'pending' ? 'rgba(255, 171, 0, 0.15)' : rep.status === 'banned' ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255,255,255,0.08)',
                            color: rep.status === 'pending' ? '#ffab00' : rep.status === 'banned' ? 'var(--danger-color)' : 'var(--text-secondary)'
                          }}>
                            {rep.status}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.03)', padding: '0.5rem 0.75rem', borderRadius: '8px', borderLeft: '3px solid var(--danger-color)' }}>
                          "{rep.details || 'No additional comment provided.'}"
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--surface-border)', paddingTop: '0.5rem' }}>
                          <div>Reported: <strong style={{ color: 'var(--text-primary)' }}>{rep.targetName}</strong> ({rep.targetEmail})</div>
                          <div>By: <strong>{rep.reporterName}</strong></div>
                        </div>

                        {rep.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <button
                              onClick={() => handleReportAction(rep.id, 'ban_target')}
                              style={{ flex: 1, background: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.45rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Ban Reported User
                            </button>
                            <button
                              onClick={() => handleReportAction(rep.id, 'warning')}
                              style={{ flex: 1, background: 'rgba(255, 171, 0, 0.15)', color: '#ffab00', border: '1px solid rgba(255, 171, 0, 0.3)', borderRadius: '8px', padding: '0.45rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Send Warning
                            </button>
                            <button
                              onClick={() => handleReportAction(rep.id, 'dismiss')}
                              style={{ background: 'var(--surface-border)', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && usersData && (
                <>
                  <div style={{ marginBottom: '1rem', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '2.75rem', borderRadius: '999px' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    {usersData.total} users total
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(usersData.users || [])
                      .filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(user => (
                        <div key={user.id} style={{
                          background: 'var(--surface-color)', border: '1px solid var(--surface-border)',
                          borderRadius: '16px', padding: '0.85rem 1rem',
                          display: 'flex', alignItems: 'center', gap: '0.75rem'
                        }}>
                          <img src={user.avatar || '/default-avatar.svg'} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {user.name}
                              {user.isDisabled && <span style={{ marginLeft: '0.35rem', fontSize: '0.68rem', color: 'var(--danger-color)', fontWeight: 700 }}>BANNED</span>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              {user.email} · {user.stats?.posts || 0} posts · {user.stats?.sentMessages || 0} msgs
                            </div>
                          </div>
                          <button
                            onClick={() => handleBanUser(user.id, !user.isDisabled)}
                            style={{
                              background: user.isDisabled ? 'rgba(67, 233, 123, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                              border: 'none', borderRadius: '8px',
                              padding: '0.35rem 0.6rem', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '0.25rem',
                              fontSize: '0.72rem', fontWeight: 600,
                              color: user.isDisabled ? '#43e97b' : 'var(--danger-color)'
                            }}
                          >
                            {user.isDisabled ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
                            {user.isDisabled ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      ))}
                  </div>
                </>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && analyticsData && (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <StatCard label="Connection Rate" value={`${analyticsData.overview.connectionRate}%`} icon={TrendingUp} color="#43e97b" />
                    <StatCard label="Total Messages" value={analyticsData.overview.totalMessages} icon={MessageSquare} color="#667eea" />
                  </div>

                  {/* User Growth Chart */}
                  {analyticsData.userGrowth && analyticsData.userGrowth.growth && (
                    <div style={{
                      background: 'var(--surface-color)', border: '1px solid var(--surface-border)',
                      borderRadius: '20px', padding: '1.25rem', marginBottom: '1rem'
                    }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>User Growth</h3>
                      <MiniChart
                        data={analyticsData.userGrowth.growth.map(g => g.total)}
                        width={Math.min(window.innerWidth - 80, 380)}
                        height={100}
                        color="#667eea"
                      />
                    </div>
                  )}

                  {/* Engagement Chart */}
                  {analyticsData.engagement && analyticsData.engagement.daily && (
                    <div style={{
                      background: 'var(--surface-color)', border: '1px solid var(--surface-border)',
                      borderRadius: '20px', padding: '1.25rem'
                    }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Daily Messages</h3>
                      <MiniChart
                        data={analyticsData.engagement.daily.map(d => d.messages)}
                        width={Math.min(window.innerWidth - 80, 380)}
                        height={100}
                        color="#764ba2"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Content Tab */}
              {activeTab === 'content' && contentData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    {contentData.total} posts total
                  </div>
                  {(contentData.items || []).map(post => (
                    <div key={post.id} style={{
                      background: 'var(--surface-color)', border: '1px solid var(--surface-border)',
                      borderRadius: '16px', padding: '0.85rem 1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <img src={post.author?.avatar || '/default-avatar.svg'} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{post.author?.name || 'Unknown'}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                          {new Date(post.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      {post.text && <p style={{ margin: '0 0 0.5rem', fontSize: '0.88rem' }}>{post.text}</p>}
                      {post.image && <img src={post.image} alt="" style={{ width: '100%', borderRadius: '8px', maxHeight: '120px', objectFit: 'cover' }} />}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => handleDeleteContent('post', post.id)}
                          style={{
                            background: 'rgba(255, 71, 87, 0.1)', border: 'none',
                            borderRadius: '8px', padding: '0.35rem 0.6rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
                            fontSize: '0.72rem', fontWeight: 600, color: 'var(--danger-color)'
                          }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Audit Log Tab */}
              {activeTab === 'audit' && auditData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {auditData.entries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      <Eye size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                      <p>No admin actions recorded yet.</p>
                    </div>
                  ) : (
                    auditData.entries.map(entry => (
                      <div key={entry.id} style={{
                        background: 'var(--surface-color)', border: '1px solid var(--surface-border)',
                        borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.85rem'
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{entry.action}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {entry.details} · {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPanel;
