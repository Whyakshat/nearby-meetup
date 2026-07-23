import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';

const AppContext = createContext();

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001/api'
  : 'https://nearby-meetup.onrender.com/api';

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('vibecheck_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem('vibecheck_token') || null;
  });

  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [meetups, setMeetups] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('heyo_theme') || 'light');
  
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('heyo_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const updateTimerRef = useRef(null);
  
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [cityName, setCityName] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('heyo_theme', theme);
  }, [theme]);

  const authFetch = useCallback(async (endpoint, options = {}) => {
    if (!token) return null;
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      }
    });
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  }, [token]);

  // Initial Data Load when token is present
  useEffect(() => {
    if (token) {
      Promise.all([
        authFetch('/users'),
        authFetch('/posts'),
        authFetch('/meetups'),
        authFetch('/requests'),
        authFetch('/messages')
      ]).then(([usersData, postsData, meetupsData, reqsData, msgsData]) => {
        if(usersData) setRegisteredUsers(usersData);
        if(postsData) setPosts(postsData);
        if(meetupsData) setMeetups(meetupsData);
        if(reqsData) setRequests(reqsData);
        if(msgsData) setMessages(msgsData);
      }).catch(err => {
        console.error('Failed to fetch initial data:', err);
        if(err.message === 'API Request Failed') {
          logout();
        }
      });
    }
  }, [token, authFetch]);

  // Reverse geocode lat/lng to get city name
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'HeyoApp/1.0' } }
      );
      const data = await res.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        data.address?.state ||
        '';
      const country = data.address?.country_code?.toUpperCase() || '';
      setCityName(city ? `${city}${country ? ', ' + country : ''}` : '');
    } catch (e) {
      console.warn('Reverse geocoding failed:', e);
      setCityName('');
    }
  }, []);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }
    setLocationError(null);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLocation(prev => {
          if (prev) {
            const latDiff = Math.abs(prev.lat - lat);
            const lngDiff = Math.abs(prev.lng - lng);
            // 0.00015 degree is approximately 16 meters.
            if (latDiff < 0.00015 && lngDiff < 0.00015) {
              return prev;
            }
          }
          return { lat, lng };
        });
      },
      () => setLocationError("Location access denied"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
    );
  }, []);

  // Handle throttled/debounced location updates to server & geocoder
  useEffect(() => {
    if (!location) return;

    const performUpdate = () => {
      lastUpdateRef.current = Date.now();
      reverseGeocode(location.lat, location.lng);

      if (token) {
        fetch(`${API_URL}/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ latitude: location.lat, longitude: location.lng })
        }).catch(e => console.warn('Failed to update live coordinates on server', e));
      }
    };

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Clear any pending debounced updates
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }

    if (timeSinceLastUpdate >= 15000) {
      performUpdate();
    } else {
      // Schedule a debounced update at the end of the throttle window
      const delay = 15000 - timeSinceLastUpdate;
      updateTimerRef.current = setTimeout(performUpdate, delay);
    }

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, [location, token, reverseGeocode]);

  // Fetch Location on load
  useEffect(() => {
    if (currentUser) {
      fetchLocation();
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [currentUser, fetchLocation]);

  // Fast poll: messages + requests every 5 seconds (critical for real-time chat)
  useEffect(() => {
    if (!token) return;

    const fastInterval = setInterval(async () => {
      try {
        const [msgsData, reqsData] = await Promise.all([
          authFetch('/messages'),
          authFetch('/requests'),
        ]);
        if (msgsData) setMessages(msgsData);
        if (reqsData) setRequests(reqsData);
      } catch (err) {
        console.warn('Failed to poll messages/requests:', err);
      }
    }, 5000);

    // Slow poll: users + posts + meetups every 30 seconds (less critical)
    const slowInterval = setInterval(async () => {
      try {
        const [usersData, postsData, meetupsData] = await Promise.all([
          authFetch('/users'),
          authFetch('/posts'),
          authFetch('/meetups')
        ]);
        if (usersData) setRegisteredUsers(usersData);
        if (postsData) setPosts(postsData);
        if (meetupsData) setMeetups(meetupsData);
      } catch (err) {
        console.warn('Failed to poll background data:', err);
      }
    }, 30000);

    return () => {
      clearInterval(fastInterval);
      clearInterval(slowInterval);
    };
  }, [token, authFetch]);

  const updateSessionsList = useCallback((userSession) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.user.id !== userSession.user.id);
      const newList = [userSession, ...filtered];
      localStorage.setItem('heyo_sessions', JSON.stringify(newList));
      return newList;
    });
  }, []);

  const signup = async (email, password, gender, name) => {
    try {
      const displayName = name || email.split('@')[0];
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: displayName, gender })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('vibecheck_token', data.token);
        localStorage.setItem('vibecheck_user', JSON.stringify(data.user));
        updateSessionsList({ token: data.token, user: data.user });
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again.' };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('vibecheck_token', data.token);
        localStorage.setItem('vibecheck_user', JSON.stringify(data.user));
        updateSessionsList({ token: data.token, user: data.user });
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again.' };
    }
  };

  const sendGoogleOtp = async (email) => {
    try {
      const res = await fetch(`${API_URL}/auth/google/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, needsPasswordLink: data.needsPasswordLink };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again.' };
    }
  };

  const googleLogin = async (email, name, avatar, otp, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/google/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatar, otp, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('vibecheck_token', data.token);
        localStorage.setItem('vibecheck_user', JSON.stringify(data.user));
        updateSessionsList({ token: data.token, user: data.user });
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again.' };
    }
  };

  // Real Google Sign-In: send credential (ID token) from Google GIS
  const googleLoginWithToken = async (credential) => {
    try {
      const res = await fetch(`${API_URL}/auth/google/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('vibecheck_token', data.token);
        localStorage.setItem('vibecheck_user', JSON.stringify(data.user));
        updateSessionsList({ token: data.token, user: data.user });
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again.' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again.' };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again.' };
    }
  };

  const logout = () => {
    if (!currentUser) return;
    const remaining = sessions.filter(s => s.user.id !== currentUser.id);
    setSessions(remaining);
    localStorage.setItem('heyo_sessions', JSON.stringify(remaining));
    
    if (remaining.length > 0) {
      const nextAcc = remaining[0];
      setToken(nextAcc.token);
      setCurrentUser(nextAcc.user);
      localStorage.setItem('vibecheck_token', nextAcc.token);
      localStorage.setItem('vibecheck_user', JSON.stringify(nextAcc.user));
      addNotification(`Switched to ${nextAcc.user.name}`);
    } else {
      setCurrentUser(null);
      setToken(null);
      setLocation(null);
      setCityName('');
      localStorage.removeItem('vibecheck_token');
      localStorage.removeItem('vibecheck_user');
    }
  };

  const switchAccount = (userId) => {
    const target = sessions.find(s => s.user.id === userId);
    if (target) {
      setToken(target.token);
      setCurrentUser(target.user);
      localStorage.setItem('vibecheck_token', target.token);
      localStorage.setItem('vibecheck_user', JSON.stringify(target.user));
      addNotification(`Switched to ${target.user.name}`);
    }
  };

  const addAccount = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('vibecheck_token');
    localStorage.removeItem('vibecheck_user');
  };

  const deleteAccount = async (confirmValue) => {
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ confirmValue })
      });
      const data = await res.json();
      if (res.ok) {
        const remaining = sessions.filter(s => s.user.id !== currentUser.id);
        setSessions(remaining);
        localStorage.setItem('heyo_sessions', JSON.stringify(remaining));
        
        if (remaining.length > 0) {
          const nextAcc = remaining[0];
          setToken(nextAcc.token);
          setCurrentUser(nextAcc.user);
          localStorage.setItem('vibecheck_token', nextAcc.token);
          localStorage.setItem('vibecheck_user', JSON.stringify(nextAcc.user));
        } else {
          setCurrentUser(null);
          setToken(null);
          setLocation(null);
          setCityName('');
          localStorage.removeItem('vibecheck_token');
          localStorage.removeItem('vibecheck_user');
        }
        addNotification('Account deleted successfully');
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to delete account' };
    } catch (err) {
      return { success: false, message: 'Failed to delete account. Please try again.' };
    }
  };

  const disableAccount = async (confirmValue) => {
    try {
      const res = await fetch(`${API_URL}/users/profile/disable`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ confirmValue })
      });
      const data = await res.json();
      if (res.ok) {
        const remaining = sessions.filter(s => s.user.id !== currentUser.id);
        setSessions(remaining);
        localStorage.setItem('heyo_sessions', JSON.stringify(remaining));
        
        if (remaining.length > 0) {
          const nextAcc = remaining[0];
          setToken(nextAcc.token);
          setCurrentUser(nextAcc.user);
          localStorage.setItem('vibecheck_token', nextAcc.token);
          localStorage.setItem('vibecheck_user', JSON.stringify(nextAcc.user));
        } else {
          setCurrentUser(null);
          setToken(null);
          setLocation(null);
          setCityName('');
          localStorage.removeItem('vibecheck_token');
          localStorage.removeItem('vibecheck_user');
        }
        addNotification('Account disabled successfully');
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to disable account' };
    } catch (err) {
      return { success: false, message: 'Failed to disable account. Please try again.' };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updatedUser = await authFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      setCurrentUser(updatedUser);
      localStorage.setItem('vibecheck_user', JSON.stringify(updatedUser));
      
      // Update session in list
      setSessions(prev => {
        const newList = prev.map(s => s.user.id === updatedUser.id ? { ...s, user: updatedUser } : s);
        localStorage.setItem('heyo_sessions', JSON.stringify(newList));
        return newList;
      });

      addNotification('Profile updated');
    } catch (err) {
      addNotification('Failed to update profile');
    }
  };

  const blockUser = (userIdToBlock) => {
    const currentBlocked = currentUser.blockedUsers || [];
    if (!currentBlocked.includes(userIdToBlock)) {
      updateProfile({ blockedUsers: [...currentBlocked, userIdToBlock] });
    }
  };

  const unblockUser = (userIdToUnblock) => {
    const currentBlocked = currentUser.blockedUsers || [];
    if (currentBlocked.includes(userIdToUnblock)) {
      updateProfile({ blockedUsers: currentBlocked.filter(id => id !== userIdToUnblock) });
    }
  };

  const createPost = async (text, image, imageRatio = 'auto') => {
    try {
      const newPost = await authFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({ text, image, imageRatio })
      });
      setPosts(prev => [newPost, ...prev]);
      addNotification('Post created!');
    } catch (err) {
      addNotification('Failed to create post');
    }
  };

  const archivePost = async (postId) => {
    try {
      await authFetch(`/posts/${postId}/archive`, {
        method: 'PUT',
        body: JSON.stringify({ isArchived: true })
      });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isArchived: true } : p));
      addNotification('Post archived');
    } catch (err) { }
  };

  const unarchivePost = async (postId) => {
    try {
      await authFetch(`/posts/${postId}/archive`, {
        method: 'PUT',
        body: JSON.stringify({ isArchived: false })
      });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isArchived: false } : p));
      addNotification('Post unarchived');
    } catch (err) { }
  };

  const deletePost = async (postId) => {
    try {
      await authFetch(`/posts/${postId}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id !== postId));
      addNotification('Post deleted');
    } catch (err) { }
  };

  const createMeetup = async (activity, maxParticipants) => {
    try {
      const newMeetup = await authFetch('/meetups', {
        method: 'POST',
        body: JSON.stringify({ activity, maxParticipants })
      });
      setMeetups(prev => [newMeetup, ...prev]);
      addNotification('Group Meetup created!');
    } catch (err) { }
  };

  const joinMeetup = async (meetupId, meetupAuthorId, activityName) => {
    try {
      const newRequest = await authFetch('/requests', {
        method: 'POST',
        body: JSON.stringify({ toId: meetupAuthorId, activity: `Join Meetup: ${activityName}` })
      });
      setRequests(prev => [newRequest, ...prev]);
      addNotification('Request to join meetup sent!');
    } catch (err) { 
       addNotification('You already requested to join this meetup.');
    }
  };

  const closeMeetup = (meetupId) => {
    setMeetups(prev => prev.map(m => m.id === meetupId ? { ...m, status: 'closed' } : m));
    addNotification('Meetup closed and sorted.');
  };

  const sendRequest = async (targetUser, activity) => {
    try {
      const newRequest = await authFetch('/requests', {
        method: 'POST',
        body: JSON.stringify({ toId: targetUser.id, activity })
      });
      setRequests(prev => [newRequest, ...prev]);
      addNotification(`Request sent to ${targetUser.name}`);
    } catch (err) {
      addNotification('Already requested');
    }
  };

  const respondToRequest = async (requestId, status) => {
    try {
      const updated = await authFetch(`/requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      setRequests(prev => prev.map(req => req.id === requestId ? updated : req));
    } catch (err) { }
  };

  const cancelRequest = async (requestId) => {
    try {
      await authFetch(`/requests/${requestId}`, {
        method: 'DELETE'
      });
      setRequests(prev => prev.filter(req => req.id !== requestId));
      addNotification('Request cancelled');
    } catch (err) {
      addNotification('Failed to cancel request');
    }
  };

  const sendMessage = async (requestId, content, type = 'text', expiresAt = null) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if(!request) return;
      const receiverId = request.fromId === currentUser.id ? request.toId : request.fromId;
      
      const newMsg = await authFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({ receiverId, content, requestId, type, expiresAt })
      });
      setMessages(prev => [...prev, newMsg]);
    } catch (err) { }
  };

  const sendBroadcast = (message) => {
    const newBroadcast = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      message,
      timestamp: new Date().toISOString()
    };
    setBroadcasts(prev => [...prev, newBroadcast]);
    addNotification('Broadcast sent!');
  };

  const addNotification = (message) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const cityUsers = currentUser 
    ? registeredUsers.filter(u => {
        if (u.id === currentUser.id) return false;
        const myBlocked = currentUser.blockedUsers || [];
        const theirBlocked = u.blockedUsers || [];
        if (myBlocked.includes(u.id)) return false;
        if (theirBlocked.includes(currentUser.id)) return false;
        return true;
      })
    : [];

  return (
    <AppContext.Provider value={{
      currentUser,
      registeredUsers,
      location,
      locationError,
      fetchLocation,
      cityName,
      signup,
      login,
      sendGoogleOtp,
      googleLogin,
      googleLoginWithToken,
      forgotPassword,
      resetPassword,
      logout,
      sessions,
      switchAccount,
      addAccount,
      deleteAccount,
      disableAccount,
      updateProfile,
      blockUser,
      unblockUser,
      requests,
      sendRequest,
      respondToRequest,
      cancelRequest,
      messages,
      sendMessage,
      broadcasts,
      sendBroadcast,
      posts,
      createPost,
      deletePost,
      archivePost,
      unarchivePost,
      notifications,
      cityUsers,
      meetups,
      createMeetup,
      joinMeetup,
      closeMeetup,
      theme,
      setTheme
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
