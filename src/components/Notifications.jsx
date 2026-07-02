import React from 'react';
import { useAppContext } from '../AppContext';

const Notifications = () => {
  const { notifications } = useAppContext();

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      width: '90%',
      maxWidth: '400px'
    }}>
      {notifications.map(note => (
        <div
          key={note.id}
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: '1rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            fontWeight: 500,
            fontSize: '0.9rem',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          {note.message}
        </div>
      ))}
    </div>
  );
};

export default Notifications;
