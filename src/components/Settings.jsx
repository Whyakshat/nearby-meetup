import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { LogOut, Lock, Unlock, Moon, Sun, HelpCircle, ShieldAlert, ArrowLeft, Archive, UserPlus, UserX, AlertTriangle, Trash2, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminPanel from './AdminPanel';

const Settings = ({ onClose }) => {
  const { 
    currentUser, 
    registeredUsers, 
    updateProfile, 
    theme, 
    setTheme, 
    logout, 
    unblockUser, 
    posts, 
    unarchivePost,
    sessions,
    switchAccount,
    addAccount,
    deleteAccount,
    disableAccount
  } = useAppContext();
  const navigate = useNavigate();

  const [isPrivate, setIsPrivate] = useState(currentUser?.isPrivate || false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  // Danger actions confirm overlays
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [disableConfirmValue, setDisableConfirmValue] = useState('');
  const [disableError, setDisableError] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);

  const [deleteConfirmValue, setDeleteConfirmValue] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  if (!currentUser) return null;

  const archivedPosts = posts.filter(p => p.authorId === currentUser.id && p.isArchived).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const blockedUsersDetails = currentUser.blockedUsers 
    ? registeredUsers.filter(u => currentUser.blockedUsers.includes(u.id))
    : [];

  const handlePrivacyToggle = () => {
    const newVal = !isPrivate;
    setIsPrivate(newVal);
    updateProfile({ isPrivate: newVal });
  };

  const handleDisableAccount = async () => {
    if (!disableConfirmValue) return;
    setDisableError('');
    setDisableLoading(true);
    try {
      const res = await disableAccount(disableConfirmValue);
      if (res.success) {
        onClose();
        navigate('/');
      } else {
        setDisableError(res.message || 'Verification failed. Incorrect password or email.');
      }
    } catch (e) {
      setDisableError('An error occurred. Please try again.');
    } finally {
      setDisableLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmValue) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      const res = await deleteAccount(deleteConfirmValue);
      if (res.success) {
        onClose();
        navigate('/');
      } else {
        setDeleteError(res.message || 'Verification failed. Incorrect password or email.');
      }
    } catch (e) {
      setDeleteError('An error occurred. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const SectionTitle = ({ children }) => (
    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem', marginTop: '2rem', fontWeight: 600 }}>
      {children}
    </h3>
  );

  return (
    <motion.div 
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-image)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', maxHeight: '100vh', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--surface-color)', backdropFilter: 'blur(40px)', zIndex: -1 }}></div>
      
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--surface-border)' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: '0 0 0 1rem', fontSize: '1.25rem', fontWeight: 500 }}>Settings</h2>
        </div>

        <div style={{ padding: '0 1.5rem 10rem 1.5rem', overflowY: 'auto', flex: 1 }}>
        
          {/* Account Settings */}
          <SectionTitle>Account</SectionTitle>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isPrivate ? <Lock size={20} color="var(--text-secondary)" /> : <Unlock size={20} color="var(--text-secondary)" />}
                <div>
                  <div style={{ fontWeight: 500 }}>Private Profile</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Only approved users can see your posts.</div>
                </div>
              </div>
              <div 
                onClick={handlePrivacyToggle}
                style={{ width: '50px', height: '28px', borderRadius: '15px', background: isPrivate ? 'var(--accent-color)' : 'var(--surface-border)', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: isPrivate ? '24px' : '2px', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
              </div>
            </div>
          </div>

          {/* Accounts List & Switcher */}
          <SectionTitle>Switch Accounts</SectionTitle>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sessions.map(s => (
              <div key={s.user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.65rem 0.85rem', borderRadius: '12px', border: s.user.id === currentUser.id ? '1px solid var(--accent-color)' : '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                  <img src={s.user.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.user.username ? `@${s.user.username}` : s.user.email}</div>
                  </div>
                </div>
                {s.user.id === currentUser.id ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600 }}>Active</span>
                ) : (
                  <button 
                    onClick={() => { switchAccount(s.user.id); }}
                    className="btn btn-secondary" 
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px' }}
                  >
                    Switch
                  </button>
                )}
              </div>
            ))}
            
            <button 
              onClick={() => { addAccount(); navigate('/login'); }}
              style={{ 
                background: 'none', 
                border: '1px dashed var(--surface-border)', 
                color: 'var(--text-primary)', 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem', 
                cursor: 'pointer', 
                fontWeight: 600, 
                fontSize: '0.85rem', 
                padding: '0.75rem', 
                borderRadius: '12px', 
                marginTop: '0.25rem',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--text-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--surface-border)'}
            >
              <UserPlus size={16} />
              Add Account
            </button>
          </div>

          {/* Appearance Settings */}
          <SectionTitle>Appearance</SectionTitle>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {theme === 'light' ? <Sun size={20} color="var(--text-secondary)" /> : <Moon size={20} color="var(--text-secondary)" />}
                <div style={{ fontWeight: 500 }}>Dark Mode</div>
              </div>
              <div 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                style={{ width: '50px', height: '28px', borderRadius: '15px', background: theme === 'dark' ? 'var(--accent-color)' : 'var(--surface-border)', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: theme === 'dark' ? '24px' : '2px', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
              </div>
            </div>
          </div>

          {/* Privacy & Safety */}
          <SectionTitle>Privacy & Safety</SectionTitle>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <button 
              onClick={() => setShowBlocked(!showBlocked)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 500, fontSize: '1rem', padding: 0 }}
            >
              <ShieldAlert size={20} color="var(--text-secondary)" />
              Blocked Users
              <span style={{ marginLeft: 'auto', background: 'var(--surface-border)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem' }}>
                {blockedUsersDetails.length}
              </span>
            </button>
            
            {showBlocked && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {blockedUsersDetails.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>No blocked users.</div>
                ) : (
                  blockedUsersDetails.map(user => (
                    <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', padding: '0.75rem', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={user.avatar} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontWeight: 500 }}>{user.name}</span>
                      </div>
                      <button 
                        onClick={() => unblockUser(user.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        Unblock
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Content Settings */}
          <SectionTitle>Content</SectionTitle>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <button 
              onClick={() => setShowArchived(!showArchived)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 500, fontSize: '1rem', padding: 0 }}
            >
              <Archive size={20} color="var(--text-secondary)" />
              Archived Posts
              <span style={{ marginLeft: 'auto', background: 'var(--surface-border)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem' }}>
                {archivedPosts.length}
              </span>
            </button>
            
            {showArchived && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {archivedPosts.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>No archived posts.</div>
                ) : (
                  archivedPosts.map(post => (
                    <div key={post.id} style={{ background: 'var(--surface-color)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{post.text}</p>
                      {post.image && (
                        <img src={post.image} style={{ width: '100%', borderRadius: '8px', maxHeight: '150px', objectFit: 'cover' }} />
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(post.timestamp).toLocaleDateString()}
                        </span>
                        <button 
                          onClick={() => unarchivePost(post.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          Unarchive
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Danger Zone Settings */}
          <SectionTitle>Danger Zone</SectionTitle>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button 
              onClick={() => setShowDisableConfirm(true)}
              style={{ 
                background: 'none', 
                border: '1px solid rgba(255, 71, 87, 0.3)', 
                color: 'var(--danger-color)', 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer', 
                fontWeight: 600, 
                fontSize: '0.92rem', 
                padding: '0.65rem 0.75rem', 
                borderRadius: '12px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <UserX size={18} />
              Temporarily Disable Account
            </button>

            <button 
              onClick={() => setShowDeleteConfirm(true)}
              style={{ 
                background: 'rgba(255, 71, 87, 0.1)', 
                border: '1px solid var(--danger-color)', 
                color: 'var(--danger-color)', 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer', 
                fontWeight: 600, 
                fontSize: '0.92rem', 
                padding: '0.65rem 0.75rem', 
                borderRadius: '12px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.1)'}
            >
              <Trash2 size={18} />
              Permanently Delete Account
            </button>
          </div>

          {/* Support */}
          <SectionTitle>Support</SectionTitle>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
            {currentUser?.email && ['testuser@heyo.com', 'akshatojha820@gmail.com'].includes(currentUser.email.toLowerCase()) && (
              <>
                <button 
                  onClick={() => setShowAdminPanel(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 500, fontSize: '1rem', padding: 0 }}
                >
                  <LayoutDashboard size={20} color="var(--accent-color)" />
                  <span style={{ fontWeight: 600 }}>Admin Panel</span>
                  <span style={{ marginLeft: 'auto', background: 'rgba(0,122,255,0.15)', color: '#007aff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '999px', fontWeight: 700 }}>ADMIN</span>
                </button>
                <div style={{ height: '1px', background: 'var(--surface-border)' }} />
              </>
            )}
            <button style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 500, fontSize: '1rem', padding: 0 }}>
              <HelpCircle size={20} color="var(--text-secondary)" />
              Help Center
            </button>
          </div>

          {/* Log Out Button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              className="btn btn-secondary" 
              onClick={logout}
              style={{ 
                width: '100%', 
                maxWidth: '300px', 
                color: 'var(--danger-color)', 
                borderColor: 'rgba(255, 71, 87, 0.3)', 
                background: 'rgba(255, 71, 87, 0.05)', 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '0.5rem', 
                padding: '0.9rem',
                fontWeight: 600,
                borderRadius: '12px'
              }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>

        </div>
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {showDisableConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowDisableConfirm(false); setDisableConfirmValue(''); setDisableError(''); }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 15 }} style={{ width: '100%', maxWidth: '380px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '24px', padding: '1.5rem', zIndex: 1, textAlign: 'center', color: 'var(--text-primary)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              <div style={{ background: 'rgba(255, 159, 67, 0.1)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <AlertTriangle size={28} color="#FF9F43" />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1.2rem' }}>Disable Account?</h3>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Your profile, posts, and meetups will be hidden. Confirm with your password (or your full email address if you logged in using Google).
              </p>
              
              {disableError && (
                <div style={{ color: 'var(--danger-color)', background: 'rgba(255, 71, 87, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 500, marginBottom: '1rem' }}>
                  {disableError}
                </div>
              )}

              <input 
                type="password" 
                placeholder="Confirm password or Google email" 
                value={disableConfirmValue} 
                onChange={e => setDisableConfirmValue(e.target.value)} 
                disabled={disableLoading}
                className="input-field" 
                style={{ width: '100%', marginBottom: '1.25rem', padding: '0.65rem 0.85rem', borderRadius: '12px', fontSize: '0.9rem' }} 
              />

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={() => { setShowDisableConfirm(false); setDisableConfirmValue(''); setDisableError(''); }} 
                  disabled={disableLoading}
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '12px' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDisableAccount} 
                  disabled={disableLoading || !disableConfirmValue.trim()}
                  className="btn btn-accent" 
                  style={{ 
                    flex: 1, 
                    padding: '0.65rem', 
                    borderRadius: '12px', 
                    background: '#FF9F43', 
                    color: 'white', 
                    border: 'none',
                    opacity: (disableLoading || !disableConfirmValue.trim()) ? 0.55 : 1,
                    cursor: (disableLoading || !disableConfirmValue.trim()) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {disableLoading ? 'Checking...' : 'Disable'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showDeleteConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmValue(''); setDeleteError(''); }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 15 }} style={{ width: '100%', maxWidth: '380px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '24px', padding: '1.5rem', zIndex: 1, textAlign: 'center', color: 'var(--text-primary)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              <div style={{ background: 'rgba(255, 71, 87, 0.1)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <AlertTriangle size={28} color="var(--danger-color)" />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1.2rem', color: 'var(--danger-color)' }}>Delete Permanently?</h3>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                This is irreversible. Confirm with your password (or your full email address if you logged in using Google) to wipe all data.
              </p>

              {deleteError && (
                <div style={{ color: 'var(--danger-color)', background: 'rgba(255, 71, 87, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 500, marginBottom: '1rem' }}>
                  {deleteError}
                </div>
              )}

              <input 
                type="password" 
                placeholder="Confirm password or Google email" 
                value={deleteConfirmValue} 
                onChange={e => setDeleteConfirmValue(e.target.value)} 
                disabled={deleteLoading}
                className="input-field" 
                style={{ width: '100%', marginBottom: '1.25rem', padding: '0.65rem 0.85rem', borderRadius: '12px', fontSize: '0.9rem' }} 
              />

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmValue(''); setDeleteError(''); }} 
                  disabled={deleteLoading}
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '12px' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount} 
                  disabled={deleteLoading || !deleteConfirmValue.trim()}
                  className="btn btn-accent" 
                  style={{ 
                    flex: 1, 
                    padding: '0.65rem', 
                    borderRadius: '12px', 
                    background: 'var(--danger-color)', 
                    color: 'white', 
                    border: 'none',
                    opacity: (deleteLoading || !deleteConfirmValue.trim()) ? 0.55 : 1,
                    cursor: (deleteLoading || !deleteConfirmValue.trim()) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {deleteLoading ? 'Wiping...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      <AnimatePresence>
        {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      </AnimatePresence>

    </motion.div>
  );
};

export default Settings;
