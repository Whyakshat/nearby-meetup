import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { LogOut, Lock, Unlock, Moon, Sun, HelpCircle, ShieldAlert, ArrowLeft, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = ({ onClose }) => {
  const { currentUser, registeredUsers, updateProfile, theme, setTheme, logout, unblockUser, posts, unarchivePost } = useAppContext();
  const [isPrivate, setIsPrivate] = useState(currentUser.isPrivate || false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const archivedPosts = posts.filter(p => p.authorId === currentUser.id && p.isArchived).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const blockedUsersDetails = currentUser.blockedUsers 
    ? registeredUsers.filter(u => currentUser.blockedUsers.includes(u.id))
    : [];

  const handlePrivacyToggle = () => {
    const newVal = !isPrivate;
    setIsPrivate(newVal);
    updateProfile({ isPrivate: newVal });
  };

  const SectionTitle = ({ children }) => (
    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem', marginTop: '2rem' }}>
      {children}
    </h3>
  );

  return (
    <motion.div 
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-image)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--surface-color)', backdropFilter: 'blur(40px)', zIndex: -1 }}></div>
      
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--surface-border)' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: '0 0 0 1rem', fontSize: '1.25rem', fontWeight: 500 }}>Settings</h2>
        </div>

        <div style={{ padding: '0 1.5rem 6rem 1.5rem', overflowY: 'auto', flex: 1 }}>
        
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
            {/* Custom Toggle Switch */}
            <div 
              onClick={handlePrivacyToggle}
              style={{ width: '50px', height: '28px', borderRadius: '15px', background: isPrivate ? 'var(--accent-color)' : 'var(--surface-border)', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}
            >
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: isPrivate ? '24px' : '2px', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
            </div>
          </div>
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

        {/* Support */}
        <SectionTitle>Support</SectionTitle>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 500, fontSize: '1rem', padding: 0 }}>
            <HelpCircle size={20} color="var(--text-secondary)" />
            Help Center
          </button>
        </div>

        {/* Log Out */}
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={logout}
            style={{ width: '100%', maxWidth: '300px', color: 'var(--danger-color)', borderColor: 'rgba(255, 71, 87, 0.3)', background: 'rgba(255, 71, 87, 0.05)', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>

      </div>
      </div>
    </motion.div>
  );
};

export default Settings;
