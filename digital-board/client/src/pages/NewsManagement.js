// client/src/pages/NewsManagement.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import NewsCard from '../components/NewsCard';
import axios from 'axios';

const NewsManagement = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    category: 'Allgemein',
    priority: 1,
    is_breaking: false,
    expires_at: '',
    image: null
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await axios.get('/api/news');
      setNews(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der News:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const formDataToSend = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (key === 'image' && formData[key]) {
        formDataToSend.append(key, formData[key]);
      } else if (key !== 'image') {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      if (editingNews) {
        await axios.put(`/api/news/${editingNews.id}`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post('/api/news', formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      resetForm();
      fetchNews();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der News');
    }
  };

  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      summary: newsItem.summary || '',
      category: 'Allgemein',
      priority: newsItem.priority || 1,
      is_breaking: Boolean(newsItem.is_breaking),
      expires_at: newsItem.expires_at ? newsItem.expires_at.split('T')[0] : '',
      image: null
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Möchten Sie diese News wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNews();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der News');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      category: 'Allgemein',
      priority: 1,
      is_breaking: false,
      expires_at: '',
      image: null
    });
    setShowForm(false);
    setEditingNews(null);
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
    form: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      marginBottom: '30px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '20px',
      marginBottom: '20px',
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
      minHeight: '120px',
      transition: 'border-color 0.3s ease',
      outline: 'none',
      resize: 'vertical',
    },
    select: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      border: '2px solid #ecf0f1',
      borderRadius: '5px',
      outline: 'none',
      backgroundColor: 'white',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '16px',
      fontWeight: '500',
      color: '#34495e',
      cursor: 'pointer',
    },
    checkbox: {
      marginRight: '10px',
      transform: 'scale(1.2)',
    },
    buttonGroup: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end',
      marginTop: '20px',
    },
    cancelButton: {
      backgroundColor: '#95a5a6',
    },
    newsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
      gap: '20px',
    },
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', fontSize: '18px', color: '#7f8c8d', padding: '50px' }}>
          Lade News...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>News verwalten</h1>
        <button
          style={styles.button}
          onClick={() => setShowForm(!showForm)}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
        >
          {showForm ? 'Abbrechen' : '+ Neue News'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
            {editingNews ? 'News bearbeiten' : 'Neue News erstellen'}
          </h3>
          
          <div style={styles.formGrid}>
            <div>
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
                <label style={styles.label}>Zusammenfassung (für Kiosk-Ansicht):</label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  style={{...styles.textarea, minHeight: '80px'}}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
                  placeholder="Kurze Zusammenfassung für die Kiosk-Anzeige"
                />
              </div>
            </div>
            
            <div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Priorität:</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value={1}>Niedrig</option>
                  <option value={2}>Mittel</option>
                  <option value={3}>Hoch</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_breaking"
                    checked={formData.is_breaking}
                    onChange={handleChange}
                    style={styles.checkbox}
                  />
                  🚨 Breaking News
                </label>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Ablaufdatum (optional):</label>
                <input
                  type="date"
                  name="expires_at"
                  value={formData.expires_at}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Volltext:</label>
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
              style={{
                ...styles.input,
                backgroundColor: '#f8f9fa',
                padding: '10px'
              }}
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
              {editingNews ? 'Aktualisieren' : 'Erstellen'}
            </button>
          </div>
        </form>
      )}

      <div style={styles.newsGrid}>
        {news.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: '18px', color: '#7f8c8d', padding: '40px' }}>
            Noch keine News vorhanden.
          </p>
        ) : (
          news.map(newsItem => (
            <NewsCard
              key={newsItem.id}
              news={newsItem}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </Layout>
  );
};

export default NewsManagement;