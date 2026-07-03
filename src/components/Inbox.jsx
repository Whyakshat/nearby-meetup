import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { MessageCircle, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const Inbox = () => {
  const { requests, currentUser, respondToRequest, registeredUsers } = useAppContext();
  const navigate = useNavigate();

  // Helper to get fresh user data
  const getFreshUser = (userId) => {
    return registeredUsers.find(u => u.id === userId) || { name: 'Unknown User', avatar: '' };
  };

  // Combine and format all requests (sent and received)
  const unifiedMessages = requests
    .filter(r => r.to?.id === currentUser.id || r.from?.id === currentUser.id)
    .map(req => {
      const isReceived = req.to?.id === currentUser.id;
      const otherUser = getFreshUser(isReceived ? req.from?.id : req.to?.id);
      return {
        ...req,
        isReceived,
        otherUser
      };
    })
    .sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));

  return (
    <div style={{ padding: '0', paddingTop: '1rem', paddingBottom: '120px', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <div style={{ padding: '1rem 1.5rem', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', zIndex: 10, borderBottom: '1px solid var(--surface-border)' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>Messages</h1>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {unifiedMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <MessageCircle size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3>No messages yet</h3>
            <p>Connect with people to start chatting!</p>
          </div>
        ) : (
          unifiedMessages.map((msg, index) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                if (msg.status === 'accepted') {
                  navigate(`/chat/${msg.id}`);
                }
              }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                padding: '1rem 1.5rem', 
                borderBottom: '1px solid var(--surface-border)',
                cursor: msg.status === 'accepted' ? 'pointer' : 'default',
                background: msg.status === 'accepted' ? 'transparent' : 'rgba(0,0,0,0.02)',
                transition: 'background 0.2s'
              }}
            >
              <div 
                style={{ position: 'relative' }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${msg.otherUser.id}`);
                }}
              >
                <img 
                  src={msg.otherUser.avatar} 
                  alt={msg.otherUser.name} 
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} 
                />
                {msg.isReceived && msg.status === 'pending' && (
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '14px', height: '14px', background: 'var(--primary-color)', borderRadius: '50%', border: '2px solid var(--bg-color)' }} />
                )}
              </div>
              
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: msg.status === 'pending' && msg.isReceived ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {msg.otherUser.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {new Date(msg.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.9rem', 
                  color: (msg.status === 'pending' && msg.isReceived) ? 'var(--text-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  fontWeight: (msg.status === 'pending' && msg.isReceived) ? 600 : 400
                }}>
                  {msg.isReceived ? (
                    msg.status === 'pending' ? `${msg.otherUser?.name?.split(' ')[0] || 'Someone'} sent you a request: ${msg.activity}` :
                    msg.status === 'accepted' ? `You accepted ${msg.otherUser?.name?.split(' ')[0] || 'Someone'}'s request.` :
                    `You declined ${msg.otherUser?.name?.split(' ')[0] || 'Someone'}'s request.`
                  ) : (
                    msg.status === 'pending' ? `You requested: ${msg.activity}` :
                    msg.status === 'accepted' ? `${msg.otherUser?.name?.split(' ')[0] || 'Someone'} accepted your request!` :
                    `${msg.otherUser?.name?.split(' ')[0] || 'Someone'} declined your request.`
                  )}
                </p>

                {msg.isReceived && msg.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }} onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => respondToRequest(msg.id, 'accepted')}
                      style={{ flex: 1, background: 'var(--primary-color)', color: 'var(--bg-color)', border: 'none', padding: '0.5rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', cursor: 'pointer' }}
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button 
                      onClick={() => respondToRequest(msg.id, 'declined')}
                      style={{ flex: 1, background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--surface-border)', padding: '0.5rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', cursor: 'pointer' }}
                    >
                      <X size={14} /> Decline
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Inbox;
