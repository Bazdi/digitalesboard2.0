// client/src/pages/AdminDashboard.js - DEBUG VERSION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';

const AdminDashboard = ({ user, logout }) => {
  const [stats, setStats] = useState({
    news: 0,
    breakingNews: 0,
    posts: 0,
    tradeshows: 0,
    tasks: 0,
    employees: 0,
    vehicles: 0,
    verfügbarefahrzeuge: 0,
    aktiveBuchungen: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    console.log('🔍 Lade Dashboard-Statistiken...');
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token vorhanden:', !!token);
      
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      console.log('📡 Starte API-Aufrufe...');

      // Führe API-Aufrufe einzeln aus für besseres Debugging
      let newsData = [];
      let postsData = [];
      let tradeshowsData = [];
      let tasksData = [];
      let employeesData = [];
      let vehicleStatsData = { total_vehicles: 0, verfügbar: 0, aktive_buchungen: 0 };

      try {
        console.log('📰 Lade News...');
        const newsRes = await axios.get('/api/news', config);
        newsData = newsRes.data;
        console.log('✅ News geladen:', newsData.length);
      } catch (err) {
        console.error('❌ Fehler beim Laden der News:', err);
      }

      try {
        console.log('📝 Lade Posts...');
        const postsRes = await axios.get('/api/posts', config);
        postsData = postsRes.data;
        console.log('✅ Posts geladen:', postsData.length);
      } catch (err) {
        console.error('❌ Fehler beim Laden der Posts:', err);
      }

      try {
        console.log('📅 Lade Tradeshows...');
        const tradeshowsRes = await axios.get('/api/tradeshows', config);
        tradeshowsData = tradeshowsRes.data;
        console.log('✅ Tradeshows geladen:', tradeshowsData.length);
      } catch (err) {
        console.error('❌ Fehler beim Laden der Tradeshows:', err);
      }

      try {
        console.log('📋 Lade Tasks...');
        const tasksRes = await axios.get('/api/workplan', config);
        tasksData = tasksRes.data;
        console.log('✅ Tasks geladen:', tasksData.length);
      } catch (err) {
        console.error('❌ Fehler beim Laden der Tasks:', err);
      }

      try {
        console.log('👥 Lade Employees...');
        const employeesRes = await axios.get('/api/employees', config);
        employeesData = employeesRes.data;
        console.log('✅ Employees geladen:', employeesData.length);
      } catch (err) {
        console.error('❌ Fehler beim Laden der Employees:', err);
      }

      try {
        console.log('🚗 Lade Vehicle Stats...');
        const vehicleStatsRes = await axios.get('/api/vehicles/stats', config);
        vehicleStatsData = vehicleStatsRes.data;
        console.log('✅ Vehicle Stats geladen:', vehicleStatsData);
      } catch (err) {
        console.error('❌ Fehler beim Laden der Vehicle Stats:', err);
        console.error('Details:', err.response?.data || err.message);
      }

      const breakingCount = newsData.filter(item => item.is_breaking).length;

      const newStats = {
        news: newsData.length,
        breakingNews: breakingCount,
        posts: postsData.length,
        tradeshows: tradeshowsData.length,
        tasks: tasksData.length,
        employees: employeesData.length,
        vehicles: vehicleStatsData.total_vehicles || 0,
        verfügbarefahrzeuge: vehicleStatsData.verfügbar || 0,
        aktiveBuchungen: vehicleStatsData.aktive_buchungen || 0
      };

      console.log('📊 Finale Stats:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error('💥 Globaler Fehler beim Laden der Statistiken:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    welcome: {
      backgroundColor: '#3498db',
      color: 'white',
      padding: '30px',
      borderRadius: '10px',
      marginBottom: '30px',
      textAlign: 'center',
    },
    welcomeTitle: {
      fontSize: '28px',
      marginBottom: '10px',
    },
    debugInfo: {
      backgroundColor: '#f39c12',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center',
      fontSize: '16px',
    },
    errorInfo: {
      backgroundColor: '#e74c3c',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center',
      fontSize: '16px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    statCard: {
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      textAlign: 'center',
      transition: 'transform 0.3s ease',
      border: '2px solid transparent',
    },
    breakingNewsCard: {
      borderColor: '#e74c3c',
      backgroundColor: '#fdf2f2',
    },
    vehicleCard: {
      borderColor: '#27ae60',
      backgroundColor: '#f0f9f4',
    },
    statNumber: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '10px',
    },
    breakingNumber: {
      color: '#e74c3c',
      animation: 'pulse 2s infinite',
    },
    vehicleNumber: {
      color: '#27ae60',
    },
    statLabel: {
      fontSize: '18px',
      color: '#7f8c8d',
    },
    breakingLabel: {
      color: '#e74c3c',
      fontWeight: 'bold',
    },
    vehicleLabel: {
      color: '#27ae60',
      fontWeight: 'bold',
    },
    quickActions: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: '#2c3e50',
    },
    actionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
    },
    actionCard: {
      display: 'block',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      textDecoration: 'none',
      color: '#2c3e50',
      transition: 'all 0.3s ease',
      textAlign: 'center',
      border: '2px solid transparent',
    },
    actionIcon: {
      fontSize: '32px',
      marginBottom: '10px',
    },
    actionTitle: {
      fontSize: '16px',
      fontWeight: '500',
    },
    kioskButton: {
      display: 'inline-block',
      backgroundColor: '#27ae60',
      color: 'white',
      padding: '15px 30px',
      borderRadius: '8px',
      textDecoration: 'none',
      fontSize: '18px',
      fontWeight: 'bold',
      marginTop: '20px',
      transition: 'background-color 0.3s ease',
    },
    breakingAlert: {
      backgroundColor: '#e74c3c',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center',
      fontSize: '18px',
      fontWeight: 'bold',
      animation: 'pulse 2s infinite',
    },
    vehicleAlert: {
      backgroundColor: '#f39c12',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center',
      fontSize: '18px',
      fontWeight: 'bold',
    },
    retryButton: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      marginLeft: '15px',
    }
  };

  const quickActions = [
    { to: '/admin/news', icon: '📰', title: 'Breaking News erstellen', priority: true },
    { to: '/admin/vehicles', icon: '🚗', title: 'Fahrzeug buchen', priority: true },
    { to: '/admin/news', icon: '📃', title: 'News verwalten' },
    { to: '/admin/posts', icon: '📝', title: 'Neuen Beitrag erstellen' },
    { to: '/admin/vehicles', icon: '🚙', title: 'Fahrzeuge verwalten' },
    { to: '/admin/tradeshows', icon: '📅', title: 'Messe hinzufügen' },
    { to: '/admin/workplan', icon: '📋', title: 'Arbeitsplan bearbeiten' },
    { to: '/admin/birthdays', icon: '🎂', title: 'Geburtstage verwalten' },
    { to: '/admin/phonelist', icon: '📞', title: 'Telefonliste pflegen' },
    { to: '/admin/organigramm', icon: '🏢', title: 'Organigramm bearbeiten' },
  ];

  return (
    <Layout user={user} logout={logout}>
      {loading && (
        <div style={styles.debugInfo}>
          🔄 Lade Dashboard-Daten... (siehe Konsole für Details)
        </div>
      )}

      {error && (
        <div style={styles.errorInfo}>
          ❌ Fehler beim Laden: {error}
          <button 
            style={styles.retryButton}
            onClick={fetchStats}
          >
            🔄 Erneut versuchen
          </button>
        </div>
      )}

      {stats.breakingNews > 0 && (
        <div style={styles.breakingAlert}>
          🚨 ACHTUNG: {stats.breakingNews} Breaking News aktiv! 🚨
        </div>
      )}

      {stats.verfügbarefahrzeuge === 0 && stats.vehicles > 0 && (
        <div style={styles.vehicleAlert}>
          ⚠️ WARNUNG: Keine Fahrzeuge verfügbar! Alle {stats.vehicles} Fahrzeuge sind belegt oder in Wartung.
        </div>
      )}

      <div style={styles.welcome}>
        <h1 style={styles.welcomeTitle}>Willkommen, {user.username}!</h1>
        <p>Verwalten Sie hier Ihr digitales Schwarzes Brett mit News-System und Fahrzeugverwaltung</p>
      </div>

      <div style={styles.statsGrid}>
        <div 
          style={{
            ...styles.statCard,
            ...(stats.breakingNews > 0 ? styles.breakingNewsCard : {})
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{
            ...styles.statNumber,
            ...(stats.breakingNews > 0 ? styles.breakingNumber : {})
          }}>
            {stats.news}
          </div>
          <div style={{
            ...styles.statLabel,
            ...(stats.breakingNews > 0 ? styles.breakingLabel : {})
          }}>
            News {stats.breakingNews > 0 && `(${stats.breakingNews} Breaking)`}
          </div>
        </div>

        <div 
          style={styles.statCard}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={styles.statNumber}>{stats.posts}</div>
          <div style={styles.statLabel}>Beiträge</div>
        </div>

        <div 
          style={{
            ...styles.statCard,
            ...styles.vehicleCard
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{...styles.statNumber, ...styles.vehicleNumber}}>
            {stats.verfügbarefahrzeuge}/{stats.vehicles}
          </div>
          <div style={styles.vehicleLabel}>Fahrzeuge verfügbar</div>
        </div>

        <div 
          style={styles.statCard}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={styles.statNumber}>{stats.aktiveBuchungen}</div>
          <div style={styles.statLabel}>Aktive Buchungen</div>
        </div>

        <div 
          style={styles.statCard}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={styles.statNumber}>{stats.tradeshows}</div>
          <div style={styles.statLabel}>Messen</div>
        </div>

        <div 
          style={styles.statCard}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={styles.statNumber}>{stats.tasks}</div>
          <div style={styles.statLabel}>Aufgaben</div>
        </div>

        <div 
          style={styles.statCard}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={styles.statNumber}>{stats.employees}</div>
          <div style={styles.statLabel}>Mitarbeiter</div>
        </div>
      </div>

      <div style={styles.quickActions}>
        <h2 style={styles.sectionTitle}>Schnellzugriff</h2>
        <div style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.to}
              style={{
                ...styles.actionCard,
                ...(action.priority ? { borderColor: '#e74c3c', backgroundColor: '#fdf2f2' } : {})
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = action.priority ? '#e74c3c' : '#3498db';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = action.priority ? '#c0392b' : '#2980b9';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = action.priority ? '#fdf2f2' : '#f8f9fa';
                e.currentTarget.style.color = '#2c3e50';
                e.currentTarget.style.borderColor = action.priority ? '#e74c3c' : 'transparent';
              }}
            >
              <div style={styles.actionIcon}>{action.icon}</div>
              <div style={styles.actionTitle}>{action.title}</div>
            </Link>
          ))}
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <Link 
            to="/kiosk" 
            target="_blank" 
            style={styles.kioskButton}
            onMouseOver={(e) => e.target.style.backgroundColor = '#219a52'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
          >
            🖥️ Kiosk-Ansicht öffnen
          </Link>
        </div>
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

export default AdminDashboard;