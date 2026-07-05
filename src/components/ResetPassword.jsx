import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { ArrowLeft, Loader, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const { resetPassword } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(token, password);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || 'Failed to reset password. The link may have expired.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '380px', padding: '2rem', background: 'var(--surface-color)', borderRadius: '24px', border: '1px solid var(--surface-border)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}
      >
        {/* Back Button */}
        {!success && (
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500, marginBottom: '2rem' }}
          >
            <ArrowLeft size={16} /> Back to Login
          </button>
        )}

        {!success ? (
          <>
            <h1 className="auth-title" style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0', fontWeight: 700 }}>Reset Password</h1>
            <p className="auth-subtitle" style={{ marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
              Create a new password for your account. Make sure it's secure.
            </p>

            <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 71, 87, 0.1)', color: 'var(--danger-color)', fontSize: '0.85rem', padding: '0.75rem', borderRadius: '12px', fontWeight: 500 }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1, borderRadius: '16px', marginTop: '0.5rem', cursor: 'pointer' }}
                disabled={loading}
              >
                {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Resetting...</> : 'Reset Password'}
              </button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}
          >
            <div style={{ background: 'rgba(52, 168, 83, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <CheckCircle2 size={36} style={{ color: '#34A853' }} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>Password Updated!</h3>
            <p style={{ margin: '0 0 2rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Your password has been successfully reset. You can now log in with your new credentials.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Sign In
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
