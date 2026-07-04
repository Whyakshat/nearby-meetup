import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

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
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        setLocationError(null);
        reverseGeocode(lat, lng);
      },
      () => setLocationError("Location access denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [reverseGeocode]);

  // Fetch Location on load
  useEffect(() => {
    if (currentUser) {
      fetchLocation();
    }
  }, [currentUser, fetchLocation]);

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
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Server error. Please try again.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    setLocation(null);
    setCityName('');
    localStorage.removeItem('vibecheck_token');
    localStorage.removeItem('vibecheck_user');
  };

  const updateProfile = async (updates) => {
    try {
      const updatedUser = await authFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      setCurrentUser(updatedUser);
      localStorage.setItem('vibecheck_user', JSON.stringify(updatedUser));
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

  const sendMessage = async (requestId, content, type = 'text', expiresAt = null) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if(!request) return;
      const receiverId = request.fromId === currentUser.id ? request.toId : request.fromId;
      
      const newMsg = await authFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({ receiverId, content, requestId })
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
      logout,
      updateProfile,
      blockUser,
      unblockUser,
      requests,
      sendRequest,
      respondToRequest,
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
