import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './AppContext';
import { Navigation, Inbox as InboxIcon, User } from 'lucide-react';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Inbox from './components/Inbox';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Notifications from './components/Notifications';
import { RequireAuth } from './components/RequireAuth';
import { RequireLocation } from './components/RequireLocation';
import SplashScreen from './components/SplashScreen';
import { AnimatePresence } from 'framer-motion';

const BottomNav = () => {
  const { requests, currentUser } = useAppContext();
  const location = useLocation();
  
  if (!currentUser) return null;
  
  // Don't show bottom nav on auth or landing pages
  if (['/', '/login', '/signup'].includes(location.pathname)) return null;

  const unreadRequests = requests.filter(r => r.to?.id === currentUser.id && r.status === 'pending').length;

  return (
    <nav className="bottom-nav">
      <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (
          <>
            <Navigation strokeWidth={isActive ? 2.5 : 1.5} />
            <span>Nearby</span>
          </>
        )}
      </NavLink>
      
      <NavLink to="/inbox" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ position: 'relative' }}>
        {({ isActive }) => (
          <>
            <InboxIcon strokeWidth={isActive ? 2.5 : 1.5} />
            <span>Inbox</span>
            {unreadRequests > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '8px',
                background: 'var(--danger-color)',
                color: 'white',
                fontSize: '0.65rem',
                padding: '2px 5px',
                borderRadius: '10px',
                fontWeight: 'bold',
                border: '2px solid white'
              }}>
                {unreadRequests}
              </span>
            )}
          </>
        )}
      </NavLink>
      
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        {({ isActive }) => (
          <>
            <User strokeWidth={isActive ? 2.5 : 1.5} />
            <span>Profile</span>
          </>
        )}
      </NavLink>
    </nav>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

const AppContent = () => {
  const { currentUser } = useAppContext();
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash screen once per session
    return !sessionStorage.getItem('heyo_splash_shown');
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('heyo_splash_shown', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return (
      <AnimatePresence>
        <SplashScreen onComplete={handleSplashComplete} />
      </AnimatePresence>
    );
  }

  return (
    <div className="app-container">
      <ScrollToTop />
      <Notifications />
      
      <Routes>
        <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signup" element={currentUser ? <Navigate to="/dashboard" replace /> : <Signup />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <RequireAuth>
            <RequireLocation>
              <Dashboard />
            </RequireLocation>
          </RequireAuth>
        } />
        
        <Route path="/inbox" element={
          <RequireAuth>
            <Inbox />
          </RequireAuth>
        } />
        
        <Route path="/chat/:id" element={
          <RequireAuth>
            <Chat />
          </RequireAuth>
        } />
        
        <Route path="/profile" element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        } />

        <Route path="/profile/:id" element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
};

export default App;
