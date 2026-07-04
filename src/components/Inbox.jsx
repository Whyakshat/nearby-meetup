import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { MessageCircle, Check, X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const Inbox = () => {
  const { requests, currentUser, respondToRequest, registeredUsers } = useAppContext();
  const navigate = useNavigate();

  const getFreshUser = (userId) => {
    return registeredUsers.find(u => u.id === userId) || { name: 'Unknown User', avatar: '/default-avatar.svg' };
  };

  const unifiedMessages = requests
    .filter(r => r.to?.id === currentUser.id || r.from?.id === currentUser.id)
    .map(req => {
      const isReceived = req.to?.id === currentUser.id;
      const otherUser = getFreshUser(isReceived ? req.from?.id : req.to?.id);
      return { ...req, isReceived, otherUser };
    })
    .sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));

  const pendingCount = unifiedMessages.filter(m => m.isReceived && m.status === 'pending').length;

  return (
    <div style={{ paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Header */}
      <div className="page-sticky-header" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>Inbox</h1>
          {pendingCount > 0 && (
            <span style={{ background: 'var(--accent-gradient)', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '999px' }}>
              {pendingCount} new
            </span>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {unifiedMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
            <MessageCircle size={52} style={{ opacity: 0.25, marginBottom: '1.25rem' }} />
            <h3 style={{ marginBottom: '0.5rem', fontWeight: 500 }}>No messages yet</h3>
            <p style={{ fontSize: '0.9rem' }}>Connect with people nearby to start chatting!</p>
          </div>
        ) : (
          unifiedMessages.map((msg, index) => {
            const isUnread = msg.isReceived && msg.status === 'pending';
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => {
                  if (msg.status === 'accepted') navigate(`/chat/${msg.id}`);
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.85rem', 
                  padding: '1rem 1.5rem', 
                  borderBottom: '1px solid var(--surface-border)',
                  cursor: msg.status === 'accepted' ? 'pointer' : 'default',
                  background: isUnread ? 'rgba(255, 118, 117, 0.04)' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                {/* Avatar */}
                <div 
                  style={{ position: 'relative', flexShrink: 0 }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/profile/${msg.otherUser.id}`); }}
                >
                  <img 
                    src={msg.otherUser.avatar} 
                    alt={msg.otherUser.name} 
                    style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid var(--surface-border)' }} 
                  />
                  {isUnread && (
                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: '13px', height: '13px', background: 'var(--accent-color)', borderRadius: '50%', border: '2px solid var(--bg-color)' }} />
                  )}
                </div>
                
                {/* Content */}
                <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: isUnread ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%' }}>
                      {msg.otherUser.name}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={10} />
                      {new Date(msg.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  {/* Status pill */}
                  <div style={{ marginBottom: isUnread ? '0.75rem' : 0 }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.85rem', 
                      color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      fontWeight: isUnread ? 600 : 400,
                      lineHeight: 1.4
                    }}>
                      {msg.isReceived ? (
                        msg.status === 'pending' ? `👋 ${msg.otherUser?.name?.split(' ')[0]}: "${msg.activity}"` :
                        msg.status === 'accepted' ? `✅ Connected · ${msg.activity}` :
                        `❌ Declined`
                      ) : (
                        msg.status === 'pending' ? `⏳ Sent: "${msg.activity}"` :
                        msg.status === 'accepted' ? `✅ ${msg.otherUser?.name?.split(' ')[0]} accepted!` :
                        `❌ ${msg.otherUser?.name?.split(' ')[0]} declined`
                      )}
                    </p>
                  </div>

                  {/* Accept/Decline buttons */}
                  {msg.isReceived && msg.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => respondToRequest(msg.id, 'accepted')}
                        style={{ flex: 1, background: 'var(--accent-gradient)', color: 'white', border: 'none', padding: '0.55rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', cursor: 'pointer' }}
                      >
                        <Check size={13} /> Accept
                      </button>
                      <button 
                        onClick={() => respondToRequest(msg.id, 'declined')}
                        style={{ flex: 1, background: 'var(--surface-color)', color: 'var(--text-secondary)', border: '1px solid var(--surface-border)', padding: '0.55rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', cursor: 'pointer' }}
                      >
                        <X size={13} /> Decline
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
