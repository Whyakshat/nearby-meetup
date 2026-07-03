import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { Settings as SettingsIcon, Edit2, Camera, Image as ImageIcon, Trash2, Archive, ArrowLeft } from 'lucide-react';
import Settings from './Settings';
import { AnimatePresence } from 'framer-motion';

const INTEREST_OPTIONS = ['Coffee', 'Design', 'Music', 'Gaming', 'Food', 'Movies', 'Sports', 'Art', 'Tech', 'Fashion'];

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, registeredUsers, updateProfile, posts, createPost, deletePost, archivePost, logout } = useAppContext();
  
  const isPublicView = id && id !== currentUser.id;
  const profileUser = isPublicView ? registeredUsers.find(u => u.id === id) : currentUser;

  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Local edit state
  const [bio, setBio] = useState(profileUser?.bio || '');
  const [interests, setInterests] = useState(profileUser?.interests || []);
  const [avatarUrl, setAvatarUrl] = useState(profileUser?.avatar || '');

  const fileInputRef = useRef(null);
  const postImageRef = useRef(null);

  // New Post State
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postImageRatio, setPostImageRatio] = useState('auto');

  const handleSave = () => {
    updateProfile({ bio, interests, avatar: avatarUrl });
    setIsEditing(false);
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        callback(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const compressPostImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Support up to 4K resolution
        const MAX_WIDTH = 3840;
        const MAX_HEIGHT = 2160;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export as very high quality JPEG (4K)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        callback(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, (compressedBase64) => {
        setter(compressedBase64);
      });
    }
  };

  const handlePostImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      compressPostImage(file, (compressedBase64) => {
        setter(compressedBase64);
      });
    }
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (postText.trim() || postImage) {
      createPost(postText.trim(), postImage, postImageRatio);
      setPostText('');
      setPostImage('');
      setPostImageRatio('auto');
    }
  };

  const myPosts = posts.filter(p => p.authorId === profileUser?.id && !p.isArchived).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (!profileUser) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>User not found</div>;
  }

  return (
    <div style={{ padding: '1rem', paddingTop: '2rem', paddingBottom: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isPublicView && (
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>
              <ArrowLeft size={24} />
            </button>
          )}
          {isPublicView ? profileUser.name : 'Profile'}
        </h1>
        {!isPublicView && (
          <button 
            onClick={() => setShowSettings(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem' }}
          >
            <SettingsIcon size={24} />
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ textAlign: 'center', marginBottom: '2rem', padding: '2rem 1rem' }}>
        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1rem auto' }}>
          <img 
            src={isEditing ? (avatarUrl || profileUser.avatar) : profileUser.avatar} 
            alt={profileUser.name} 
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--surface-border)' }}
          />
          {isEditing && !isPublicView && (
            <>
              <button 
                onClick={() => fileInputRef.current.click()}
                style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary-color)', color: 'var(--bg-color)', borderRadius: '50%', padding: '0.5rem', display: 'flex', border: 'none', cursor: 'pointer' }}
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={(e) => handleImageUpload(e, setAvatarUrl)}
              />
            </>
          )}
        </div>

        <h2 style={{ marginBottom: '0.25rem' }}>{profileUser.name}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{profileUser.email}</p>
        {profileUser.gender && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{profileUser.gender}</p>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>About</h3>
        {!isPublicView && (
          !isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="btn btn-glass"
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}
            >
              <Edit2 size={14} style={{ marginRight: '0.25rem' }} /> Edit
            </button>
          ) : (
            <button 
              onClick={handleSave}
              className="btn btn-accent"
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              Save
            </button>
          )
        )}
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        {isEditing && !isPublicView ? (
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input-field"
            style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
            placeholder="Write something about yourself..."
          />
        ) : (
          <p style={{ fontSize: '1.05rem', opacity: 0.9 }}>{profileUser.bio || "No bio yet."}</p>
        )}
      </div>

      <h3 style={{ marginBottom: '1rem' }}>Interests</h3>
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        {isEditing && !isPublicView ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {INTEREST_OPTIONS.map(interest => (
              <button 
                key={interest}
                onClick={() => toggleInterest(interest)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '999px',
                  border: '1px solid var(--surface-border)',
                  background: interests.includes(interest) ? 'var(--primary-color)' : 'var(--surface-color)',
                  color: interests.includes(interest) ? 'var(--bg-color)' : 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {interest}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {profileUser.interests && profileUser.interests.length > 0 ? (
              profileUser.interests.map(interest => (
                <span key={interest} className="tag-pill">
                  {interest}
                </span>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No interests added.</p>
            )}
          </div>
        )}
      </div>

      {/* Posts Section */}
      <h3 style={{ marginBottom: '1rem' }}>{isPublicView ? "Posts" : "My Posts"}</h3>
      
      {!isPublicView && (
        <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1rem' }}>
          <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="What's on your mind?" 
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            />
            {postImage && (
              <>
                <div style={{ position: 'relative', width: '100%', height: 'auto', aspectRatio: postImageRatio === 'auto' ? 'auto' : postImageRatio, borderRadius: '12px', overflow: 'hidden' }}>
                  <img src={postImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: postImageRatio === 'auto' ? 'contain' : 'cover' }} />
                  <button 
                    type="button"
                    onClick={() => { setPostImage(''); setPostImageRatio('auto'); }}
                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {['auto', '1/1', '4/3', '16/9', '9/16'].map(ratio => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setPostImageRatio(ratio)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid var(--surface-border)',
                        background: postImageRatio === ratio ? 'var(--primary-color)' : 'transparent',
                        color: postImageRatio === ratio ? 'var(--bg-color)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {ratio === 'auto' ? 'Original' : ratio.replace('/', ':')}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button"
                onClick={() => postImageRef.current.click()}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <ImageIcon size={18} /> Add Photo
              </button>
              <input 
                type="file" 
                accept="image/*" 
                ref={postImageRef} 
                style={{ display: 'none' }} 
                onChange={(e) => handlePostImageUpload(e, setPostImage)}
              />
              <button type="submit" className="btn btn-accent" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} disabled={!postText.trim() && !postImage}>
                Post
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {myPosts.length > 0 ? (
          myPosts.map(post => (
            <div key={post.id} className="glass-panel" style={{ padding: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem 0' }}>{post.text}</p>
              {post.image && (
                <img src={post.image} alt="Post" style={{ width: '100%', borderRadius: '12px', maxHeight: post.imageRatio === 'auto' || !post.imageRatio ? '400px' : 'none', aspectRatio: post.imageRatio || 'auto', objectFit: post.imageRatio === 'auto' || !post.imageRatio ? 'contain' : 'cover' }} />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {new Date(post.timestamp).toLocaleString()}
                </div>
                {!isPublicView && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => archivePost(post.id)}
                      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--surface-border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer' }}
                      title="Archive Post"
                    >
                      <Archive size={14} />
                    </button>
                    <button 
                      onClick={() => deletePost(post.id)}
                      style={{ background: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.3)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-color)', cursor: 'pointer' }}
                      title="Delete Post"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No posts yet.</p>
        )}
      </div>

      {!isPublicView && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={logout}
            style={{ 
              width: '100%', 
              maxWidth: '300px', 
              color: 'var(--danger-color)', 
              borderColor: 'rgba(255, 71, 87, 0.3)', 
              background: 'rgba(255, 71, 87, 0.05)', 
              padding: '0.8rem',
              fontWeight: 600
            }}
          >
            Sign Out
          </button>
        </div>
      )}

      <AnimatePresence>
        {showSettings && (
          <Settings onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

    </div>
  );
};

export default Profile;
