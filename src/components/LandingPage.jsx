import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Globe } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Section 1: Intro
  const opacity1 = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const y1 = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const display1 = useTransform(scrollYProgress, v => v > 0.25 ? "none" : "flex");

  // Section 2: Features
  const opacity2 = useTransform(scrollYProgress, [0.2, 0.4, 0.6, 0.8], [0, 1, 1, 0]);
  const y2 = useTransform(scrollYProgress, [0.2, 0.4, 0.6, 0.8], [50, 0, 0, -50]);
  const scale2 = useTransform(scrollYProgress, [0.2, 0.4], [0.95, 1]);
  const display2 = useTransform(scrollYProgress, v => (v < 0.15 || v > 0.85) ? "none" : "flex");

  // Section 3: Call to Action
  const opacity3 = useTransform(scrollYProgress, [0.8, 1], [0, 1]);
  const y3 = useTransform(scrollYProgress, [0.8, 1], [50, 0]);
  const display3 = useTransform(scrollYProgress, v => v < 0.75 ? "none" : "flex");

  return (
    <div ref={containerRef} style={{ height: '250vh', width: '100%', position: 'relative' }}>
      
      {/* Fixed Viewport Content */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Navbar */}
        <motion.nav 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ padding: '2rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}
        >
          <div style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.5px' }}>Heyo.</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => navigate('/login')} 
              style={{ background: 'transparent', border: '1px solid transparent', color: 'white', padding: '0.6rem 1rem', borderRadius: '999px', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s ease' }}
            >
              Log In
            </button>
            <button 
              onClick={() => navigate('/signup')} 
              style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.6rem 1.5rem', borderRadius: '999px', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s ease' }}
            >
              Sign Up
            </button>
          </div>
        </motion.nav>

        {/* Section 1: Intro */}
        <motion.div style={{ display: display1, opacity: opacity1, y: y1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'column', justifyContent: 'center', padding: '0 2.5rem' }}>
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{ fontSize: '4.5rem', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.03em', margin: 0 }}
          >
            Meet.<br />
            Connect.<br />
            <span style={{ fontWeight: 600, background: 'linear-gradient(90deg, #fff, rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Heyo.</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            style={{ marginTop: '2rem', fontSize: '1.1rem', opacity: 0.7, maxWidth: '300px', lineHeight: 1.5 }}
          >
            The most beautifully crafted social network for Gen Z. Scroll to experience.
          </motion.p>
        </motion.div>

        {/* Section 2: Features (Minimal Glass Cards) */}
        <motion.div style={{ display: display2, opacity: opacity2, y: y2, scale: scale2, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '32px', padding: '3rem 2rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 400, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Fluid interactions.</h2>
            <p style={{ opacity: 0.7, lineHeight: 1.6, marginBottom: '2rem' }}>Connect with people around you through a seamlessly beautiful, translucent interface designed to let your content shine.</p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.85)' }}><Sparkles size={18} /></div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.85)' }}><Globe size={18} /></div>
            </div>
          </div>
        </motion.div>

        {/* Section 3: Call to Action */}
        <motion.div style={{ display: display3, opacity: opacity3, y: y3, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2.5rem', paddingTop: '12rem' }}>
          
          <h2 style={{ fontSize: '3.5rem', fontWeight: 300, textAlign: 'center', letterSpacing: '-0.03em', marginBottom: '3rem', lineHeight: 1.1 }}>
            Ready to say<br /><span style={{ fontWeight: 600 }}>Heyo?</span>
          </h2>
          
          <button 
            onClick={() => navigate('/signup')}
            style={{ 
              background: 'rgba(255,255,255,0.9)',
              color: '#000',
              border: 'none',
              padding: '1.25rem 2.5rem',
              borderRadius: '999px',
              fontSize: '1.1rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(255,255,255,0.2)',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Get Started
            <ArrowRight size={20} />
          </button>
          
        </motion.div>

      </div>
    </div>
  );
};

export default LandingPage;
