import React from 'react';
import { useAppContext } from '../AppContext';
import { MapPin, MapPinOff, Loader } from 'lucide-react';

export const RequireLocation = ({ children }) => {
  const { location, locationError, fetchLocation } = useAppContext();

  if (locationError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        gap: '0'
      }}>
        <div style={{ background: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.2)', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <MapPinOff size={36} color="var(--danger-color)" />
        </div>
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>Location Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', maxWidth: '280px', lineHeight: 1.6 }}>
          {locationError}
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '260px', lineHeight: 1.5 }}>
          Please enable location access in your browser settings and try again.
        </p>
        <button 
          onClick={fetchLocation} 
          className="btn btn-accent" 
          style={{ padding: '0.85rem 2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <MapPin size={16} /> Try Again
        </button>
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
        gap: '1rem'
      }}>
        <div style={{ position: 'relative', width: '64px', height: '64px' }}>
          <Loader size={40} style={{ color: 'var(--accent-color)', animation: 'spin 1s linear infinite', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Finding your location...</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.7 }}>Allow location access when prompted</p>
      </div>
    );
  }

  return children;
};
