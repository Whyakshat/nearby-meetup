import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import UserCard from './UserCard';
import MeetupsFeed from './MeetupsFeed';
import { Search, Map as MapIcon, List, Users, Compass } from 'lucide-react';
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

const INTEREST_OPTIONS = ['Coffee', 'Design', 'Music', 'Gaming', 'Food', 'Movies', 'Sports', 'Art'];

const Dashboard = () => {
  const { cityUsers, currentUser, location, posts } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [feedMode, setFeedMode] = useState('people'); // 'people' or 'meetups'
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedUserForPosts, setSelectedUserForPosts] = useState(null);
  const navigate = useNavigate();

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const filteredUsers = cityUsers.filter(user => {
    if (user.id === currentUser.id) return false;
    
    // Name/Email search
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Interest filter
    const matchesInterests = selectedInterests.length === 0 || 
                            (user.interests && user.interests.some(i => selectedInterests.includes(i)));
                            
    // If user is actively searching by text, ignore the interest filter
    return searchQuery.trim() ? matchesSearch : (matchesSearch && matchesInterests);
  });

  const selectedUserPosts = selectedUserForPosts ? posts.filter(p => p.authorId === selectedUserForPosts.id && !p.isArchived).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) : [];

  return (
    <div style={{ paddingTop: '1rem', paddingBottom: '120px' }}>
      {/* Top Search Bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: '1rem', background: 'rgba(255, 255, 255, 0.95)' }}>
        {/* Main Feed Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '12px' }}>
          <button 
            onClick={() => setFeedMode('people')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', background: feedMode === 'people' ? 'var(--surface-color)' : 'transparent', color: feedMode === 'people' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Users size={16} /> People
          </button>
          <button 
            onClick={() => setFeedMode('meetups')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px', background: feedMode === 'meetups' ? 'var(--surface-color)' : 'transparent', color: feedMode === 'meetups' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Compass size={16} /> Meetups
          </button>
        </div>

        {feedMode === 'people' && (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search people..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.75rem', paddingRight: '1rem', background: 'rgba(255,255,255,0.1)' }}
            />
          </div>
          <button onClick={() => navigate('/profile')} className="btn btn-glass" style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%' }}>
            <img src={currentUser.avatar} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div style={{ display: 'flex', background: 'var(--surface-color)', borderRadius: '999px', padding: '2px', marginRight: '0.5rem' }}>
            <button 
              onClick={() => setViewMode('list')}
              style={{ background: viewMode === 'list' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'list' ? 'var(--bg-color)' : 'var(--text-primary)', border: 'none', borderRadius: '999px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <List size={14} />
            </button>
            <button 
              onClick={() => setViewMode('map')}
              style={{ background: viewMode === 'map' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'map' ? 'var(--bg-color)' : 'var(--text-primary)', border: 'none', borderRadius: '999px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <MapIcon size={14} />
            </button>
          </div>
          
          {INTEREST_OPTIONS.map(interest => (
            <button 
              key={interest}
              onClick={() => toggleInterest(interest)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid var(--surface-border)',
                background: selectedInterests.includes(interest) ? 'var(--accent-gradient)' : 'var(--surface-color)',
                color: selectedInterests.includes(interest) ? 'white' : 'var(--text-primary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
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
          <div style={{ height: 'calc(100vh - 250px)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
            <MapContainer center={[location?.lat || 40.7128, location?.lng || -74.0060]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {location && (
                <Marker position={[location.lat, location.lng]}>
                  <Popup>You are here</Popup>
                </Marker>
              )}
              {filteredUsers.map(user => (
                user.location && (
                  <Marker key={user.id} position={[user.location.lat, user.location.lng]}>
                    <Popup>
                      <div style={{ textAlign: 'center' }}>
                        <img src={user.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
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
                <Users size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <h3>No one found</h3>
                <p>Try adjusting your search or filters.</p>
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

      {/* Lifted Modal for viewing Posts */}
      {selectedUserForPosts && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)', zIndex: 99999, overflowY: 'auto', padding: '1rem', paddingBottom: '120px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem', background: 'var(--surface-color)', borderRadius: '24px', border: '1px solid var(--surface-border)' }}>
            <h2 style={{ margin: 0 }}>{selectedUserForPosts.name}'s Profile</h2>
            <button onClick={() => setSelectedUserForPosts(null)} className="btn btn-glass" style={{ color: 'var(--text-primary)', border: '1px solid var(--surface-border)', padding: '0.5rem 1rem' }}>Close</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedUserPosts.length > 0 ? (
              selectedUserPosts.map(post => (
                <div key={post.id} className="glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                  <p style={{ margin: '0 0 0.5rem 0' }}>{post.text}</p>
                  {post.image && (
                    <img src={post.image} alt="Post" style={{ width: '100%', borderRadius: '12px', maxHeight: post.imageRatio === 'auto' || !post.imageRatio ? '400px' : 'none', aspectRatio: post.imageRatio || 'auto', objectFit: post.imageRatio === 'auto' || !post.imageRatio ? 'contain' : 'cover' }} />
                  )}
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.5rem' }}>
                    {new Date(post.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>No posts yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
