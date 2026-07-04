import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Users, Plus, X, Calendar, MapPin, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001/api'
  : 'https://nearby-meetup.onrender.com/api';

const NewMeetupModal = ({ onClose }) => {
  const { createMeetup, currentUser } = useAppContext();
  const [activity, setActivity] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(2);

  // AI Plan suggestion states
  const [suggestingPlan, setSuggestingPlan] = useState(false);
  const [suggestedList, setSuggestedList] = useState([]);
  const [suggestIndex, setSuggestIndex] = useState(0);

  const handleSuggestPlan = async () => {
    if (suggestedList.length > 0 && suggestIndex < suggestedList.length) {
      setActivity(suggestedList[suggestIndex]);
      setSuggestIndex((suggestIndex + 1) % suggestedList.length);
      return;
    }

    setSuggestingPlan(true);
    try {
      const res = await fetch(`${API_URL}/ai/suggest-activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vibecheck_token')}`
        },
        body: JSON.stringify({ interests: currentUser?.interests || [] })
      });
      const data = await res.json();
      if (data.activities && data.activities.length > 0) {
        setSuggestedList(data.activities);
        setActivity(data.activities[0]);
        setSuggestIndex(1);
      }
    } catch (err) {
      console.error('Failed to suggest plan', err);
    } finally {
      setSuggestingPlan(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activity.trim()) {
      createMeetup(activity.trim(), maxParticipants);
      onClose();
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ width: '100%', maxWidth: '480px', background: 'var(--surface-color)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', padding: '2rem', borderRadius: '28px 28px 0 0', borderTop: '1px solid var(--surface-border)', paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Create Meetup</h2>
          <button onClick={onClose} style={{ background: 'var(--surface-border)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>What's the plan?</label>
              <button 
                type="button" 
                onClick={handleSuggestPlan}
                disabled={suggestingPlan}
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0 }}
              >
                <Sparkles size={11} /> {suggestingPlan ? 'Suggesting...' : 'AI Suggest Plan'}
              </button>
            </div>
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
            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>How many people?</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxParticipants(num)}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: '1px solid var(--surface-border)',
                    background: maxParticipants === num ? 'var(--accent-gradient)' : 'var(--surface-color)',
                    color: maxParticipants === num ? 'white' : 'var(--text-primary)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-accent"
            style={{ padding: '1rem', borderRadius: '16px', fontSize: '1.05rem', marginTop: '0.5rem' }}
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
  const { registeredUsers, currentUser, joinMeetup, closeMeetup, cityName, requests, cancelRequest } = useAppContext();
  const navigate = useNavigate();
  
  const author = registeredUsers.find(u => u.id === meetup.authorId) || { name: 'Unknown', avatar: '/default-avatar.svg' };
  const isMine = meetup.authorId === currentUser.id;
  
  // Null-safe participants count
  const joinedCount = Array.isArray(meetup.joinedParticipants) ? meetup.joinedParticipants.length : 0;
  const maxCount = meetup.maxParticipants || 0;
  const isFull = joinedCount >= maxCount;

  // Find if current user has requested to join this meetup
  const meetupRequest = requests.find(r => 
    r.fromId === currentUser.id && 
    r.toId === meetup.authorId && 
    r.activity === `Join Meetup: ${meetup.activity}`
  );

  const timeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative gradient blob */}
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', background: 'var(--accent-gradient)', opacity: 0.08, filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />
      
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
        <img 
          src={author.avatar} 
          alt={author.name}
          onClick={() => navigate(`/profile/${author.id}`)}
          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--surface-border)', cursor: 'pointer', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 
            onClick={() => navigate(`/profile/${author.id}`)}
            style={{ margin: '0 0 0.3rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontSize: '1rem' }}
          >
            {author?.name?.split(' ')[0] || 'Unknown'} 
            <CheckCircle2 size={13} color="#3498db" fill="white" />
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={11} /> {timeAgo(meetup.timestamp)}
            </span>
            {cityName && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={11} /> {cityName}
              </span>
            )}
          </div>
        </div>
        <div style={{ 
          background: isFull ? 'rgba(255,71,87,0.1)' : 'rgba(46, 213, 115, 0.1)', 
          border: `1px solid ${isFull ? 'rgba(255,71,87,0.3)' : 'rgba(46,213,115,0.3)'}`,
          padding: '0.25rem 0.6rem', 
          borderRadius: '999px', 
          fontSize: '0.75rem', 
          fontWeight: 700, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.25rem', 
          color: isFull ? 'var(--danger-color)' : 'var(--success-color)',
          flexShrink: 0
        }}>
          <Users size={11} /> {joinedCount}/{maxCount}
        </div>
      </div>

      <p style={{ fontSize: '1.05rem', margin: '0 0 1.25rem 0', fontWeight: 500, lineHeight: 1.5 }}>
        "{meetup.activity}"
      </p>

      {isMine ? (
        <button 
          onClick={() => closeMeetup(meetup.id)}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem' }}
        >
          Sort & Close Request
        </button>
      ) : meetupRequest ? (
        meetupRequest.status === 'pending' ? (
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <button 
              disabled 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem', opacity: 0.6, cursor: 'not-allowed' }}
            >
              Requested
            </button>
            <button 
              onClick={() => cancelRequest(meetupRequest.id)}
              className="btn btn-secondary" 
              style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '12px', 
                fontSize: '0.9rem', 
                color: 'var(--danger-color)', 
                borderColor: 'rgba(255, 71, 87, 0.3)',
                background: 'rgba(255, 71, 87, 0.05)',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            disabled 
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem', opacity: 0.8, cursor: 'not-allowed' }}
          >
            Joined & Connected
          </button>
        )
      ) : (
        <button 
          onClick={() => joinMeetup(meetup.id, meetup.authorId, meetup.activity)}
          disabled={isFull}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', opacity: isFull ? 0.6 : 1 }}
        >
          {isFull ? 'Meetup Full' : 'Join Meetup'}
        </button>
      )}
    </div>
  );
};

const MeetupsFeed = () => {
  const { meetups } = useAppContext();
  const [showModal, setShowModal] = useState(false);

  const openMeetups = meetups
    .filter(m => m.status === 'open')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
          <Users size={18} color="var(--accent-color)" /> Open Meetups
        </h3>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-accent"
          style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderRadius: '999px' }}
        >
          <Plus size={15} /> New
        </button>
      </div>

      <AnimatePresence>
        {openMeetups.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}
          >
            <Calendar size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>No open meetups</h3>
            <p style={{ fontSize: '0.9rem' }}>Be the first to create one!</p>
          </motion.div>
        ) : (
          openMeetups.map((meetup) => (
            <div key={meetup.id}>
              <MeetupCard meetup={meetup} />
            </div>
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
