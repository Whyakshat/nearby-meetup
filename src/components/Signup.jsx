import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { ArrowLeft, Loader } from 'lucide-react';
import GoogleAuthModal from './GoogleAuthModal';
import { AnimatePresence } from 'framer-motion';

const Signup = () => {
  const { signup } = useAppContext();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Google modal visibility
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!gender) {
      setError('Please select a gender');
      return;
    }

    setLoading(true);
    try {
      const result = await signup(email, password, gender, name.trim());
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="auth-container" style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '350px', padding: '1rem' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500, marginBottom: '2rem', alignSelf: 'flex-start' }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="auth-title" style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Create Account.</h1>
        <p className="auth-subtitle" style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Join the Heyo network today.</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="input-group">
            <label>Your Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Akshat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label>Gender</label>
            <select
              className="input-field"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
              disabled={loading}
              style={{ appearance: 'none' }}
            >
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center', fontWeight: 500 }}>{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1, borderRadius: '16px' }}
            disabled={loading}
          >
            {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creating account...</> : 'Sign Up'}
          </button>
        </form>

        {/* Or Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }}></div>
        </div>

        {/* Google Login button */}
        <button
          onClick={() => setShowGoogleModal(true)}
          disabled={loading}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '0.9rem', fontSize: '0.98rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', borderRadius: '16px', border: '1px solid var(--surface-border)', fontWeight: 600 }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#EA4335" d="M9 3.6c1.62 0 3.06.56 4.21 1.64l3.15-3.15C14.45 1.18 11.97 0 9 0 5.48 0 2.44 2.02.94 4.96l3.7 2.87C5.51 5.34 7.07 3.6 9 3.6z"/>
            <path fill="#4285F4" d="M17.64 9.2c0-.58-.05-1.14-.15-1.68H9v3.18h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.76 2.14c1.62-1.49 2.83-3.69 2.83-6.34z"/>
            <path fill="#FBBC05" d="M4.64 10.67c-.24-.73-.38-1.52-.38-2.33s.14-1.6.38-2.33l-3.7-2.87C.36 4.67 0 6.29 0 8s.36 3.33.94 4.87l3.7-2.87z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.76-2.14c-.77.52-1.74.83-3.2.83-2.91 0-5.38-1.97-6.26-4.63l-3.7 2.87C2.44 15.98 5.48 18 9 18z"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Already have an account?
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer', marginLeft: '0.5rem' }}
          >
            Sign In
          </button>
        </p>
      </div>

      {/* Google Modal */}
      <AnimatePresence>
        {showGoogleModal && (
          <GoogleAuthModal mode="signup" onClose={() => setShowGoogleModal(false)} onAuthSuccess={handleAuthSuccess} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Signup;
