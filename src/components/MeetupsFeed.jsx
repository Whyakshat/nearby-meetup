import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Users, Plus, X, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NewMeetupModal = ({ onClose }) => {
  const { createMeetup } = useAppContext();
  const [activity, setActivity] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activity.trim()) {
      createMeetup(activity.trim(), maxParticipants);
      onClose();
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ width: '100%', maxWidth: '480px', background: 'var(--surface-color)', padding: '2rem', borderRadius: '24px 24px 0 0', borderTop: '1px solid var(--surface-border)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Create Meetup</h2>
          <button onClick={onClose} style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>What's the plan?</label>
            <input 
              type="text" 
              placeholder="e.g., Going for a movie..." 
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="input-field"
              autoFocus
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>How many people are you looking for?</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxParticipants(num)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid var(--surface-border)',
                    background: maxParticipants === num ? 'var(--primary-color)' : 'transparent',
                    color: maxParticipants === num ? 'var(--bg-color)' : 'var(--text-primary)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Select how many people you want to join you.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ padding: '1rem', marginTop: '1rem', borderRadius: '16px', fontSize: '1.05rem' }}
            disabled={!activity.trim()}
          >
            Post Meetup Request
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const MeetupCard = ({ meetup }) => {
  const { registeredUsers, currentUser, joinMeetup, closeMeetup } = useAppContext();
  const navigate = useNavigate();
  
  const author = registeredUsers.find(u => u.id === meetup.authorId) || { name: 'Unknown', avatar: '' };
  const isMine = meetup.authorId === currentUser.id;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative gradient blob */}
      <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '100px', height: '100px', background: 'var(--accent-gradient)', opacity: 0.1, filter: 'blur(40px)', borderRadius: '50%' }} />
      
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <img 
          src={author.avatar} 
          alt={author.name}
          onClick={() => navigate(`/profile/${author.id}`)}
          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
        />
        <div style={{ flex: 1 }}>
          <h4 
            onClick={() => navigate(`/profile/${author.id}`)}
            style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
          >
            {author.name.split(' ')[0]} <CheckCircle2 size={12} color="#3498db" />
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={12} /> {new Date(meetup.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <span style={{ margin: '0 0.25rem' }}>•</span>
            <MapPin size={12} /> City
          </p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-primary)' }}>
          <Users size={12} /> {meetup.joinedParticipants.length}/{meetup.maxParticipants}
        </div>
      </div>

      <p style={{ fontSize: '1.05rem', margin: '0 0 1.5rem 0', fontWeight: 500 }}>
        "{meetup.activity}"
      </p>

      {isMine ? (
        <button 
          onClick={() => closeMeetup(meetup.id)}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '12px' }}
        >
          Sort & Close Request
        </button>
      ) : (
        <button 
          onClick={() => joinMeetup(meetup.id, meetup.authorId, meetup.activity)}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
        >
          Join Meetup
        </button>
      )}
    </div>
  );
};

const MeetupsFeed = () => {
  const { meetups } = useAppContext();
  const [showModal, setShowModal] = useState(false);

  // Show open meetups.
  const openMeetups = meetups
    .filter(m => m.status === 'open')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} color="var(--primary-color)" /> Open Meetups
        </h3>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-accent"
          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: '999px' }}
        >
          <Plus size={14} /> New
        </button>
      </div>

      <AnimatePresence>
        {openMeetups.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}
          >
            <Calendar size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3>No open meetups</h3>
            <p>Be the first to create one!</p>
          </motion.div>
        ) : (
          openMeetups.map((meetup, index) => (
            <motion.div 
              key={meetup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MeetupCard meetup={meetup} />
            </motion.div>
          ))
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <NewMeetupModal onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MeetupsFeed;
