import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../AppContext';
import UserCard from './UserCard';
import MeetupsFeed from './MeetupsFeed';
import { Search, Map as MapIcon, List, Users, Compass, MapPin, Sparkles, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001/api'
  : 'https://nearby-meetup.onrender.com/api';

const INTEREST_OPTIONS = ['Coffee', 'Design', 'Music', 'Gaming', 'Food', 'Movies', 'Sports', 'Art'];

const Dashboard = () => {
  const { cityUsers, currentUser, location, posts, cityName, theme, requests, respondToRequest } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [feedMode, setFeedMode] = useState('people'); // 'people' or 'meetups'
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedUserForPosts, setSelectedUserForPosts] = useState(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  
  // AI Search states
  const [isAiSearch, setIsAiSearch] = useState(false);
  const [aiMatchedInterests, setAiMatchedInterests] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();
  const searchTimerRef = useRef(null);

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  useEffect(() => {
    if (!isAiSearch || !searchQuery.trim()) {
      setAiMatchedInterests([]);
      return;
    }

    setIsSearching(true);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/ai/semantic-search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('vibecheck_token')}`
          },
          body: JSON.stringify({ query: searchQuery })
        });
        const data = await res.json();
        setAiMatchedInterests(data.matchedInterests || []);
      } catch (err) {
        console.error('Semantic search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, isAiSearch]);

  if (!currentUser) return null;

  const filteredUsers = cityUsers.filter(user => {
    if (user.id === currentUser.id) return false;
    
    if (isAiSearch && searchQuery.trim()) {
      if (aiMatchedInterests.length === 0) return false;
      return user.interests && user.interests.some(i => aiMatchedInterests.includes(i));
    }

    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesInterests = selectedInterests.length === 0 || 
                            (user.interests && user.interests.some(i => selectedInterests.includes(i)));
                            
    return searchQuery.trim() ? matchesSearch : (matchesSearch && matchesInterests);
  });

  const selectedUserPosts = selectedUserForPosts 
    ? posts.filter(p => p.authorId === selectedUserForPosts.id && !p.isArchived)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) 
    : [];

  return (
    <div style={{ paddingTop: '1rem', paddingBottom: '120px' }}>
      {/* Top Search Bar - dark mode aware */}
      <div className="page-sticky-header" style={{ padding: '0.75rem 1rem 0' }}>

        {/* City Name Header */}
        {cityName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <MapPin size={13} color="var(--accent-color)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>
              {cityName}
            </span>
          </div>
        )}

        {/* Main Feed Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', background: 'var(--surface-color)', padding: '0.25rem', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
          <button 
            onClick={() => setFeedMode('people')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', background: feedMode === 'people' ? 'var(--primary-color)' : 'transparent', color: feedMode === 'people' ? 'var(--bg-color)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s ease' }}
          >
            <Users size={15} /> People
          </button>
          <button 
            onClick={() => setFeedMode('meetups')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', background: feedMode === 'meetups' ? 'var(--primary-color)' : 'transparent', color: feedMode === 'meetups' ? 'var(--bg-color)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s ease' }}
          >
            <Compass size={15} /> Meetups
          </button>
        </div>

        {feedMode === 'people' && (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder={isAiSearch ? "Ask AI (e.g. coffee design, coding...)" : "Search people..."} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.75rem', paddingRight: '5.2rem', width: '100%' }}
                />
                <button 
                  onClick={() => {
                    setIsAiSearch(!isAiSearch);
                    setSearchQuery('');
                  }}
                  type="button"
                  style={{ 
                    position: 'absolute', 
                    right: '0.4rem', 
                    background: isAiSearch ? 'var(--primary-color)' : 'rgba(120, 120, 120, 0.15)',
                    color: isAiSearch ? 'var(--bg-color)' : 'var(--text-secondary)',
                    border: 'none', 
                    borderRadius: '8px', 
                    padding: '0.35rem 0.55rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                  }}
                >
                  <Sparkles size={11} /> {isAiSearch ? 'AI Active' : 'AI'}
                </button>
              </div>
              {/* Notification Bell */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => setShowNotifPanel(v => !v)}
                  className="btn btn-glass"
                  style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', color: showNotifPanel ? 'var(--accent-color)' : 'var(--text-secondary)' }}
                >
                  <Bell size={18} />
                  {(() => {
                    const pendingCount = requests.filter(r => r.to?.id === currentUser.id && r.status === 'pending' && !r.activity?.startsWith('Join Meetup:')).length;
                    return pendingCount > 0 ? (
                      <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderRadius: '50%', background: '#ff3b30', border: '1.5px solid var(--bg-color)' }} />
                    ) : null;
                  })()}
                </button>
              </div>
              <button onClick={() => navigate('/profile')} className="btn btn-glass" style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%', flexShrink: 0 }}>
                <img src={currentUser.avatar} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', background: 'var(--surface-color)', borderRadius: '999px', padding: '2px', marginRight: '0.5rem', border: '1px solid var(--surface-border)', flexShrink: 0 }}>
                <button 
                  onClick={() => setViewMode('list')}
                  style={{ background: viewMode === 'list' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'list' ? 'var(--bg-color)' : 'var(--text-primary)', border: 'none', borderRadius: '999px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.2s' }}
                >
                  <List size={14} />
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  style={{ background: viewMode === 'map' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'map' ? 'var(--bg-color)' : 'var(--text-primary)', border: 'none', borderRadius: '999px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.2s' }}
                >
                  <MapIcon size={14} />
                </button>
              </div>
              
              {INTEREST_OPTIONS.map(interest => (
                <button 
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  style={{
                    padding: '0.3rem 0.9rem',
                    borderRadius: '999px',
                    border: '1px solid var(--surface-border)',
                    background: selectedInterests.includes(interest) 
                      ? (theme === 'dark' ? '#ffffff' : '#000000') 
                      : 'var(--surface-color)',
                    color: selectedInterests.includes(interest) 
                      ? (theme === 'dark' ? '#000000' : '#ffffff') 
                      : 'var(--text-primary)',
                    borderColor: selectedInterests.includes(interest)
                      ? (theme === 'dark' ? '#ffffff' : '#000000')
                      : 'var(--surface-border)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    fontWeight: 500
                  }}
                >
                  {interest}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '1rem' }}>
        {feedMode === 'meetups' ? (
          <MeetupsFeed />
        ) : viewMode === 'map' ? (
          <div style={{ height: 'calc(100vh - 280px)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
            <MapContainer center={[location?.lat || 28.6139, location?.lng || 77.2090]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {location && (
                <Marker position={[location.lat, location.lng]}>
                  <Popup>📍 You are here{cityName ? ` — ${cityName}` : ''}</Popup>
                </Marker>
              )}
              {filteredUsers.map(user => (
                user.location && (
                  <Marker key={user.id} position={[user.location.lat, user.location.lng]}>
                    <Popup>
                      <div style={{ textAlign: 'center' }}>
                        <img src={user.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt={user.name} />
                        <h4 style={{ margin: '0.5rem 0 0 0' }}>{user.name}</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{user.interests?.[0]}</p>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        ) : (
          <AnimatePresence>
            {filteredUsers.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}
              >
                <Users size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                <h3 style={{ marginBottom: '0.5rem' }}>No one found</h3>
                <p style={{ fontSize: '0.9rem' }}>Try adjusting your search or filters.</p>
              </motion.div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} style={{ marginBottom: '1rem' }}>
                  <UserCard user={user} onOpenPosts={setSelectedUserForPosts} />
                </div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>

      {/* User Posts Modal */}
      {selectedUserForPosts && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--sticky-bg)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', zIndex: 99999, overflowY: 'auto', padding: '1rem', paddingBottom: '120px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface-color)', borderRadius: '24px', border: '1px solid var(--surface-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={selectedUserForPosts.avatar} alt={selectedUserForPosts.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedUserForPosts.name}'s Posts</h2>
            </div>
            <button 
              onClick={() => setSelectedUserForPosts(null)} 
              className="btn btn-glass" 
              style={{ color: 'var(--text-primary)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              Close
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedUserPosts.length > 0 ? (
              selectedUserPosts.map(post => (
                <div key={post.id} className="glass-panel" style={{ padding: '1rem' }}>
                  {post.text && <p style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>{post.text}</p>}
                  {post.image && (
                    <img 
                      src={post.image} 
                      alt="Post" 
                      style={{ width: '100%', borderRadius: '16px', maxHeight: post.imageRatio === 'auto' || !post.imageRatio ? '400px' : 'none', aspectRatio: post.imageRatio || 'auto', objectFit: post.imageRatio === 'auto' || !post.imageRatio ? 'contain' : 'cover' }} 
                    />
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                    {new Date(post.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                <p>No posts yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Panel */}
      {showNotifPanel && (() => {
        const pendingReqs = requests.filter(r => r.to?.id === currentUser.id && r.status === 'pending' && !r.activity?.startsWith('Join Meetup:'));
        return (
          <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998 }}
            onClick={() => setShowNotifPanel(false)}
          >
            <div
              style={{ position: 'absolute', top: 0, right: 0, left: 0, background: 'var(--bg-color)', borderBottom: '1px solid var(--surface-border)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', maxWidth: '480px', margin: '0 auto', paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: '0 1rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Requests</h3>
                <button onClick={() => setShowNotifPanel(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem' }}>Done</button>
              </div>
              {pendingReqs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No pending requests</div>
              ) : (
                <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingBottom: '1rem' }}>
                  {pendingReqs.map(req => {
                    const fromUser = req.from || { name: 'Unknown', avatar: '/default-avatar.svg' };
                    return (
                      <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--surface-border)' }}>
                        <img src={fromUser.avatar} alt={fromUser.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fromUser.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.activity}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                          <button
                            onClick={() => { respondToRequest(req.id, 'accepted'); setShowNotifPanel(false); setTimeout(() => navigate(`/chat/${req.id}`), 150); }}
                            style={{ background: '#007AFF', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                          >Accept</button>
                          <button
                            onClick={() => respondToRequest(req.id, 'declined')}
                            style={{ background: 'var(--surface-color)', color: 'var(--text-secondary)', border: '1px solid var(--surface-border)', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                          >Decline</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
