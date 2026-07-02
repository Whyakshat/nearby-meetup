import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Send, MoreHorizontal, ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';

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
    ((req.from.id === currentUser.id && req.to.id === user.id) || 
     (req.from.id === user.id && req.to.id === currentUser.id))
  );

  const isLocked = user.isPrivate && !isConnected;
  const userPosts = posts.filter(p => p.authorId === user.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Use their latest post image as background, otherwise use a blurred version of their avatar
  const bgImage = userPosts.find(p => p.image)?.image || user.avatar;

  return (
    <div className="full-card" onClick={() => !isLocked && onOpenPosts(user)} style={{ cursor: isLocked ? 'default' : 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
      
      {/* Background Image */}
      <img 
        src={bgImage} 
        alt={user.name} 
        className="full-card-bg" 
        style={{ 
          filter: isLocked || !userPosts.find(p => p.image) ? 'blur(20px) brightness(0.7)' : 'brightness(0.9)',
          transform: 'scale(1.1)' // prevent blurred edges from showing
        }} 
      />
      
      {/* Top Bar (Buddy Style) */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', right: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src={user.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', objectFit: 'cover' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'white' }}>
              {user.name.split(' ')[0]} <CheckCircle2 size={12} color="#3498db" fill="white" />
            </span>
            <span style={{ fontSize: '0.7rem', opacity: 0.9, color: 'white' }}>{user.bio ? user.bio.substring(0, 20) + '...' : 'New here'}</span>
          </div>
        </div>

        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setShowOptions(!showOptions)}
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <MoreHorizontal size={18} />
          </button>
          
          {showOptions && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', borderRadius: '12px', overflow: 'hidden', minWidth: '150px' }}>
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
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2, background: 'rgba(0,0,0,0.2)', color: 'white' }}>
          <Lock size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <p style={{ opacity: 0.9, fontSize: '1.1rem', textAlign: 'center', padding: '0 2rem' }}>Private Account.<br/>Send a request to connect!</p>
        </div>
      )}

      {/* Bottom Glass Action Bar */}
      <div className="glass-action-bar" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.3)' }} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSendRequest} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <input 
            type="text" 
            placeholder="Send an invite..." 
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              padding: '0 1rem', 
              color: 'white',
              outline: 'none',
              fontSize: '0.95rem'
            }}
          />
          <button 
            type="submit"
            disabled={!customMsg.trim()}
            style={{ background: 'rgba(255,255,255,0.9)', color: '#000', border: 'none', borderRadius: '999px', padding: '0.6rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            Request <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserCard;
