import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { ArrowLeft, Loader } from 'lucide-react';

const Signup = () => {
  const { signup } = useAppContext();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

        <h1 className="auth-title" style={{ fontSize: '2rem' }}>Create Account.</h1>
        <p className="auth-subtitle" style={{ marginBottom: '2rem' }}>Join the Heyo network today.</p>

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

          <div className="input-group">
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

          {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creating account...</> : 'Sign Up'}
          </button>
        </form>

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
    </div>
  );
};

export default Signup;
