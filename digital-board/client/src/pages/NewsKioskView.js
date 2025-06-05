// client/src/pages/NewsKioskView.js
import React, { useState, useEffect } from 'react';
import NewsCard from '../components/NewsCard';
import KioskConfigWrapper from '../components/KioskConfigWrapper';
import axios from 'axios';

const NewsKioskView = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchNews();
    
    // Auto-refresh alle 30 Sekunden
    const interval = setInterval(fetchNews, 30000);
    
    // Uhrzeit aktualisieren
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
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

  const styles = {
    container: {
      padding: '0',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
    },
    header: {
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '40px',
      textAlign: 'center',
      marginBottom: '40px',
    },
    title: {
      fontSize: '64px',
      fontWeight: 'bold',
      marginBottom: '20px',
    },
    clock: {
      fontSize: '32px',
      fontWeight: '300',
      marginBottom: '30px',
    },
    backButton: {
      display: 'inline-block',
      backgroundColor: '#3498db',
      color: 'white',
      padding: '20px 40px',
      fontSize: '24px',
      fontWeight: 'bold',
      textDecoration: 'none',
      borderRadius: '10px',
      transition: 'background-color 0.3s ease',
    },
    content: {
      padding: '40px',
      maxWidth: '1400px',
      margin: '0 auto',
    },
    breakingSection: {
      marginBottom: '60px',
    },
    sectionTitle: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#2c3e50',
      textAlign: 'center',
      marginBottom: '40px',
      borderBottom: '4px solid #3498db',
      paddingBottom: '20px',
    },
    breakingTitle: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#e74c3c',
      textAlign: 'center',
      marginBottom: '40px',
      animation: 'pulse 2s infinite',
    },
    newsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))',
      gap: '40px',
    },
    loading: {
      textAlign: 'center',
      fontSize: '36px',
      color: '#7f8c8d',
      padding: '100px',
    },
    noContent: {
      textAlign: 'center',
      fontSize: '32px',
      color: '#7f8c8d',
      padding: '100px',
    }
  };

  const breakingNews = news.filter(item => item.is_breaking);
  const regularNews = news.filter(item => !item.is_breaking);

  if (loading) {
    return (
      <KioskConfigWrapper moduleName="news">
        <div style={styles.loading}>
          Lade News...
        </div>
      </KioskConfigWrapper>
    );
  }

  return (
    <KioskConfigWrapper moduleName="news">
      <div style={styles.container}>
        <div style={styles.header}>
          <a href="/kiosk" style={styles.backButton}>← Zurück zum Hauptmenü</a>
          <h1 style={styles.title}>📰 News Center</h1>
          <div style={styles.clock}>
            {currentTime.toLocaleDateString('de-DE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} • {currentTime.toLocaleTimeString('de-DE')}
          </div>
        </div>

        <div style={styles.content}>
          {/* Breaking News Section */}
          {breakingNews.length > 0 && (
            <div style={styles.breakingSection}>
              <h2 style={styles.breakingTitle}>🚨 BREAKING NEWS 🚨</h2>
              <div style={styles.newsGrid}>
                {breakingNews.map(newsItem => (
                  <NewsCard
                    key={newsItem.id}
                    news={newsItem}
                    kiosk={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular News Section */}
          {regularNews.length > 0 && (
            <div>
              <h2 style={styles.sectionTitle}>Aktuelle News</h2>
              <div style={styles.newsGrid}>
                {regularNews.map(newsItem => (
                  <NewsCard
                    key={newsItem.id}
                    news={newsItem}
                    kiosk={true}
                  />
                ))}
              </div>
            </div>
          )}

          {news.length === 0 && (
            <div style={styles.noContent}>
              Keine News vorhanden
            </div>
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
      </div>
    </KioskConfigWrapper>
  );
};

export default NewsKioskView;