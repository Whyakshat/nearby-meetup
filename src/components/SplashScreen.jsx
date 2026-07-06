import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Show the splash screen for 2 seconds (faster, more premium feel), then call onComplete
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', zIndex: 99999 }}>
      
      {/* Background with extreme blur to look like the splash screen */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-image)', backgroundSize: 'cover' }}></div>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--surface-color)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}></div>
      
      {/* Typography */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
      >
        <h2 style={{ fontSize: '3rem', fontWeight: 300, lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '3px', color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          Talk To<br/>
          <span style={{ fontStyle: 'italic', opacity: 0.9 }}>Members</span><br/>
          From Heyo
        </h2>
      </motion.div>

    </div>
  );
};

export default SplashScreen;
