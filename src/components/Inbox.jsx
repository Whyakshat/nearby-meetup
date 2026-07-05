import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { Search, ChevronRight, MessageSquare, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const Inbox = () => {
  const { requests, currentUser, respondToRequest, registeredUsers, messages } = useAppContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) return null;

  const getFreshUser = (userId) => {
    return registeredUsers.find(u => u.id === userId) || { name: 'Unknown User', avatar: '/default-avatar.svg', username: '' };
  };

  const unifiedMessages = requests
    .filter(r => r.to?.id === currentUser.id || r.from?.id === currentUser.id)
    .map(req => {
      const isReceived = req.to?.id === currentUser.id;
      const otherUser = getFreshUser(isReceived ? req.from?.id : req.to?.id);
      
      const reqMessages = messages.filter(m => m.requestId === req.id);
      const lastMsg = reqMessages.length > 0 ? reqMessages[reqMessages.length - 1] : null;
      const sortTime = lastMsg ? new Date(lastMsg.timestamp) : new Date(req.createdAt || req.timestamp || Date.now());
      
      return { 
        ...req, 
        isReceived, 
        otherUser, 
        lastMsg, 
        sortTime 
      };
    })
    .filter(msg => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      const lastMsgText = msg.lastMsg ? msg.lastMsg.content.toLowerCase() : '';
      return (
        msg.otherUser.name.toLowerCase().includes(query) ||
        (msg.otherUser.username && msg.otherUser.username.toLowerCase().includes(query)) ||
        msg.activity.toLowerCase().includes(query) ||
        lastMsgText.includes(query)
      );
    })
    .sort((a, b) => b.sortTime - a.sortTime);

  const pendingCount = requests.filter(r => r.to?.id === currentUser.id && r.status === 'pending').length;

  const formatIOSTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    
    // Yesterday check
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (isToday) {
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (isYesterday) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString(undefined, { weekday: 'long' });
    } else {
      return date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' });
    }
  };

  return (
    <div style={{ paddingBottom: '120px', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      {/* iOS Large Header */}
      <div style={{ padding: '2rem 1.25rem 0.5rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Messages</h1>
          {pendingCount > 0 && (
            <span style={{ 
              background: '#007AFF', // Apple Blue
              color: 'white', 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              padding: '0.2rem 0.6rem', 
              borderRadius: '999px',
              letterSpacing: '-0.01em'
            }}>
              {pendingCount} unread
            </span>
          )}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--surface-color)',
              border: 'none',
              borderRadius: '12px',
              padding: '0.65rem 0.65rem 0.65rem 2.25rem',
              fontSize: '1rem',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
        </div>
      </div>

      {/* Messages List */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {unifiedMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem', opacity: 0.2 }}>
              <MessageSquare size={56} />
            </div>
            <h3 style={{ margin: '0 0 0.4rem 0', fontWeight: 600, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>No Messages</h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Conversations and meetup requests will appear here.
            </p>
          </div>
        ) : (
          unifiedMessages.map((msg, index) => {
            const isUnread = msg.isReceived && msg.status === 'pending';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                onClick={() => {
                  if (msg.status === 'accepted' || msg.status === 'pending') navigate(`/chat/${msg.id}`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.85rem 1.25rem',
                  cursor: (msg.status === 'accepted' || msg.status === 'pending') ? 'pointer' : 'default',
                  background: 'transparent',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* iOS Unread Dot on Left */}
                <div style={{ width: '12px', display: 'flex', justifyContent: 'flex-start', flexShrink: 0 }}>
                  {isUnread && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#007AFF' }} />
                  )}
                </div>

                 {/* Avatar */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${msg.otherUser.id}`);
                  }}
                  style={{ position: 'relative', flexShrink: 0, marginRight: '0.85rem', cursor: 'pointer' }}
                >
                  <img
                    src={msg.otherUser.avatar}
                    alt={msg.otherUser.name}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--surface-border)'
                    }}
                  />
                </div>

                {/* Info and Message Body */}
                <div style={{ flex: 1, minWidth: 0, borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.85rem', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                    <span style={{ 
                      fontWeight: isUnread ? 700 : 600, 
                      fontSize: '0.98rem', 
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      maxWidth: '70%'
                    }}>
                      {msg.otherUser.name}
                    </span>
                    <span style={{ 
                      fontSize: '0.78rem', 
                      color: isUnread ? '#007AFF' : 'var(--text-secondary)', 
                      fontWeight: isUnread ? 600 : 400,
                      flexShrink: 0 
                    }}>
                      {formatIOSTime(msg.sortTime)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.88rem',
                      color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isUnread ? 500 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1
                    }}>
                      {msg.lastMsg ? (
                        msg.lastMsg.type === 'location_static' ? '📍 Shared Location' :
                        msg.lastMsg.type === 'location_live' ? '📍 Live Location' :
                        msg.lastMsg.content
                      ) : (
                        msg.isReceived ? (
                          msg.status === 'pending' ? `Requested: "${msg.activity}"` :
                          msg.status === 'accepted' ? `Connected on: ${msg.activity}` :
                          'Declined request'
                        ) : (
                          msg.status === 'pending' ? `Sent: "${msg.activity}"` :
                          msg.status === 'accepted' ? `Accepted connection request` :
                          'Declined request'
                        )
                      )}
                    </span>
                  </div>

                  {/* iOS Accept/Decline action block (Inline) */}
                  {msg.isReceived && msg.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => respondToRequest(msg.id, 'accepted')}
                        style={{
                          flex: 1,
                          background: '#007AFF', // Apple Blue
                          color: 'white',
                          border: 'none',
                          padding: '0.45rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.2rem',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0, 122, 255, 0.25)'
                        }}
                      >
                        <Check size={12} /> Accept
                      </button>
                      <button
                        onClick={() => respondToRequest(msg.id, 'declined')}
                        style={{
                          flex: 1,
                          background: 'var(--surface-color)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--surface-border)',
                          padding: '0.45rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={12} /> Decline
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Inbox;
