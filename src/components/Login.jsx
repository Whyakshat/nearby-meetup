import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { ArrowLeft, Loader } from 'lucide-react';

const Login = () => {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div style={{ width: '100%', maxWidth: '350px' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500, marginBottom: '2rem', alignSelf: 'flex-start' }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="auth-title" style={{ fontSize: '2rem' }}>Welcome back.</h1>
        <p className="auth-subtitle" style={{ marginBottom: '2rem' }}>Sign in to find your vibe.</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
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

          {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Don't have an account?
          <button
            onClick={() => navigate('/signup')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer', marginLeft: '0.5rem' }}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
