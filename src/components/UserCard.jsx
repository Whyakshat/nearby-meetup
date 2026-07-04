import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Send, MoreHorizontal, ShieldAlert, Lock, CheckCircle2, Eye } from 'lucide-react';

const UserCard = ({ user, onOpenPosts }) => {
  const { sendRequest, blockUser, requests, currentUser, posts } = useAppContext();
  const [customMsg, setCustomMsg] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const handleSendRequest = (e) => {
    e.preventDefault();
    if (customMsg.trim()) {
      sendRequest(user, customMsg.trim());
      setCustomMsg('');
    }
  };

  // Check if we are connected
  const isConnected = requests.some(req => 
    req.status === 'accepted' && 
    ((req.from?.id === currentUser.id && req.to?.id === user.id) || 
     (req.from?.id === user.id && req.to?.id === currentUser.id))
  );

  // Check if request already pending
  const hasPendingRequest = requests.some(req =>
    req.status === 'pending' &&
    ((req.from?.id === currentUser.id && req.to?.id === user.id) ||
     (req.from?.id === user.id && req.to?.id === currentUser.id))
  );

  const isLocked = user.isPrivate && !isConnected;
  const userPosts = posts.filter(p => p.authorId === user.id && !p.isArchived)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Use their latest post image as background, otherwise use their avatar
  const bgImage = userPosts.find(p => p.image)?.image || user.avatar;

  return (
    <div 
      className="full-card" 
      onClick={() => !isLocked && onOpenPosts(user)} 
      style={{ cursor: isLocked ? 'default' : 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      {/* Background Image */}
      <img 
        src={bgImage} 
        alt={user.name} 
        className="full-card-bg" 
        style={{ 
          filter: isLocked || !userPosts.find(p => p.image) ? 'blur(8px) brightness(0.6)' : 'brightness(0.85)',
          transform: 'scale(1.08)'
        }} 
      />

      {/* Gradient overlay for better text readability */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 40%, rgba(0,0,0,0.5) 100%)', zIndex: 1 }} />
      
      {/* Top Bar */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', right: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src={user.avatar} 
            style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.6)', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} 
            alt={user.name}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              {user?.name?.split(' ')[0] || 'Unknown'} 
              <CheckCircle2 size={13} color="#60a5fa" fill="white" />
            </span>
            <span style={{ fontSize: '0.72rem', opacity: 0.85, color: 'rgba(255,255,255,0.9)' }}>
              {user.bio ? user.bio.substring(0, 22) + (user.bio.length > 22 ? '...' : '') : 'New here ✨'}
            </span>
          </div>
        </div>

        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setShowOptions(!showOptions)}
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <MoreHorizontal size={18} />
          </button>
          
          {showOptions && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', borderRadius: '16px', overflow: 'hidden', minWidth: '160px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              <button 
                onClick={() => { blockUser(user.id); setShowOptions(false); }}
                style={{ width: '100%', padding: '1rem', background: 'none', border: 'none', color: '#ff4757', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
              >
                <ShieldAlert size={16} /> Block User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lock Overlay */}
      {isLocked && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <Lock size={40} style={{ opacity: 0.7, marginBottom: '0.75rem', color: 'white' }} />
          <p style={{ opacity: 0.9, fontSize: '1rem', textAlign: 'center', padding: '0 2.5rem', color: 'white', lineHeight: 1.5 }}>
            Private Account.<br/>Send a request to connect!
          </p>
        </div>
      )}

      {/* Interests badges in the middle */}
      {!isLocked && user.interests && user.interests.length > 0 && (
        <div style={{ position: 'absolute', bottom: '90px', left: '1.5rem', right: '1.5rem', zIndex: 2, display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {user.interests.slice(0, 3).map(interest => (
            <span key={interest} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', color: 'white', fontWeight: 500 }}>
              {interest}
            </span>
          ))}
          {!isLocked && userPosts.length > 0 && (
            <span style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Eye size={10} /> {userPosts.length} posts
            </span>
          )}
        </div>
      )}

      {/* Bottom Glass Action Bar */}
      <div 
        className="glass-action-bar" 
        style={{ padding: '0.5rem' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSendRequest} style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder={hasPendingRequest ? 'Request pending...' : 'Send an invite...'} 
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            disabled={hasPendingRequest}
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              padding: '0 1rem', 
              color: 'white',
              outline: 'none',
              fontSize: '0.9rem',
              caretColor: 'white',
              '::placeholder': { color: 'rgba(255,255,255,0.6)' }
            }}
          />
          <button 
            type="submit"
            disabled={!customMsg.trim() || hasPendingRequest}
            style={{ 
              background: hasPendingRequest ? 'rgba(255,255,255,0.2)' : 'var(--accent-gradient)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '999px', 
              padding: '0.6rem 1.25rem', 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              cursor: hasPendingRequest ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s',
              opacity: hasPendingRequest ? 0.7 : 1
            }}
          >
            {hasPendingRequest ? 'Pending' : <><Send size={13} /> Request</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserCard;
