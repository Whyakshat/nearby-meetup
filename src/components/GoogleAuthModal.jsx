import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, LogIn, ArrowRight } from 'lucide-react';
import { useAppContext } from '../AppContext';

const GoogleAuthModal = ({ onClose, onAuthSuccess }) => {
  const { sessions, switchAccount, sendGoogleOtp, googleLogin } = useAppContext();
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP and Verification States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [needsPasswordLink, setNeedsPasswordLink] = useState(false);
  const [linkPassword, setLinkPassword] = useState('');

  // Only show active sessions stored locally on this device
  const sampleUsers = sessions.map(s => s.user);

  const handleSelectUser = (userId) => {
    switchAccount(userId);
    onAuthSuccess();
    onClose();
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!customEmail.trim()) {
      setError('Please enter your email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await sendGoogleOtp(customEmail.trim().toLowerCase());
      if (result.success) {
        setShowOtpScreen(true);
        setNeedsPasswordLink(result.needsPasswordLink);
      } else {
        setError(result.message || 'Failed to send verification code.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError('Please enter verification code.');
      return;
    }
    if (needsPasswordLink && !linkPassword.trim()) {
      setError('Please enter your account password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const displayName = customName.trim() || customEmail.split('@')[0];
      const dummyAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}`;
      
      const result = await googleLogin(
        customEmail.trim().toLowerCase(),
        displayName,
        dummyAvatar,
        otpCode.trim(),
        linkPassword
      );
      
      if (result.success) {
        onAuthSuccess();
        onClose();
      } else {
        setError(result.message || 'Google verification failed.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 120000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      />

      {/* Modal */}
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        style={{ 
          width: '100%', 
          maxWidth: '450px', 
          background: 'var(--surface-color)', 
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
          border: '1px solid var(--surface-border)',
          borderBottom: 'none',
          padding: '1.75rem',
          paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom, 0px))',
          position: 'relative',
          zIndex: 120001,
          boxShadow: '0 -20px 50px rgba(0,0,0,0.3)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 18 18" style={{ marginRight: '0.25rem' }}>
              <path fill="#EA4335" d="M9 3.6c1.62 0 3.06.56 4.21 1.64l3.15-3.15C14.45 1.18 11.97 0 9 0 5.48 0 2.44 2.02.94 4.96l3.7 2.87C5.51 5.34 7.07 3.6 9 3.6z"/>
              <path fill="#4285F4" d="M17.64 9.2c0-.58-.05-1.14-.15-1.68H9v3.18h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.76 2.14c1.62-1.49 2.83-3.69 2.83-6.34z"/>
              <path fill="#FBBC05" d="M4.64 10.67c-.24-.73-.38-1.52-.38-2.33s.14-1.6.38-2.33l-3.7-2.87C.36 4.67 0 6.29 0 8s.36 3.33.94 4.87l3.7-2.87z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.76-2.14c-.77.52-1.74.83-3.2.83-2.91 0-5.38-1.97-6.26-4.63l-3.7 2.87C2.44 15.98 5.48 18 9 18z"/>
            </svg>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Google Accounts</h2>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface-border)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 71, 87, 0.1)', color: 'var(--danger-color)', fontSize: '0.85rem', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.25rem', textAlign: 'center', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!showCustomForm ? (
            <motion.div
              key="chooser"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
            >
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Choose an account to continue to Heyo</p>
              
              {sampleUsers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {sampleUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user.id)}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.85rem 1rem',
                        background: 'var(--surface-color)',
                        border: '1px solid var(--surface-border)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'background 0.2s',
                        color: 'var(--text-primary)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-color)'}
                    >
                      <img src={user.avatar || '/default-avatar.svg'} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                      </div>
                      <LogIn size={16} style={{ color: 'var(--text-secondary)', opacity: 0.6 }} />
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '16px', fontSize: '0.85rem' }}>
                  No active local sessions found on this device.
                </div>
              )}

              <button
                onClick={() => setShowCustomForm(true)}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  background: 'none',
                  border: '1px dashed var(--surface-border)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  color: 'var(--accent-color)',
                  marginTop: '0.5rem',
                  transition: 'border-color 0.2s'
                }}
              >
                Use another account
              </button>
            </motion.div>
          ) : !showOtpScreen ? (
            <motion.form
              key="custom-form"
              onSubmit={handleRequestOtp}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Sign in with any Google account credentials</p>
              
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Google Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="username@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  required
                  disabled={loading}
                  style={{ padding: '0.75rem 1rem' }}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Full Name (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Lakshat Ojha"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  disabled={loading}
                  style={{ padding: '0.75rem 1rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '14px', fontSize: '0.88rem' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-accent"
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '14px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  {loading ? 'Sending...' : 'Send Code'} <ArrowRight size={14} />
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="otp-form"
              onSubmit={handleVerifyOtp}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div style={{ background: 'rgba(0, 122, 255, 0.08)', border: '1px solid rgba(0, 122, 255, 0.2)', padding: '0.85rem', borderRadius: '12px', fontSize: '0.8rem', lineHeight: 1.45, color: 'var(--text-secondary)' }}>
                Verification code for <strong>{customEmail}</strong> has been printed to the server terminal console. Please copy and enter it below.
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem' }}>Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  className="input-field"
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={loading}
                  style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', fontWeight: 700 }}
                />
              </div>

              {needsPasswordLink && (
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <div style={{ background: 'rgba(255, 159, 67, 0.1)', color: '#FF9F43', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 500, lineHeight: 1.4, marginBottom: '0.5rem' }}>
                    This email is already registered with password credentials. Enter your account password to verify and link with Google login.
                  </div>
                  <label style={{ fontSize: '0.8rem' }}>Account Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={{ padding: '0.75rem 1rem' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setShowOtpScreen(false); setOtpCode(''); setNeedsPasswordLink(false); setLinkPassword(''); }}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '14px', fontSize: '0.88rem' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-accent"
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '14px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  {loading ? 'Verifying...' : 'Verify & Login'} <ArrowRight size={14} />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default GoogleAuthModal;
