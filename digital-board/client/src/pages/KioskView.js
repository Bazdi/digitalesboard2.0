// client/src/pages/KioskView.js - Updated with News
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import axios from 'axios';

const KioskView = () => {
  const [posts, setPosts] = useState([]);
  const [news, setNews] = useState([]);
  const [kioskConfig, setKioskConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchData();
    
    // Auto-refresh alle 30 Sekunden
    const interval = setInterval(fetchData, 30000);
    
    // Uhrzeit aktualisieren
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [postsResponse, newsResponse, configResponse] = await Promise.all([
        axios.get('/api/posts'),
        axios.get('/api/news'),
        axios.get('/api/kiosk/config')
      ]);
      setPosts(postsResponse.data);
      setNews(newsResponse.data);
      setKioskConfig(configResponse.data);
      console.log('🎛️ Kiosk-Konfiguration geladen:', configResponse.data);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      // Fallback: Alle Module aktivieren wenn Config nicht geladen werden kann
      setKioskConfig({
        modules: {
          news: { enabled: true },
          posts: { enabled: true },
          tradeshows: { enabled: true },
          vehicles: { enabled: true },
          warehouse: { enabled: true },
          birthdays: { enabled: true },
          directory: { enabled: true },
          orgchart: { enabled: true },
          workplan: { enabled: true }
        },
        maintenanceMode: { enabled: false }
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Unternehmen': '#3498db',
      'IT': '#9b59b6',
      'HR': '#1abc9c',
      'Finanzen': '#e67e22',
      'Marketing': '#e91e63',
      'Vertrieb': '#2ecc71',
      'Produktion': '#34495e'
    };
    return colors[category] || '#7f8c8d';
  };

  const styles = {
    container: {
      padding: '0',
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
    navigation: {
      display: 'flex',
      justifyContent: 'center',
      gap: '30px',
      flexWrap: 'wrap',
    },
    navButton: {
      display: 'inline-block',
      backgroundColor: '#3498db',
      color: 'white',
      padding: '20px 40px',
      fontSize: '24px',
      fontWeight: 'bold',
      textDecoration: 'none',
      borderRadius: '15px',
      transition: 'all 0.3s ease',
      minWidth: '200px',
      textAlign: 'center',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    },
    content: {
      padding: '40px',
      maxWidth: '1400px',
      margin: '0 auto',
    },
    newsSection: {
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
    breakingNewsContainer: {
      marginBottom: '40px',
    },
    breakingTitle: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#e74c3c',
      textAlign: 'center',
      marginBottom: '30px',
      animation: 'pulse 2s infinite',
    },
    newsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
      gap: '30px',
      marginBottom: '40px',
    },
    newsCard: {
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s ease',
    },
    breakingNewsCard: {
      border: '4px solid #e74c3c',
      backgroundColor: '#fdf2f2',
      animation: 'glow 2s infinite alternate',
    },
    newsTitle: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '15px',
      lineHeight: '1.3',
    },
    newsMeta: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
    },
    badge: {
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '16px',
      fontWeight: 'bold',
      color: 'white',
    },
    breakingBadge: {
      backgroundColor: '#e74c3c',
      fontSize: '18px',
      animation: 'pulse 2s infinite',
    },
    categoryBadge: {
      fontSize: '14px',
    },
    newsContent: {
      fontSize: '22px',
      lineHeight: '1.6',
      color: '#34495e',
      marginBottom: '20px',
    },
    newsSummary: {
      fontSize: '20px',
      fontStyle: 'italic',
      color: '#7f8c8d',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px',
      borderLeft: '4px solid #3498db',
    },
    newsImage: {
      width: '100%',
      maxHeight: '300px',
      objectFit: 'cover',
      borderRadius: '15px',
      marginBottom: '20px',
    },
    newsDate: {
      fontSize: '16px',
      color: '#7f8c8d',
      textAlign: 'right',
      marginTop: '15px',
      paddingTop: '15px',
      borderTop: '2px solid #ecf0f1',
    },
    postsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
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

  // Vollständige Navigation mit allen verfügbaren Modulen
  const allNavigationItems = [
    { 
      to: '/kiosk/news', 
      label: '📰 News Center', 
      color: '#3498db',
      moduleKey: 'news',
      requiresData: 'news'
    },
    { 
      to: '/kiosk/tradeshows', 
      label: '📅 Messekalender', 
      color: '#e74c3c',
      moduleKey: 'tradeshows'
    },
    { 
      to: '/kiosk/workplan', 
      label: '📋 Arbeitsplan', 
      color: '#f39c12',
      moduleKey: 'workplan'
    },
    { 
      to: '/kiosk/warehouse', 
      label: '📦 Lagerübersicht', 
      color: '#27ae60',
      moduleKey: 'warehouse'
    },
    { 
      to: '/kiosk/birthdays', 
      label: '🎂 Geburtstage', 
      color: '#9b59b6',
      moduleKey: 'birthdays'
    },
    { 
      to: '/kiosk/phonelist', 
      label: '📞 Telefonliste', 
      color: '#1abc9c',
      moduleKey: 'directory'
    },
    { 
      to: '/kiosk/organigramm', 
      label: '🏢 Organigramm', 
      color: '#34495e',
      moduleKey: 'orgchart'
    },
  ];

  // Filtere Navigation basierend auf Kiosk-Konfiguration
  const getFilteredNavigationItems = () => {
    if (!kioskConfig) return [];
    
    return allNavigationItems.filter(item => {
      // Prüfe ob Modul aktiviert ist
      const moduleEnabled = kioskConfig.modules?.[item.moduleKey]?.enabled;
      if (!moduleEnabled) {
        console.log(`🚫 Modul ${item.moduleKey} ist deaktiviert - Button wird ausgeblendet`);
        return false;
      }
      
      // Spezielle Prüfung für News: Nur anzeigen wenn auch News vorhanden sind
      if (item.requiresData === 'news' && news.length === 0) {
        console.log(`📰 News-Modul aktiviert aber keine News vorhanden - Button ausgeblendet`);
        return false;
      }
      
      return true;
    });
  };

  const navigationItems = getFilteredNavigationItems();

  // Filtere Breaking News und reguläre News
  const breakingNews = news.filter(item => item.is_breaking);
  const regularNews = news.filter(item => !item.is_breaking).slice(0, 4); // Zeige nur die 4 neuesten regulären News

  // Wartungsmodus prüfen
  if (kioskConfig && kioskConfig.maintenanceMode?.enabled) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        backgroundColor: '#fff5f5',
        padding: '40px'
      }}>
        <div style={{ fontSize: '128px', marginBottom: '40px' }}>🔧</div>
        <h1 style={{ fontSize: '48px', color: '#e53e3e', marginBottom: '30px' }}>
          Wartungsmodus
        </h1>
        <p style={{ fontSize: '24px', color: '#2d3748', maxWidth: '800px', lineHeight: '1.6' }}>
          {kioskConfig.maintenanceMode.message}
        </p>
        {kioskConfig.maintenanceMode.showETA && kioskConfig.maintenanceMode.eta && (
          <p style={{ fontSize: '20px', color: '#718096', marginTop: '30px' }}>
            Voraussichtlich verfügbar: {new Date(kioskConfig.maintenanceMode.eta).toLocaleString('de-DE')}
          </p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        Lade Inhalte...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Digitales Schwarzes Brett</h1>
        <div style={styles.clock}>
          {currentTime.toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} • {currentTime.toLocaleTimeString('de-DE')}
        </div>
        
        {/* Navigation nur anzeigen wenn Module verfügbar sind */}
        {navigationItems.length > 0 ? (
          <div style={styles.navigation}>
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                to={item.to}
                style={{
                  ...styles.navButton,
                  backgroundColor: item.color,
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : (
          <div style={{
            fontSize: '24px',
            color: '#e74c3c',
            backgroundColor: '#fdf2f2',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #e74c3c',
            marginTop: '20px'
          }}>
            🚫 Alle Module sind derzeit deaktiviert
          </div>
        )}
      </div>

      <div style={styles.content}>
        {/* Breaking News Section - nur anzeigen wenn News-Modul aktiviert */}
        {kioskConfig?.modules?.news?.enabled && breakingNews.length > 0 && (
          <div style={styles.breakingNewsContainer}>
            <h2 style={styles.breakingTitle}>🚨 BREAKING NEWS 🚨</h2>
            <div style={styles.newsGrid}>
              {breakingNews.map(newsItem => (
                <div 
                  key={newsItem.id} 
                  style={{...styles.newsCard, ...styles.breakingNewsCard}}
                >
                  <h3 style={styles.newsTitle}>{newsItem.title}</h3>
                  
                  <div style={styles.newsMeta}>
                    <span style={{...styles.badge, ...styles.breakingBadge}}>
                      🚨 BREAKING
                    </span>
                    <span 
                      style={{
                        ...styles.badge,
                        ...styles.categoryBadge,
                        backgroundColor: getCategoryColor(newsItem.category)
                      }}
                    >
                      {newsItem.category}
                    </span>
                  </div>
                  
                  {newsItem.image && (
                    <img
                      src={`/uploads/${newsItem.image}`}
                      alt={newsItem.title}
                      style={styles.newsImage}
                    />
                  )}
                  
                  {newsItem.summary ? (
                    <div style={styles.newsSummary}>
                      📝 {newsItem.summary}
                    </div>
                  ) : (
                    <div style={styles.newsContent}>
                      {newsItem.content.length > 200 
                        ? newsItem.content.substring(0, 200) + '...'
                        : newsItem.content
                      }
                    </div>
                  )}
                  
                  <div style={styles.newsDate}>
                    {new Date(newsItem.created_at).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular News Section - nur anzeigen wenn News-Modul aktiviert */}
        {kioskConfig?.modules?.news?.enabled && news.length > 0 && (
          <div style={styles.newsSection}>
            <h2 style={styles.sectionTitle}>📰 Aktuelle News</h2>
            
            {regularNews.length === 0 ? (
              <div style={styles.noContent}>
                Keine aktuellen News vorhanden
              </div>
            ) : (
              <div style={styles.newsGrid}>
                {regularNews.map(newsItem => (
                  <div 
                    key={newsItem.id} 
                    style={styles.newsCard}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <h3 style={styles.newsTitle}>{newsItem.title}</h3>
                    
                    <div style={styles.newsMeta}>
                      <span 
                        style={{
                          ...styles.badge,
                          ...styles.categoryBadge,
                          backgroundColor: getCategoryColor(newsItem.category)
                        }}
                      >
                        {newsItem.category}
                      </span>
                    </div>
                    
                    {newsItem.image && (
                      <img
                        src={`/uploads/${newsItem.image}`}
                        alt={newsItem.title}
                        style={styles.newsImage}
                      />
                    )}
                    
                    {newsItem.summary ? (
                      <div style={styles.newsSummary}>
                        📝 {newsItem.summary}
                      </div>
                    ) : (
                      <div style={styles.newsContent}>
                        {newsItem.content.length > 300 
                          ? newsItem.content.substring(0, 300) + '...'
                          : newsItem.content
                        }
                      </div>
                    )}
                    
                    <div style={styles.newsDate}>
                      {new Date(newsItem.created_at).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Posts Section - nur anzeigen wenn Posts-Modul aktiviert */}
        {kioskConfig?.modules?.posts?.enabled && posts.length > 0 && (
          <div>
            <h2 style={styles.sectionTitle}>📋 Ankündigungen</h2>
            
            <div style={styles.postsGrid}>
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  kiosk={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Zeige Nachricht wenn alle Inhalte deaktiviert sind */}
        {(!kioskConfig?.modules?.news?.enabled || news.length === 0) && 
         (!kioskConfig?.modules?.posts?.enabled || posts.length === 0) && (
          <div style={styles.noContent}>
            {kioskConfig ? 
              'Alle Inhalts-Module sind derzeit deaktiviert' : 
              'Keine Inhalte vorhanden'
            }
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
          
          @keyframes glow {
            0% { box-shadow: 0 8px 32px rgba(231, 76, 60, 0.3); }
            100% { box-shadow: 0 8px 32px rgba(231, 76, 60, 0.6); }
          }
        `}
      </style>
    </div>
  );
};

export default KioskView;