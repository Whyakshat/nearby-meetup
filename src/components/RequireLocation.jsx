import React from 'react';
import { useAppContext } from '../AppContext';
import { MapPinOff, Loader } from 'lucide-react';

export const RequireLocation = ({ children }) => {
  const { location, locationError } = useAppContext();

  if (locationError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <MapPinOff size={48} color="var(--danger-color)" style={{ marginBottom: '1rem' }} />
        <h2>Location Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {locationError}
        </p>
        <p style={{ fontSize: '0.85rem' }}>Please enable location access in your browser settings and refresh the page.</p>
      </div>
    );
  }

  if (!location) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <Loader size={32} className="spin" style={{ color: 'var(--text-secondary)', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Acquiring location...</p>
        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return children;
};
