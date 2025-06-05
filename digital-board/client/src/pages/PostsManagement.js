// client/src/pages/PostsManagement.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import axios from 'axios';

const PostsManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: null
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Beiträge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('content', formData.content);
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      if (editingPost) {
        await axios.put(`/api/posts/${editingPost.id}`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post('/api/posts', formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      setFormData({ title: '', content: '', image: null });
      setShowForm(false);
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Beitrags');
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      image: null
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Möchten Sie diesen Beitrag wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPosts();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Beitrags');
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', image: null });
    setShowForm(false);
    setEditingPost(null);
  };

  const styles = {
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    button: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: '15px 25px',
      fontSize: '16px',
      fontWeight: 'bold',
      borderRadius: '5px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    cancelButton: {
      backgroundColor: '#95a5a6',
      marginLeft: '10px',
    },
    form: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      marginBottom: '30px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '16px',
      fontWeight: '500',
      color: '#34495e',
    },
    input: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      border: '2px solid #ecf0f1',
      borderRadius: '5px',
      transition: 'border-color 0.3s ease',
      outline: 'none',
    },
    textarea: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      border: '2px solid #ecf0f1',
      borderRadius: '5px',
      transition: 'border-color 0.3s ease',
      outline: 'none',
      minHeight: '120px',
      resize: 'vertical',
    },
    fileInput: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      border: '2px solid #ecf0f1',
      borderRadius: '5px',
      backgroundColor: '#f8f9fa',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
    },
    loading: {
      textAlign: 'center',
      fontSize: '18px',
      color: '#7f8c8d',
      padding: '50px',
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>Lade Beiträge...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>Beiträge verwalten</h1>
        <button
          style={styles.button}
          onClick={() => setShowForm(!showForm)}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
        >
          {showForm ? 'Abbrechen' : '+ Neuer Beitrag'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Titel:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              style={styles.input}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Inhalt:</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              style={styles.textarea}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Bild (optional):</label>
            <input
              type="file"
              name="image"
              onChange={handleChange}
              style={styles.fileInput}
              accept="image/*"
            />
          </div>
          
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={resetForm}
              style={{...styles.button, ...styles.cancelButton}}
              onMouseOver={(e) => e.target.style.backgroundColor = '#7f8c8d'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#95a5a6'}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              style={styles.button}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              {editingPost ? 'Aktualisieren' : 'Erstellen'}
            </button>
          </div>
        </form>
      )}

      <div>
        {posts.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: '18px', color: '#7f8c8d' }}>
            Noch keine Beiträge vorhanden.
          </p>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </Layout>
  );
};

export default PostsManagement; 