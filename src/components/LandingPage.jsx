import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Globe } from 'lucide-react';
import * as THREE from 'three';

const ThreeGlobe = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Wireframe Globe
    const globeGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const globeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.08
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Connection Points (dots on the globe)
    const dotCount = 80;
    const dotGeometry = new THREE.BufferGeometry();
    const dotPositions = new Float32Array(dotCount * 3);
    const dotColors = new Float32Array(dotCount * 3);

    const colors = [
      new THREE.Color('#667eea'),
      new THREE.Color('#764ba2'),
      new THREE.Color('#f093fb'),
      new THREE.Color('#4facfe'),
      new THREE.Color('#43e97b'),
      new THREE.Color('#fa709a')
    ];

    for (let i = 0; i < dotCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = 1.22;

      dotPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dotPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      dotPositions[i * 3 + 2] = r * Math.cos(phi);

      const color = colors[Math.floor(Math.random() * colors.length)];
      dotColors[i * 3] = color.r;
      dotColors[i * 3 + 1] = color.g;
      dotColors[i * 3 + 2] = color.b;
    }

    dotGeometry.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
    dotGeometry.setAttribute('color', new THREE.BufferAttribute(dotColors, 3));

    const dotMaterial = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    const dots = new THREE.Points(dotGeometry, dotMaterial);
    scene.add(dots);

    // Connection Lines between nearby dots
    const linePositions = [];
    const lineColors = [];

    for (let i = 0; i < dotCount; i++) {
      for (let j = i + 1; j < dotCount; j++) {
        const dx = dotPositions[i * 3] - dotPositions[j * 3];
        const dy = dotPositions[i * 3 + 1] - dotPositions[j * 3 + 1];
        const dz = dotPositions[i * 3 + 2] - dotPositions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 0.7 && Math.random() > 0.3) {
          linePositions.push(
            dotPositions[i * 3], dotPositions[i * 3 + 1], dotPositions[i * 3 + 2],
            dotPositions[j * 3], dotPositions[j * 3 + 1], dotPositions[j * 3 + 2]
          );
          const c = colors[Math.floor(Math.random() * colors.length)];
          lineColors.push(c.r, c.g, c.b, c.r, c.g, c.b);
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      linewidth: 1
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Floating particles around the globe
    const particleCount = 120;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 5;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      particleSpeeds.push({
        x: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.002,
        z: (Math.random() - 0.5) * 0.002
      });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.015,
      transparent: true,
      opacity: 0.4
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      globe.rotation.y += 0.002;
      dots.rotation.y += 0.002;
      lines.rotation.y += 0.002;

      // Animate floating particles
      const positions = particleGeometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += particleSpeeds[i].x;
        positions[i * 3 + 1] += particleSpeeds[i].y;
        positions[i * 3 + 2] += particleSpeeds[i].z;

        // Reset if too far
        const dist = Math.sqrt(
          positions[i * 3] ** 2 + positions[i * 3 + 1] ** 2 + positions[i * 3 + 2] ** 2
        );
        if (dist > 3) {
          positions[i * 3] = (Math.random() - 0.5) * 2;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
      globeGeometry.dispose();
      globeMaterial.dispose();
      dotGeometry.dispose();
      dotMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: '50%',
        right: '-10%',
        transform: 'translateY(-50%)',
        width: '70vw',
        maxWidth: '400px',
        height: '70vw',
        maxHeight: '400px',
        opacity: 0.7,
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
};

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
        
        {/* Three.js Globe Background */}
        <ThreeGlobe />

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
        <motion.div style={{ display: display1, opacity: opacity1, y: y1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'column', justifyContent: 'center', padding: '0 2.5rem', zIndex: 1 }}>
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
        <motion.div style={{ display: display2, opacity: opacity2, y: y2, scale: scale2, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2.5rem', zIndex: 1 }}>
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
        <motion.div style={{ display: display3, opacity: opacity3, y: y3, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2.5rem', paddingTop: '12rem', zIndex: 1 }}>
          
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
