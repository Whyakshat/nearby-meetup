import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { ArrowLeft, Send, MapPin, X, Sparkles } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, currentUser, messages, sendMessage, registeredUsers, location } = useAppContext();
  const [inputText, setInputText] = useState('');
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  
  // AI Icebreaker states
  const [icebreakers, setIcebreakers] = useState([]);
  const [showIcebreakers, setShowIcebreakers] = useState(true);
  const [loadingIcebreakers, setLoadingIcebreakers] = useState(false);
  
  const messagesEndRef = useRef(null);

  const request = requests.find(r => r.id === id);
  
  const otherUserId = request && currentUser ? (request.from.id === currentUser.id ? request.to.id : request.from.id) : null;
  const otherUser = request && currentUser ? (registeredUsers?.find(u => u.id === otherUserId) || (request.from.id === currentUser.id ? request.to : request.from)) : null;

  const chatMessages = messages.filter(m => m.requestId === id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!otherUser?.interests) return;
    
    const fetchIcebreakers = async () => {
      setLoadingIcebreakers(true);
      try {
        const res = await fetch(`${API_URL}/ai/icebreakers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('vibecheck_token')}`
          },
          body: JSON.stringify({ interests: otherUser.interests })
        });
        const data = await res.json();
        setIcebreakers(data.icebreakers || []);
      } catch (err) {
        console.error('Failed to fetch icebreakers:', err);
      } finally {
        setLoadingIcebreakers(false);
      }
    };

    fetchIcebreakers();
  }, [otherUser?.id]);

  if (!currentUser) return null;

  if (!request || request.status !== 'accepted') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Chat not found or request not accepted.</p>
        <button className="btn btn-glass" onClick={() => navigate('/inbox')}>Back to Inbox</button>
      </div>
    );
  }

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

      const mapUrl = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
      return (
        <div 
          onClick={() => window.open(mapUrl, '_blank')}
          style={{ 
            width: '240px', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            cursor: 'pointer', 
            background: 'var(--surface-color)', 
            border: '1px solid var(--surface-border)',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ 
            padding: '0.6rem 0.85rem', 
            background: msg.type === 'location_live' && isLiveActive ? 'rgba(255, 71, 87, 0.1)' : 'rgba(0,0,0,0.04)', 
            fontSize: '0.8rem', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.35rem', 
            borderBottom: '1px solid var(--surface-border)',
            color: msg.type === 'location_live' && isLiveActive ? '#ff4757' : 'var(--text-primary)'
          }}>
            <MapPin size={13} /> 
            {msg.type === 'location_static' ? 'Current Location' : (isLiveActive ? '🔴 Live Location' : 'Live Location (Ended)')}
          </div>
          
          {/* Map Preview */}
          <div style={{ height: '140px', width: '100%', position: 'relative', pointerEvents: 'none', zIndex: 1 }}>
            <MapContainer 
              center={[loc.lat, loc.lng]} 
              zoom={14} 
              zoomControl={false}
              dragging={false}
              touchZoom={false}
              doubleClickZoom={false}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[loc.lat, loc.lng]} />
            </MapContainer>
          </div>

          <div style={{ padding: '0.6rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', background: 'rgba(0,0,0,0.02)' }}>
            <span style={{ opacity: 0.7, color: 'var(--text-primary)' }}>
              {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--accent-color)' }}>
              View Map
            </span>
          </div>
        </div>
      );
    }
    
    return <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{textContent}</p>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-color)' }}>
      {/* Header */}
      <div style={{ 
        padding: '1rem 1rem',
        paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))',
        borderBottom: '1px solid var(--surface-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: 'var(--surface-color)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button 
          onClick={() => navigate('/inbox')}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
        >
          <ArrowLeft size={22} />
        </button>
        <img 
          src={otherUser.avatar} 
          alt={otherUser.name} 
          style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--surface-border)', objectFit: 'cover', border: '2px solid var(--surface-border)' }} 
        />
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{otherUser.name}</h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{request.activity}</p>
        </div>
      </div>

      {/* AI Icebreakers Panel */}
      {showIcebreakers && icebreakers.length > 0 && (
        <div style={{ 
          background: 'var(--surface-color)', 
          borderBottom: '1px solid var(--surface-border)', 
          padding: '0.65rem 1rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.4rem',
          zIndex: 5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Sparkles size={11} /> AI Icebreakers
            </span>
            <button 
              onClick={() => setShowIcebreakers(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
            >
              Hide
            </button>
          </div>
          <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {icebreakers.map((breaker, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(breaker)}
                style={{
                  background: 'var(--bg-color)',
                  border: '1px solid var(--surface-border)',
                  color: 'var(--text-primary)',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-color)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-color)'}
              >
                {breaker}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '90px' }}>
        {chatMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <img src={otherUser.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <p style={{ fontWeight: 500 }}>Say hi to {otherUser?.name?.split(' ')[0] || 'Unknown'}!</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Connected via: {request.activity}</p>
          </div>
        ) : (
          chatMessages.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} style={{ 
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '78%',
                background: isMe ? 'var(--accent-gradient)' : 'var(--surface-color)',
                color: isMe ? 'white' : 'var(--text-primary)',
                padding: (msg.type === 'text' || !msg.type) ? '0.75rem 1rem' : '0',
                borderRadius: '18px',
                borderBottomRightRadius: isMe ? '4px' : '18px',
                borderBottomLeftRadius: !isMe ? '4px' : '18px',
                border: !isMe ? '1px solid var(--surface-border)' : 'none',
                overflow: 'hidden',
                boxShadow: isMe ? '0 4px 12px rgba(255, 118, 117, 0.3)' : '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                {renderMessageContent(msg)}
                <span style={{ fontSize: '0.65rem', opacity: 0.65, marginTop: '4px', display: 'block', textAlign: isMe ? 'right' : 'left', padding: (msg.type !== 'text' && msg.type) ? '0 0.5rem 0.5rem' : '0' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area — fixed with safe area */}
      <div style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '0.75rem 1rem',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
        background: 'var(--surface-color)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderTop: '1px solid var(--surface-border)',
        zIndex: 10
      }}>
        {/* Location Menu Modal */}
        {showLocationMenu && (
          <div style={{ position: 'absolute', bottom: '100%', left: '1rem', background: 'var(--surface-color)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--surface-border)', borderRadius: '16px', padding: '0.5rem', marginBottom: '0.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0.5rem', borderBottom: '1px solid var(--surface-border)', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Share Location</span>
              <button onClick={() => { setShowLocationMenu(false); setShowTimerMenu(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}><X size={14}/></button>
            </div>
            
            {!showTimerMenu ? (
              <>
                <button 
                  onClick={() => handleSendLocation('location_static')}
                  style={{ background: 'transparent', border: 'none', padding: '0.75rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                >
                  <MapPin size={15} /> Current Location
                </button>
                <button 
                  onClick={() => setShowTimerMenu(true)}
                  style={{ background: 'transparent', border: 'none', padding: '0.75rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: 500 }}
                >
                  <MapPin size={15} /> Live Location...
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '0 0.5rem', marginBottom: '0.25rem' }}>Share for how long?</p>
                {[{ label: '15 minutes', val: 15 }, { label: '1 hour', val: 60 }, { label: '8 hours', val: 480 }].map(({ label, val }) => (
                  <button 
                    key={val}
                    onClick={() => handleSendLocation('location_live', val)}
                    style={{ background: 'transparent', border: 'none', padding: '0.75rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                  >
                    {label}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', maxWidth: '600px', margin: '0 auto', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={() => { setShowLocationMenu(!showLocationMenu); setShowTimerMenu(false); }}
            className="btn btn-glass"
            style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: showLocationMenu ? 'var(--accent-color)' : 'var(--text-secondary)', flexShrink: 0 }}
          >
            <MapPin size={18} />
          </button>

          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="input-field"
            style={{ flex: 1, borderRadius: '999px', padding: '0.75rem 1.25rem' }}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            style={{ borderRadius: '50%', width: '44px', height: '44px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: inputText.trim() ? 'var(--primary-color)' : 'var(--surface-color)', border: '1px solid var(--surface-border)', cursor: inputText.trim() ? 'pointer' : 'default', transition: 'all 0.2s', flexShrink: 0 }}
          >
            <Send size={18} color={inputText.trim() ? 'var(--bg-color)' : 'var(--text-secondary)'} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
