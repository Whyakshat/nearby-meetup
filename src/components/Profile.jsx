import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { 
  Settings as SettingsIcon, 
  Edit2, 
  Camera, 
  Trash2, 
  Archive, 
  ArrowLeft, 
  Grid, 
  MessageCircle, 
  UserPlus, 
  UserCheck, 
  Clock, 
  LogOut,
  X,
  Sparkles,
  Lock
} from 'lucide-react';
import Settings from './Settings';
import { AnimatePresence, motion } from 'framer-motion';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001/api'
  : 'https://nearby-meetup.onrender.com/api';

const INTEREST_OPTIONS = ['Coffee', 'Design', 'Music', 'Gaming', 'Food', 'Movies', 'Sports', 'Art', 'Tech', 'Fashion'];

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    currentUser, 
    registeredUsers, 
    updateProfile, 
    posts, 
    deletePost, 
    archivePost, 
    unarchivePost,
    logout, 
    requests, 
    meetups, 
    sendRequest, 
    respondToRequest,
    theme,
    addNotification
  } = useAppContext();
  if (!currentUser) return null;

  const isPublicView = id && id !== currentUser.id;
  const profileUser = isPublicView ? registeredUsers.find(u => u.id === id) : currentUser;

  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'archived'
  const [selectedPost, setSelectedPost] = useState(null); // For post detail modal
  
  const [name, setName] = useState(profileUser?.name || '');
  const [username, setUsername] = useState(profileUser?.username || (profileUser?.email ? profileUser.email.split('@')[0] : ''));
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [usernameError, setUsernameError] = useState('');
  const [bio, setBio] = useState(profileUser?.bio || '');
  const [interests, setInterests] = useState(profileUser?.interests || []);
  const [avatarUrl, setAvatarUrl] = useState(profileUser?.avatar || '');

  const [vibeScore, setVibeScore] = useState(null);
  const [vibeInsight, setVibeInsight] = useState('');
  const [loadingVibe, setLoadingVibe] = useState(false);
  const [suggestingBio, setSuggestingBio] = useState(false);

  const fileInputRef = useRef(null);
  const prevUsernameRef = useRef(profileUser?.username || '');
  const checkTimerRef = useRef(null);

  useEffect(() => {
    if (!isPublicView || !profileUser?.id) return;
    
    const fetchVibeScore = async () => {
      setLoadingVibe(true);
      try {
        const res = await fetch(`${API_URL}/ai/match-score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('vibecheck_token')}`
          },
          body: JSON.stringify({ targetUserId: profileUser.id })
        });
        const data = await res.json();
        setVibeScore(data.score);
        setVibeInsight(data.insight);
      } catch (err) {
        console.error('Failed to fetch vibe score', err);
      } finally {
        setLoadingVibe(false);
      }
    };

    fetchVibeScore();
  }, [profileUser?.id, isPublicView]);

  const handleUsernameChange = (val) => {
    const cleanVal = val.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
    setUsername(cleanVal);
    
    if (cleanVal.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setUsernameAvailable(false);
      return;
    }

    setUsernameError('');
    
    if (cleanVal === prevUsernameRef.current) {
      setUsernameAvailable(true);
      return;
    }

    setIsCheckingUsername(true);

    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current);
    }

    checkTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/users/check-username/${cleanVal}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('vibecheck_token')}`
          }
        });
        const data = await res.json();
        setUsernameAvailable(data.available);
        if (!data.available) {
          setUsernameError(data.message || 'Username is already taken');
        }
      } catch (err) {
        console.error('Error checking username', err);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);
  };

  const handleSave = () => {
    if (!usernameAvailable) return;
    updateProfile({ name, username, bio, interests, avatar: avatarUrl });
    setIsEditing(false);
    prevUsernameRef.current = username;
  };

  const handleSuggestBio = async () => {
    setSuggestingBio(true);
    try {
      const res = await fetch(`${API_URL}/ai/generate-bio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vibecheck_token')}`
        },
        body: JSON.stringify({ name, interests, style: 'casual' })
      });
      const data = await res.json();
      if (data.bio) {
        setBio(data.bio);
      }
    } catch (err) {
      console.error('Failed to suggest bio', err);
    } finally {
      setSuggestingBio(false);
    }
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        callback(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, (compressedBase64) => {
        setter(compressedBase64);
      });
    }
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${profileUser.id}`;
    navigator.clipboard.writeText(profileUrl)
      .then(() => {
        if (addNotification) {
          addNotification('Profile link copied to clipboard!');
        } else {
          alert('Link copied to clipboard!');
        }
      })
      .catch(() => {});
  };

  if (!profileUser) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>User not found</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  // Stats calculation
  const myPosts = posts.filter(p => p.authorId === profileUser.id && !p.isArchived).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const myArchivedPosts = posts.filter(p => p.authorId === profileUser.id && p.isArchived).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const myMeetupsCount = meetups.filter(m => m.authorId === profileUser.id).length;
  const myConnectionsCount = requests.filter(r => r.status === 'accepted' && (r.fromId === profileUser.id || r.toId === profileUser.id)).length;

  // Connection Request between currentUser and profileUser
  const connectionRequest = requests.find(r => 
    (r.fromId === currentUser.id && r.toId === profileUser.id) ||
    (r.fromId === profileUser.id && r.toId === currentUser.id)
  );

  const isConnected = connectionRequest && connectionRequest.status === 'accepted';
  const isLocked = isPublicView && profileUser.isPrivate && !isConnected;
  const hasStories = myPosts.length > 0 && !isLocked;

  return (
        <div style={{ paddingBottom: '120px', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
          {/* Header Toolbar */}
          <div className="page-sticky-header" style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isPublicView && (
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>
                  <ArrowLeft size={22} />
                </button>
              )}
              <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                {profileUser.username ? `@${profileUser.username}` : (profileUser.email ? profileUser.email.split('@')[0] : 'profile')}
              </span>
            </div>
            {!isPublicView && (
              <button 
                onClick={() => setShowSettings(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem' }}
              >
                <SettingsIcon size={22} />
              </button>
            )}
          </div>

          <div style={{ padding: '1rem' }}>
            {/* Instagram Profile Header Info Grid */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', marginBottom: '1.25rem', marginTop: '0.5rem' }}>
              {/* Avatar on Left */}
              <div style={{ 
                position: 'relative', 
                flexShrink: 0,
                borderRadius: '50%',
                padding: hasStories ? '3px' : '0',
                background: hasStories ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' : 'transparent',
                boxShadow: hasStories ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'
              }}>
                <img 
                  src={isEditing ? (avatarUrl || profileUser.avatar) : profileUser.avatar} 
                  alt={profileUser.name} 
                  style={{ 
                    width: '76px', 
                    height: '76px', 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    border: hasStories ? '3px solid var(--bg-color)' : '1px solid var(--surface-border)', 
                    background: 'var(--surface-color)',
                    display: 'block'
                  }}
                />
            {isEditing && !isPublicView && (
              <>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'var(--text-primary)', color: 'var(--bg-color)', borderRadius: '50%', padding: '0.45rem', display: 'flex', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', zIndex: 5 }}
                >
                  <Camera size={11} />
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleImageUpload(e, setAvatarUrl)}
                />
              </>
            )}
          </div>

          {/* Stats on Right */}
          <div style={{ display: 'flex', flex: 1, justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{myPosts.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '0.15rem' }}>posts</div>
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{myMeetupsCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '0.15rem' }}>meetups</div>
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{myConnectionsCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '0.15rem' }}>connections</div>
            </div>
          </div>
        </div>

        {/* Bio Text area */}
        <div style={{ marginBottom: '1.5rem' }}>
          {isEditing && !isPublicView ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.88rem', borderRadius: '8px' }}
                  placeholder="e.g. akshat_ojha"
                />
                {username && (
                  <div style={{ fontSize: '0.75rem', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                    {isCheckingUsername ? (
                      <span style={{ color: 'var(--text-secondary)' }}>Checking availability...</span>
                    ) : usernameAvailable ? (
                      <span style={{ color: '#34A853' }}>Username is available</span>
                    ) : (
                      <span style={{ color: 'var(--danger-color)' }}>{usernameError || 'Username is already taken'}</span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Display Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '0.55rem 0.8rem', fontSize: '0.88rem', borderRadius: '8px' }}
                  placeholder="Enter name"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Bio</label>
                  <button 
                    type="button" 
                    onClick={handleSuggestBio}
                    disabled={suggestingBio}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0 }}
                  >
                    <Sparkles size={12} /> {suggestingBio ? 'Generating...' : 'AI Suggest Bio'}
                  </button>
                </div>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', minHeight: '70px', resize: 'vertical', fontSize: '0.88rem', padding: '0.55rem 0.8rem', borderRadius: '8px' }}
                  placeholder="Write a bio..."
                />
              </div>
            </div>
          ) : (
            <>
              <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>{profileUser.name}</h4>
              {profileUser.username && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                  @{profileUser.username}
                </div>
              )}
              {profileUser.gender && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', padding: '0.15rem 0.5rem', borderRadius: '999px', display: 'inline-block', marginBottom: '0.6rem', fontWeight: 500 }}>
                  {profileUser.gender}
                </span>
              )}
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.88rem', lineHeight: 1.5, opacity: 0.9, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                {profileUser.bio || "No bio yet."}
              </p>
              
              {isPublicView && vibeScore !== null && (
                <div style={{ 
                  padding: '1rem', 
                  borderRadius: '16px', 
                  marginTop: '0.75rem', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)', 
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.4rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.3rem', letterSpacing: '0.5px' }}>
                      <Sparkles size={13} /> AI VIBE MATCH
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-color)' }}>
                      {vibeScore}% Match
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {vibeInsight}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Interests Section */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {isEditing && !isPublicView ? (
              INTEREST_OPTIONS.map(interest => (
                <button 
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px',
                    border: '1.5px solid var(--surface-border)',
                    background: interests.includes(interest) ? (theme === 'dark' ? '#ffffff' : '#000000') : 'var(--surface-color)',
                    color: interests.includes(interest) ? (theme === 'dark' ? '#000000' : '#ffffff') : 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {interest}
                </button>
              ))
            ) : (
              profileUser.interests && profileUser.interests.length > 0 ? (
                profileUser.interests.map(interest => (
                  <span 
                    key={interest} 
                    style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      background: 'var(--surface-color)', 
                      border: '1px solid var(--surface-border)',
                      color: 'var(--text-primary)',
                      fontWeight: 500
                    }}
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>No interests added.</span>
              )
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {!isPublicView ? (
            isEditing ? (
              <>
                <button 
                  onClick={handleSave}
                  disabled={isCheckingUsername || !usernameAvailable}
                  className="btn btn-primary"
                  style={{ 
                    flex: 1, 
                    padding: '0.55rem', 
                    borderRadius: '10px', 
                    fontSize: '0.88rem', 
                    fontWeight: 600,
                    opacity: (isCheckingUsername || !usernameAvailable) ? 0.55 : 1,
                    cursor: (isCheckingUsername || !usernameAvailable) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => {
                    setName(profileUser.name || '');
                    setUsername(profileUser.username || '');
                    setBio(profileUser.bio || '');
                    setInterests(profileUser.interests || []);
                    setAvatarUrl(profileUser.avatar || '');
                    setIsEditing(false);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.55rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600 }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  style={{ 
                    flex: 1, 
                    padding: '0.6rem', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    border: '1px solid var(--surface-border)',
                    background: 'var(--surface-color)', 
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-color)'}
                >
                  Edit Profile
                </button>
                <button 
                  onClick={handleShareProfile}
                  style={{ 
                    flex: 1, 
                    padding: '0.6rem', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    border: '1px solid var(--surface-border)',
                    background: 'var(--surface-color)', 
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-color)'}
                >
                  Share Profile
                </button>
              </>
            )
          ) : (
            <>
              {/* Public View Connections Actions */}
              {!connectionRequest ? (
                <button 
                  onClick={() => sendRequest(profileUser, 'Connection Request')}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.55rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <UserPlus size={16} /> Connect
                </button>
              ) : connectionRequest.status === 'pending' ? (
                connectionRequest.fromId === currentUser.id ? (
                  <button 
                    disabled
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.55rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, opacity: 0.7 }}
                  >
                    Requested
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                    <button 
                      onClick={() => respondToRequest(connectionRequest.id, 'accepted')}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.55rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600 }}
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => respondToRequest(connectionRequest.id, 'declined')}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.55rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600 }}
                    >
                      Decline
                    </button>
                  </div>
                )
              ) : connectionRequest.status === 'accepted' ? (
                <>
                  <button 
                    onClick={() => navigate(`/chat/${connectionRequest.id}`)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.55rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <MessageCircle size={16} /> Message
                  </button>
                  <button 
                    disabled
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.55rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', border: '1px solid var(--surface-border)' }}
                  >
                    <UserCheck size={16} /> Connected
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => sendRequest(profileUser, 'Connection Request')}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.55rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600 }}
                >
                  Connect Again
                </button>
              )}
            </>
          )}
        </div>

        {isLocked ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 1.5rem', 
            borderTop: '1px solid var(--surface-border)',
            marginTop: '1.5rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '1.1rem',
              borderRadius: '50%',
              background: 'var(--surface-color)',
              border: '1px solid var(--surface-border)',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <Lock size={30} style={{ color: 'var(--text-primary)' }} />
            </div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem', fontSize: '1.1rem', fontWeight: 600 }}>This Account is Private</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, maxWidth: '260px', opacity: 0.8 }}>
              Connect with this user to view their posts and meetups.
            </p>
          </div>
        ) : (
          <>
            {/* Tab Selection (Grid vs Archive) */}
            <div style={{ display: 'flex', borderTop: '1px solid var(--surface-border)', borderBottom: '1px solid var(--surface-border)', marginBottom: '0.5rem' }}>
              <button 
                onClick={() => setActiveTab('posts')}
                style={{ 
                  flex: 1, 
                  background: 'none', 
                  border: 'none', 
                  padding: '0.75rem 0', 
                  color: activeTab === 'posts' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'posts' ? '2px solid var(--text-primary)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  fontWeight: activeTab === 'posts' ? 600 : 400
                }}
              >
                <Grid size={16} />
                <span style={{ fontSize: '0.85rem' }}>Posts</span>
              </button>
              
              {!isPublicView && (
                <button 
                  onClick={() => setActiveTab('archived')}
                  style={{ 
                    flex: 1, 
                    background: 'none', 
                    border: 'none', 
                    padding: '0.75rem 0', 
                    color: activeTab === 'archived' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderBottom: activeTab === 'archived' ? '2px solid var(--text-primary)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    fontWeight: activeTab === 'archived' ? 600 : 400
                  }}
                >
                  <Archive size={16} />
                  <span style={{ fontSize: '0.85rem' }}>Archived</span>
                </button>
              )}
            </div>

            {/* Instagram Grid of Posts */}
            {activeTab === 'posts' ? (
              myPosts.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                  {myPosts.map(post => (
                    <div 
                      key={post.id} 
                      onClick={() => setSelectedPost(post)}
                      style={{ 
                        position: 'relative', 
                        width: '100%', 
                        aspectRatio: '1 / 1', 
                        background: 'var(--surface-color)', 
                        borderRadius: '4px',
                        overflow: 'hidden', 
                        cursor: 'pointer',
                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
                      }}
                    >
                      {post.image ? (
                        <img 
                          src={post.image} 
                          alt="Post" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          padding: '0.5rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          textAlign: 'center', 
                          background: 'linear-gradient(135deg, var(--surface-color) 0%, rgba(0, 0, 0, 0.03) 100%)',
                          fontSize: '0.72rem', 
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 500,
                          opacity: 0.85
                        }}>
                          {post.text && post.text.length > 35 ? `${post.text.slice(0, 35)}...` : post.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
                  <Grid size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>No posts yet.</p>
                </div>
              )
            ) : (
              myArchivedPosts.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                  {myArchivedPosts.map(post => (
                    <div 
                      key={post.id} 
                      onClick={() => setSelectedPost(post)}
                      style={{ 
                        position: 'relative', 
                        width: '100%', 
                        aspectRatio: '1 / 1', 
                        background: 'var(--surface-color)', 
                        borderRadius: '4px',
                        overflow: 'hidden', 
                        cursor: 'pointer'
                      }}
                    >
                      {post.image ? (
                        <img 
                          src={post.image} 
                          alt="Post" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
                        />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          padding: '0.5rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          textAlign: 'center', 
                          background: 'var(--surface-color)', 
                          fontSize: '0.72rem', 
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 500,
                          opacity: 0.7
                        }}>
                          {post.text && post.text.length > 35 ? `${post.text.slice(0, 35)}...` : post.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
                  <Archive size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>No archived posts.</p>
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{ 
                width: '100%', 
                maxWidth: '450px', 
                background: 'var(--surface-color)', 
                borderRadius: '24px', 
                border: '1px solid var(--surface-border)',
                overflow: 'hidden',
                zIndex: 11001,
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <img src={profileUser.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>{profileUser.name}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                      <Clock size={10} />
                      {new Date(selectedPost.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', padding: '0.2rem' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.25rem' }}>
                {selectedPost.text && (
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {selectedPost.text}
                  </p>
                )}
                {selectedPost.image && (
                  <img 
                    src={selectedPost.image} 
                    alt="Post Detail" 
                    style={{ 
                      width: '100%', 
                      borderRadius: '12px', 
                      border: '1px solid var(--surface-border)',
                      maxHeight: selectedPost.imageRatio === 'auto' || !selectedPost.imageRatio ? '350px' : 'none', 
                      aspectRatio: selectedPost.imageRatio || 'auto', 
                      objectFit: selectedPost.imageRatio === 'auto' || !selectedPost.imageRatio ? 'contain' : 'cover'
                    }} 
                  />
                )}
              </div>

              {/* Footer Actions (Only for personal posts) */}
              {!isPublicView && (
                <div style={{ display: 'flex', borderTop: '1px solid var(--surface-border)', padding: '0.85rem' }}>
                  <button 
                    onClick={() => {
                      if (selectedPost.isArchived) {
                        unarchivePost(selectedPost.id);
                      } else {
                        archivePost(selectedPost.id);
                      }
                      setSelectedPost(null);
                    }}
                    style={{ 
                      flex: 1, 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--text-primary)', 
                      fontSize: '0.85rem', 
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem'
                    }}
                  >
                    <Archive size={16} />
                    {selectedPost.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button 
                    onClick={() => {
                      deletePost(selectedPost.id);
                      setSelectedPost(null);
                    }}
                    style={{ 
                      flex: 1, 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--danger-color)', 
                      fontSize: '0.85rem', 
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem'
                    }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <Settings onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
