import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { Bot, X, Send, Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001/api'
  : 'https://nearby-meetup.onrender.com/api';

const QUICK_ACTIONS = [
  { label: '😏 Flirt / Pickup Line', message: 'tell me something to start a convo with baddie' },
  { label: '☕ Find coffee buddies', message: 'Find someone who likes coffee' },
  { label: '🎯 Meetup ideas', message: 'Suggest a meetup activity for me' },
  { label: '🔮 Compatibility', message: 'How compatible am I with people nearby?' }
];

const ThinkingStep = ({ step, isLast }) => {
  const icons = { think: '🧠', plan: '📋', execute: '⚡', respond: '✨' };
  return (
    <div style={{
      display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
      opacity: isLast ? 1 : 0.6, fontSize: '0.75rem', color: 'var(--text-secondary)',
      padding: '0.25rem 0'
    }}>
      <span>{icons[step.step] || '•'}</span>
      <div>
        <span style={{ fontWeight: 600 }}>{step.action}</span>
        <span style={{ marginLeft: '0.35rem' }}>— {step.result}</span>
        <span style={{ marginLeft: '0.35rem', opacity: 0.5 }}>{step.timestamp}ms</span>
      </div>
    </div>
  );
};

const AiAssistant = () => {
  const { currentUser } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showThinking, setShowThinking] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!currentUser) return null;

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: 'user', content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('vibecheck_token');
      const res = await fetch(`${API_URL}/ai/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();
      
      const botMsg = {
        role: 'assistant',
        content: data.response || 'Sorry, something went wrong.',
        id: Date.now() + 1,
        agentLog: data.agentLog || [],
        intent: data.intent,
        toolsUsed: data.toolsUsed || [],
        processingTime: data.processingTimeMs
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Oops! Something went wrong. Please try again.',
        id: Date.now() + 1,
        agentLog: []
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleThinking = (msgId) => {
    setShowThinking(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const formatContent = (text) => {
    // Simple markdown-like formatting
    return text.split('\n').map((line, i) => {
      let formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/• /g, '&nbsp;&nbsp;• ');
      return <p key={i} style={{ margin: '0.15rem 0' }} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <>
      {/* Floating Button (Draggable & Minimal) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            drag
            dragMomentum={false}
            dragElastic={0.1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => !isDragging && setIsOpen(true)}
            title="Drag to move AI Assistant"
            style={{
              position: 'fixed',
              bottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
              right: '20px',
              width: '42px', height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              cursor: 'grab',
              zIndex: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.45)',
              touchAction: 'none'
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92, cursor: 'grabbing' }}
          >
            <Sparkles size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              bottom: 0, left: 0, right: 0, top: 0,
              background: 'var(--bg-color)',
              zIndex: 99999,
              display: 'flex', flexDirection: 'column',
              maxWidth: '480px', margin: '0 auto'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid var(--surface-border)',
              background: 'var(--surface-color)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Bot size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>Heyo AI</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Agentic Assistant</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{
              flex: 1, overflowY: 'auto', padding: '1rem',
              display: 'flex', flexDirection: 'column', gap: '0.75rem'
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea22, #764ba222)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem'
                  }}>
                    <Bot size={28} color="var(--text-secondary)" />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Hey {currentUser.name}!</h3>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
                    I'm your AI-powered assistant. I use an agentic pipeline to help you discover people, plan meetups, and break the ice.
                  </p>

                  {/* Quick Actions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1.25rem' }}>
                    {QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(action.message)}
                        style={{
                          padding: '0.5rem 0.85rem',
                          borderRadius: '999px',
                          border: '1px solid var(--surface-border)',
                          background: 'var(--surface-color)',
                          color: 'var(--text-primary)',
                          fontSize: '0.78rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '0.75rem 1rem',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #667eea, #764ba2)'
                      : 'var(--surface-color)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--surface-border)',
                    fontSize: '0.9rem',
                    lineHeight: 1.5
                  }}>
                    {formatContent(msg.content)}

                    {/* Agent Log Toggle */}
                    {msg.agentLog && msg.agentLog.length > 0 && (
                      <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(128,128,128,0.2)', paddingTop: '0.4rem' }}>
                        <button
                          onClick={() => toggleThinking(msg.id)}
                          style={{
                            background: 'none', border: 'none',
                            color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0
                          }}
                        >
                          <ChevronDown size={12} style={{
                            transform: showThinking[msg.id] ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s'
                          }} />
                          Agent Workflow ({msg.processingTime}ms)
                        </button>

                        <AnimatePresence>
                          {showThinking[msg.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              style={{ overflow: 'hidden', marginTop: '0.35rem' }}
                            >
                              {msg.agentLog.map((step, i) => (
                                <ThinkingStep key={i} step={step} isLast={i === msg.agentLog.length - 1} />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '18px 18px 18px 4px',
                    background: 'var(--surface-color)',
                    border: '1px solid var(--surface-border)',
                    display: 'flex', gap: '0.3rem', alignItems: 'center'
                  }}>
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: 'var(--text-secondary)'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{
              padding: '0.75rem 1rem',
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
              borderTop: '1px solid var(--surface-border)',
              background: 'var(--surface-color)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask the AI agent..."
                  className="input-field"
                  style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '999px', fontSize: '0.9rem' }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: input.trim() ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'var(--surface-border)',
                    border: 'none', color: 'white', cursor: input.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', flexShrink: 0
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiAssistant;
