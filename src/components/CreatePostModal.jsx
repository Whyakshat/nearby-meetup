import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon } from 'lucide-react';
import { useAppContext } from '../AppContext';

const CreatePostModal = ({ onClose }) => {
  const { createPost, currentUser } = useAppContext();
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postImageRatio, setPostImageRatio] = useState('auto');
  const fileInputRef = useRef(null);

  const compressPostImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
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
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        callback(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressPostImage(file, (compressedBase64) => {
        setPostImage(compressedBase64);
      });
    }
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (postText.trim() || postImage) {
      createPost(postText.trim(), postImage, postImageRatio);
      onClose();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div 
        onClick={onClose} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      ></div>
      
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ 
          width: '100%', 
          maxWidth: '500px', 
          background: 'var(--surface-color)', 
          backdropFilter: 'blur(40px)', 
          WebkitBackdropFilter: 'blur(40px)',
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
          border: '1px solid var(--surface-border)',
          borderBottom: 'none',
          padding: '1.5rem',
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          position: 'relative',
          zIndex: 10001,
          boxShadow: '0 -20px 60px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Create Post</h2>
          <button onClick={onClose} style={{ background: 'var(--surface-border)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <img src={currentUser.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
            <textarea 
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What's happening nearby?"
              autoFocus
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.1rem', resize: 'none', minHeight: '80px', outline: 'none', padding: '0.25rem 0' }}
            />
          </div>

          {postImage && (
            <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
              <img src={postImage} alt="Preview" style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: postImageRatio === 'auto' ? 'contain' : 'cover', aspectRatio: postImageRatio === 'auto' ? 'auto' : postImageRatio }} />
              <button 
                type="button"
                onClick={() => { setPostImage(''); setPostImageRatio('auto'); }}
                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
              
              <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', display: 'flex', gap: '0.25rem', overflowX: 'auto', padding: '0.25rem', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                {['auto', '1/1', '4/3', '16/9', '9/16'].map(ratio => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setPostImageRatio(ratio)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: postImageRatio === ratio ? 'var(--primary-color)' : 'transparent',
                      color: postImageRatio === ratio ? 'var(--bg-color)' : 'white',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {ratio === 'auto' ? 'Original' : ratio.replace('/', ':')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <button 
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={{ background: 'var(--surface-border)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <ImageIcon size={20} />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageUpload}
            />
            <button 
              type="submit" 
              className="btn btn-accent" 
              disabled={!postText.trim() && !postImage}
              style={{ padding: '0.6rem 1.5rem', opacity: (!postText.trim() && !postImage) ? 0.5 : 1 }}
            >
              Post
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreatePostModal;
