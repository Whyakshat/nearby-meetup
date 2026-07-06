import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { ArrowLeft, Send, MapPin, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001/api'
  : 'https://nearby-meetup.onrender.com/api';

const formatMsgTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateLabel = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

const groupByDate = (msgs) => {
  const out = [];
  let cur = null;
  msgs.forEach(m => {
    const dk = new Date(m.timestamp).toDateString();
    if (dk !== cur) { cur = dk; out.push({ type: 'date', label: formatDateLabel(m.timestamp), key: dk + m.id }); }
    out.push({ type: 'msg', data: m });
  });
  return out;
};

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, currentUser, messages, sendMessage, registeredUsers, location, respondToRequest } = useAppContext();
  const [inputText, setInputText] = useState('');
  const [showLocMenu, setShowLocMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [icebreakers, setIcebreakers] = useState([]);
  const [showIce, setShowIce] = useState(true);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const request = requests.find(r => r.id === id);
  const otherUserId = request && currentUser
    ? (request.from.id === currentUser.id ? request.to.id : request.from.id) : null;
  const otherUser = request && currentUser
    ? (registeredUsers?.find(u => u.id === otherUserId) || (request.from.id === currentUser.id ? request.to : request.from))
    : null;

  const chatMessages = messages.filter(m => m.requestId === id);
  const isPending = request?.status === 'pending';
  const isReceived = request?.to?.id === currentUser?.id;
  const grouped = groupByDate(chatMessages);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!otherUser?.interests || isPending) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/ai/icebreakers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('vibecheck_token')}` },
          body: JSON.stringify({ interests: otherUser.interests })
        });
        const data = await res.json();
        setIcebreakers(data.icebreakers || []);
      } catch (_) {}
    })();
  }, [otherUser?.id, isPending]);

  const handleSend = useCallback((e) => {
    e.preventDefault();
    if (inputText.trim()) { sendMessage(id, inputText.trim(), 'text'); setInputText(''); inputRef.current?.focus(); }
  }, [inputText, id, sendMessage]);

  const handleSendLoc = (type, mins = 0) => {
    if (!location) { alert('Location not available.'); return; }
    const expiresAt = type === 'location_live' && mins > 0 ? new Date(Date.now() + mins * 60000).toISOString() : null;
    sendMessage(id, JSON.stringify(location), type, expiresAt);
    setShowLocMenu(false); setShowTimerMenu(false);
  };

  const renderLocMsg = (msg) => {
    let loc;
    try { loc = JSON.parse(msg.content || msg.text); } catch { return <span style={{fontSize:'0.9rem'}}>📍 Location</span>; }
    const isLive = msg.type === 'location_live' && msg.expiresAt && new Date() < new Date(msg.expiresAt);
    return (
      <div onClick={() => window.open(`https://www.google.com/maps?q=${loc.lat},${loc.lng}`, '_blank')}
        style={{width:'210px',borderRadius:'12px',overflow:'hidden',cursor:'pointer',border:'1px solid var(--surface-border)'}}>
        <div style={{padding:'0.4rem 0.65rem',fontSize:'0.72rem',fontWeight:600,display:'flex',alignItems:'center',gap:'0.25rem',background:isLive?'rgba(255,71,87,0.1)':'rgba(0,0,0,0.04)',color:isLive?'#ff4757':'inherit'}}>
          <MapPin size={10}/>{msg.type==='location_static'?'Current Location':isLive?'🔴 Live Location':'Live (Ended)'}
        </div>
        <div style={{height:'110px',pointerEvents:'none'}}>
          <MapContainer center={[loc.lat,loc.lng]} zoom={14} zoomControl={false} dragging={false} touchZoom={false} doubleClickZoom={false} scrollWheelZoom={false} style={{height:'100%',width:'100%'}}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            <Marker position={[loc.lat,loc.lng]}/>
          </MapContainer>
        </div>
        <div style={{padding:'0.3rem 0.65rem',fontSize:'0.65rem',opacity:0.5,background:'rgba(0,0,0,0.02)'}}>
          {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)} · Tap to open
        </div>
      </div>
    );
  };

  if (!currentUser) return null;
  if (!request || (request.status !== 'accepted' && request.status !== 'pending')) {
    return (
      <div style={{padding:'2rem',textAlign:'center',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1rem'}}>
        <p style={{color:'var(--text-secondary)'}}>Chat not found.</p>
        <button className="btn btn-glass" onClick={() => navigate('/inbox')}>Back to Inbox</button>
      </div>
    );
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--bg-color)',overflow:'hidden'}}>

      {/* Header */}
      <div style={{paddingTop:'calc(0.8rem + env(safe-area-inset-top, 0px))',paddingBottom:'0.8rem',paddingLeft:'0.5rem',paddingRight:'1rem',borderBottom:'1px solid var(--surface-border)',display:'flex',alignItems:'center',gap:'0.6rem',background:'var(--bg-color)',backdropFilter:'blur(30px)',WebkitBackdropFilter:'blur(30px)',position:'sticky',top:0,zIndex:10}}>
        <button onClick={() => navigate('/inbox')} style={{background:'none',border:'none',color:'var(--text-primary)',cursor:'pointer',display:'flex',alignItems:'center',padding:'0.4rem',borderRadius:'50%',flexShrink:0}}>
          <ArrowLeft size={20}/>
        </button>
        <div style={{position:'relative',flexShrink:0}}>
          <img src={otherUser.avatar} alt={otherUser.name} style={{width:'36px',height:'36px',borderRadius:'50%',objectFit:'cover',display:'block',background:'var(--surface-border)'}}/>
          {!isPending && <div style={{position:'absolute',bottom:0,right:0,width:'9px',height:'9px',borderRadius:'50%',background:'#34c759',border:'2px solid var(--bg-color)'}}/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <h3 style={{margin:0,fontSize:'0.95rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{otherUser.name}</h3>
          <p style={{margin:0,fontSize:'0.7rem',color:'var(--text-secondary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            {isPending?(isReceived?'Wants to connect':'Request sent'):request.activity}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:'auto',padding:'0.5rem 0.875rem',display:'flex',flexDirection:'column',paddingBottom:isPending?'100px':'80px'}} onClick={() => setShowLocMenu(false)}>

        {isPending ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.5rem',padding:'3rem 1.5rem',textAlign:'center'}}>
            <img src={otherUser.avatar} alt="" style={{width:'60px',height:'60px',borderRadius:'50%',objectFit:'cover',border:'2px solid var(--surface-border)'}}/>
            <div style={{fontWeight:600,fontSize:'0.98rem',color:'var(--text-primary)'}}>{otherUser.name}</div>
            <div style={{fontSize:'0.82rem',color:'var(--text-secondary)',lineHeight:1.5}}>
              {isReceived?<>Wants to meet — <strong>"{request.activity}"</strong></>:<>You asked — <strong>"{request.activity}"</strong></>}
            </div>
            <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',opacity:0.6}}>
              {isReceived?'Respond below to start chatting.':'Waiting for their response.'}
            </div>
          </div>
        ) : (
          <>
            {showIce && icebreakers.length > 0 && chatMessages.length === 0 && (
              <div style={{padding:'0.75rem 0 1rem'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.4rem'}}>
                  <span style={{fontSize:'0.68rem',fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.5px'}}>✨ Suggestions</span>
                  <button onClick={() => setShowIce(false)} style={{background:'none',border:'none',color:'var(--text-secondary)',fontSize:'0.68rem',cursor:'pointer',padding:0}}>Dismiss</button>
                </div>
                <div className="hide-scrollbar" style={{display:'flex',gap:'0.4rem',overflowX:'auto'}}>
                  {icebreakers.map((b,i) => (
                    <button key={i} onClick={() => { setInputText(b); inputRef.current?.focus(); }}
                      style={{background:'var(--surface-color)',border:'1px solid var(--surface-border)',color:'var(--text-primary)',padding:'0.35rem 0.7rem',borderRadius:'999px',fontSize:'0.75rem',whiteSpace:'nowrap',cursor:'pointer',flexShrink:0}}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.length === 0 && (!showIce || icebreakers.length === 0) && (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.4rem',padding:'3rem 1.5rem',textAlign:'center',color:'var(--text-secondary)'}}>
                <img src={otherUser.avatar} alt="" style={{width:'48px',height:'48px',borderRadius:'50%',objectFit:'cover',border:'2px solid var(--surface-border)',marginBottom:'0.2rem'}}/>
                <p style={{fontWeight:500,fontSize:'0.9rem',color:'var(--text-primary)',margin:0}}>Say hi to {otherUser?.name?.split(' ')[0]||'them'}!</p>
                <p style={{fontSize:'0.75rem',opacity:0.6,margin:0}}>via {request.activity}</p>
              </div>
            )}

            {grouped.map((item, idx) => {
              if (item.type === 'date') {
                return (
                  <div key={item.key} style={{display:'flex',justifyContent:'center',padding:'0.75rem 0 0.4rem'}}>
                    <span style={{fontSize:'0.67rem',color:'var(--text-secondary)',background:'var(--surface-color)',border:'1px solid var(--surface-border)',padding:'0.18rem 0.6rem',borderRadius:'999px',fontWeight:500}}>
                      {item.label}
                    </span>
                  </div>
                );
              }
              const msg = item.data;
              const isMe = msg.senderId === currentUser.id;
              const isLoc = msg.type === 'location_static' || msg.type === 'location_live';
              const nextItem = grouped[idx+1];
              const nextMsg = nextItem?.type === 'msg' ? nextItem.data : null;
              const isLast = !nextMsg || nextMsg.senderId !== msg.senderId;
              return (
                <div key={msg.id} style={{display:'flex',justifyContent:isMe?'flex-end':'flex-start',marginBottom:isLast?'0.45rem':'2px',paddingLeft:isMe?'3rem':'0',paddingRight:isMe?'0':'3rem'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:isMe?'flex-end':'flex-start',gap:'2px',maxWidth:'100%'}}>
                    <div style={{
                      background:isMe?'linear-gradient(135deg,#ff7675,#ffb142)':'var(--surface-color)',
                      color:isMe?'#fff':'var(--text-primary)',
                      padding:isLoc?'0':'0.5rem 0.8rem',
                      borderRadius:isMe?`18px 18px ${isLast?'5px':'18px'} 18px`:`18px 18px 18px ${isLast?'5px':'18px'}`,
                      border:!isMe?'1px solid var(--surface-border)':'none',
                      overflow:'hidden',wordBreak:'break-word'
                    }}>
                      {isLoc?renderLocMsg(msg):<span style={{fontSize:'0.92rem',lineHeight:1.4}}>{msg.content||msg.text}</span>}
                    </div>
                    {isLast && (
                      <span style={{fontSize:'0.62rem',color:'var(--text-secondary)',opacity:0.5,padding:isMe?'0 2px 0 0':'0 0 0 2px'}}>
                        {formatMsgTime(msg.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:'480px',paddingTop:'0.45rem',paddingLeft:'0.75rem',paddingRight:'0.75rem',paddingBottom:'calc(0.55rem + env(safe-area-inset-bottom, 0px))',background:'var(--bg-color)',backdropFilter:'blur(30px)',WebkitBackdropFilter:'blur(30px)',borderTop:'1px solid var(--surface-border)',zIndex:10}}>
        {isPending ? (
          isReceived ? (
            <div style={{display:'flex',gap:'0.6rem'}}>
              <button onClick={() => respondToRequest(request.id,'accepted')} style={{flex:1,background:'#007AFF',color:'white',border:'none',padding:'0.65rem',borderRadius:'11px',fontSize:'0.88rem',fontWeight:600,cursor:'pointer'}}>Accept</button>
              <button onClick={() => { respondToRequest(request.id,'declined'); navigate('/inbox'); }} style={{flex:1,background:'var(--surface-color)',color:'var(--text-secondary)',border:'1px solid var(--surface-border)',padding:'0.65rem',borderRadius:'11px',fontSize:'0.88rem',fontWeight:600,cursor:'pointer'}}>Decline</button>
            </div>
          ) : (
            <div style={{textAlign:'center',padding:'0.6rem',color:'var(--text-secondary)',fontSize:'0.82rem'}}>
              ⏳ Waiting for {otherUser?.name?.split(' ')[0]||'them'} to accept.
            </div>
          )
        ) : (
          <>
            {showLocMenu && (
              <div style={{position:'absolute',bottom:'100%',left:'0.75rem',background:'var(--bg-color)',border:'1px solid var(--surface-border)',borderRadius:'14px',padding:'0.35rem',marginBottom:'0.4rem',boxShadow:'0 6px 20px rgba(0,0,0,0.1)',minWidth:'175px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.25rem 0.45rem',borderBottom:'1px solid var(--surface-border)',marginBottom:'0.15rem'}}>
                  <span style={{fontSize:'0.75rem',fontWeight:600}}>Share Location</span>
                  <button onClick={() => { setShowLocMenu(false); setShowTimerMenu(false); }} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',display:'flex'}}><X size={12}/></button>
                </div>
                {!showTimerMenu ? (
                  <>
                    <button onClick={() => handleSendLoc('location_static')} style={{width:'100%',background:'transparent',border:'none',padding:'0.55rem 0.45rem',textAlign:'left',borderRadius:'7px',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.35rem',color:'var(--text-primary)',fontSize:'0.82rem'}}><MapPin size={12}/>Current Location</button>
                    <button onClick={() => setShowTimerMenu(true)} style={{width:'100%',background:'transparent',border:'none',padding:'0.55rem 0.45rem',textAlign:'left',borderRadius:'7px',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.35rem',color:'var(--accent-color)',fontSize:'0.82rem',fontWeight:500}}><MapPin size={12}/>Live Location…</button>
                  </>
                ) : (
                  <>
                    <p style={{fontSize:'0.7rem',color:'var(--text-secondary)',padding:'0 0.45rem',margin:'0 0 0.15rem'}}>Share for how long?</p>
                    {[{label:'15 min',val:15},{label:'1 hour',val:60},{label:'8 hours',val:480}].map(({label,val}) => (
                      <button key={val} onClick={() => handleSendLoc('location_live',val)} style={{width:'100%',background:'transparent',border:'none',padding:'0.55rem 0.45rem',textAlign:'left',borderRadius:'7px',cursor:'pointer',color:'var(--text-primary)',fontSize:'0.82rem'}}>{label}</button>
                    ))}
                  </>
                )}
              </div>
            )}
            <form onSubmit={handleSend} style={{display:'flex',gap:'0.4rem',alignItems:'center'}}>
              <button type="button" onClick={(e) => { e.stopPropagation(); setShowLocMenu(v=>!v); setShowTimerMenu(false); }}
                style={{background:'var(--surface-color)',border:'1px solid var(--surface-border)',borderRadius:'50%',width:'34px',height:'34px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:showLocMenu?'var(--accent-color)':'var(--text-secondary)',flexShrink:0,transition:'color 0.2s'}}>
                <MapPin size={15}/>
              </button>
              <input ref={inputRef} type="text" value={inputText} onChange={e=>setInputText(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&handleSend(e)}
                placeholder="Message…"
                style={{flex:1,background:'var(--surface-color)',border:'1px solid var(--surface-border)',borderRadius:'20px',padding:'0.55rem 0.9rem',fontSize:'0.92rem',color:'var(--text-primary)',outline:'none',fontFamily:'inherit'}}/>
              <button type="submit" disabled={!inputText.trim()}
                style={{borderRadius:'50%',width:'34px',height:'34px',padding:0,display:'flex',alignItems:'center',justifyContent:'center',background:inputText.trim()?'linear-gradient(135deg,#ff7675,#ffb142)':'var(--surface-color)',border:inputText.trim()?'none':'1px solid var(--surface-border)',cursor:inputText.trim()?'pointer':'default',transition:'all 0.2s',flexShrink:0}}>
                <Send size={14} color={inputText.trim()?'#fff':'var(--text-secondary)'}/>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
