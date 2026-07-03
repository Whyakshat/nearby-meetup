import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { ArrowLeft, Send, MapPin, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, currentUser, messages, sendMessage, registeredUsers, location } = useAppContext();
  const [inputText, setInputText] = useState('');
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Find the request to know who we are chatting with
  const request = requests.find(r => r.id === id);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!request || request.status !== 'accepted') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Chat not found or request not accepted.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/inbox')}>Back to Inbox</button>
      </div>
    );
  }

  // The other person in this request
  const otherUserId = request.from.id === currentUser.id ? request.to.id : request.from.id;
  const otherUser = registeredUsers?.find(u => u.id === otherUserId) || (request.from.id === currentUser.id ? request.to : request.from);

  const chatMessages = messages.filter(m => m.requestId === id);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(id, inputText.trim(), 'text');
      setInputText('');
    }
  };

  const handleSendLocation = (type, durationMinutes = 0) => {
    if (!location) {
      alert("Location not available. Please enable GPS.");
      return;
    }
    
    let expiresAt = null;
    if (type === 'location_live' && durationMinutes > 0) {
      expiresAt = new Date(Date.now() + durationMinutes * 60000).toISOString();
    }
    
    const content = JSON.stringify(location);
    sendMessage(id, content, type, expiresAt);
    setShowLocationMenu(false);
    setShowTimerMenu(false);
  };

  const renderMessageContent = (msg) => {
    // Backward compatibility for old messages
    const textContent = msg.content || msg.text;
    
    if (msg.type === 'location_static' || msg.type === 'location_live') {
      let loc;
      try {
        loc = JSON.parse(textContent);
      } catch(e) {
        return <p>Invalid Location Data</p>;
      }
      
      let isLiveActive = false;
      if (msg.type === 'location_live' && msg.expiresAt) {
        isLiveActive = new Date() < new Date(msg.expiresAt);
      }

      return (
        <div style={{ width: '220px', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.1)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MapPin size={14} /> 
            {msg.type === 'location_static' ? 'Current Location' : (isLiveActive ? 'Live Location (Active)' : 'Live Location (Ended)')}
          </div>
          <div style={{ height: '150px', width: '100%', filter: (msg.type === 'location_live' && !isLiveActive) ? 'grayscale(100%) opacity(50%)' : 'none' }}>
             <MapContainer center={[loc.lat, loc.lng]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[loc.lat, loc.lng]} />
             </MapContainer>
          </div>
        </div>
      );
    }
    
    return <p style={{ margin: 0, fontSize: '0.95rem' }}>{textContent}</p>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-color)' }}>
      {/* Header */}
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid var(--surface-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: 'var(--surface-color)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(20px)'
      }}>
        <button 
          onClick={() => navigate('/inbox')}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={24} />
        </button>
        <img src={otherUser.avatar} alt={otherUser.name} style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0f0f0', objectFit: 'cover' }} />
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{otherUser.name}</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{request.activity}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '100px' }}>
        {chatMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
            <p>Say hi to {otherUser?.name?.split(' ')[0] || 'Unknown'}!</p>
          </div>
        ) : (
          chatMessages.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} style={{ 
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                background: isMe ? 'var(--accent-gradient)' : 'var(--surface-color)',
                color: isMe ? 'white' : 'var(--text-primary)',
                padding: msg.type === 'text' || !msg.type ? '0.75rem 1rem' : '0',
                borderRadius: '16px',
                borderBottomRightRadius: isMe ? '4px' : '16px',
                borderBottomLeftRadius: !isMe ? '4px' : '16px',
                border: !isMe ? '1px solid var(--surface-border)' : 'none',
                overflow: 'hidden',
                boxShadow: isMe ? '0 4px 15px rgba(168, 85, 247, 0.3)' : '0 4px 15px rgba(0,0,0,0.05)'
              }}>
                {renderMessageContent(msg)}
                <span style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '4px', display: 'block', textAlign: isMe ? 'right' : 'left', padding: msg.type !== 'text' ? '0 0.5rem 0.5rem 0.5rem' : '0' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '1rem',
        background: 'var(--surface-color)',
        backdropFilter: 'blur(30px)',
        borderTop: '1px solid var(--surface-border)',
        zIndex: 10
      }}>
        {/* Location Menu Modal */}
        {showLocationMenu && (
          <div style={{ position: 'absolute', bottom: '100%', left: '1rem', background: 'var(--surface-color)', backdropFilter: 'blur(20px)', border: '1px solid var(--surface-border)', borderRadius: '16px', padding: '0.5rem', marginBottom: '0.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0.5rem', borderBottom: '1px solid var(--surface-border)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Share Location</span>
              <button onClick={() => setShowLocationMenu(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={14}/></button>
            </div>
            
            {!showTimerMenu ? (
              <>
                <button 
                  onClick={() => handleSendLocation('location_static')}
                  style={{ background: 'transparent', border: 'none', padding: '0.75rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}
                >
                  <MapPin size={16} /> Current Location
                </button>
                <button 
                  onClick={() => setShowTimerMenu(true)}
                  style={{ background: 'transparent', border: 'none', padding: '0.75rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}
                >
                  <MapPin size={16} color="var(--accent-color)" /> Live Location...
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => handleSendLocation('location_live', 15)}
                  style={{ background: 'transparent', border: 'none', padding: '0.75rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}
                >
                  For 15 minutes
                </button>
                <button 
                  onClick={() => handleSendLocation('location_live', 60)}
                  style={{ background: 'transparent', border: 'none', padding: '0.75rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}
                >
                  For 1 hour
                </button>
                <button 
                  onClick={() => handleSendLocation('location_live', 480)}
                  style={{ background: 'transparent', border: 'none', padding: '0.75rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}
                >
                  For 8 hours
                </button>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', maxWidth: '600px', margin: '0 auto', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={() => { setShowLocationMenu(!showLocationMenu); setShowTimerMenu(false); }}
            className="btn btn-glass"
            style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', border: '1px solid var(--surface-border)' }}
          >
            <MapPin size={18} />
          </button>

          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="input-field"
            style={{ flex: 1, borderRadius: '999px', padding: '0.75rem 1.25rem', background: 'rgba(0,0,0,0.05)' }}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="btn btn-primary"
            style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-gradient)', border: 'none' }}
          >
            <Send size={20} color="white" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
