import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAppContext } from '../AppContext';

const ForgotPasswordModal = ({ onClose }) => {
  const { forgotPassword } = useAppContext();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPassword(email.trim().toLowerCase());
      if (result.success) {
        setSuccessMessage(result.message || 'Password reset link sent successfully!');
      } else {
        setError(result.message || 'Account not found. Please verify the email.');
      }
    } catch (err) {
      setError('Failed to request password reset. Please try again.');
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
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Reset Password</h2>
          <button onClick={onClose} style={{ background: 'var(--surface-border)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <X size={16} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!successMessage ? (
            <motion.form 
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Enter the email address associated with your account. We will send you a simulated link to reset your password.
              </p>

              {error && (
                <div style={{ background: 'rgba(255, 71, 87, 0.1)', color: 'var(--danger-color)', fontSize: '0.85rem', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    style={{ paddingLeft: '2.75rem', width: '100%' }}
                  />
                  <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-accent"
                style={{ width: '100%', padding: '0.9rem', borderRadius: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
              >
                Send Reset Link <ArrowRight size={16} />
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}
            >
              <div style={{ background: 'rgba(52, 168, 83, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <CheckCircle2 size={36} color="var(--accent-color)" style={{ color: '#34A853' }} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Reset Link Sent!</h3>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '300px' }}>
                {successMessage}
              </p>
              <button 
                onClick={onClose}
                className="btn btn-secondary"
                style={{ width: '120px', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordModal;
