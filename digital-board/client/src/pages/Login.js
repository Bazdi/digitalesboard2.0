// client/src/pages/Login.js - VERBESSERTE VERSION
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Debug: Prüfe Verbindung zum Server
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const response = await axios.get('/api/test-db');
        setDebugInfo(`✅ Server erreichbar: ${response.data.message}`);
      } catch (error) {
        setDebugInfo(`❌ Server nicht erreichbar: ${error.message}`);
      }
    };
    
    checkServerConnection();
  }, []);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    // Fehler zurücksetzen wenn Benutzer tippt
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Login-Versuch für:', credentials.username);
      
      const response = await axios.post('/api/login', credentials);
      
      console.log('✅ Login erfolgreich:', response.data);
      
      // Prüfe ob Response die erwarteten Daten enthält
      if (!response.data.token || !response.data.user) {
        throw new Error('Ungültige Server-Antwort: Token oder Benutzerdaten fehlen');
      }
      
      // Login-Callback aufrufen
      onLogin(response.data.user, response.data.token);
      
    } catch (error) {
      console.error('❌ Login-Fehler:', error);
      
      let errorMessage = 'Login fehlgeschlagen';
      
      if (error.response) {
        // Server hat geantwortet, aber mit Fehlercode
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 401:
            errorMessage = 'Ungültige Anmeldedaten. Bitte prüfen Sie Benutzername und Passwort.';
            break;
          case 500:
            errorMessage = 'Server-Fehler. Bitte versuchen Sie es später erneut.';
            break;
          case 404:
            errorMessage = 'Login-Service nicht gefunden. Ist der Server gestartet?';
            break;
          default:
            errorMessage = data?.error || `Server-Fehler (${status})`;
        }
      } else if (error.request) {
        // Request wurde gesendet, aber keine Antwort erhalten
        errorMessage = 'Keine Verbindung zum Server. Ist der Server gestartet?';
      } else {
        // Anderer Fehler
        errorMessage = error.message || 'Unbekannter Fehler';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Quick-Login für Development
  const handleQuickLogin = () => {
    setCredentials({
      username: 'admin',
      password: 'admin123'
    });
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#34495e',
      padding: '20px',
    },
    form: {
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '10px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      width: '100%',
      maxWidth: '400px',
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '30px',
      color: '#2c3e50',
    },
    inputGroup: {
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
      padding: '15px',
      fontSize: '16px',
      border: '2px solid #ecf0f1',
      borderRadius: '5px',
      transition: 'border-color 0.3s ease',
      outline: 'none',
    },
    inputFocus: {
      borderColor: '#3498db',
    },
    button: {
      width: '100%',
      padding: '15px',
      fontSize: '18px',
      fontWeight: 'bold',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      marginTop: '20px',
      position: 'relative',
    },
    buttonDisabled: {
      backgroundColor: '#95a5a6',
      cursor: 'not-allowed',
    },
    error: {
      backgroundColor: '#e74c3c',
      color: 'white',
      padding: '15px',
      borderRadius: '5px',
      marginBottom: '20px',
      textAlign: 'center',
      fontSize: '14px',
    },
    debug: {
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '5px',
      fontSize: '14px',
      color: '#7f8c8d',
      textAlign: 'center',
    },
    hint: {
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#e8f4fd',
      borderRadius: '5px',
      fontSize: '14px',
      color: '#2c3e50',
    },
    quickLogin: {
      marginTop: '10px',
      fontSize: '14px',
      color: '#3498db',
      textAlign: 'center',
      cursor: 'pointer',
      textDecoration: 'underline',
    },
    loadingSpinner: {
      display: 'inline-block',
      width: '20px',
      height: '20px',
      border: '3px solid #ffffff',
      borderRadius: '50%',
      borderTopColor: 'transparent',
      animation: 'spin 1s ease-in-out infinite',
      marginRight: '10px',
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>🏢 Admin Login</h1>
        
        {error && (
          <div style={styles.error}>
            ❌ {error}
          </div>
        )}
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Benutzername:</label>
          <input
            type="text"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            style={styles.input}
            onFocus={(e) => e.target.style.borderColor = '#3498db'}
            onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
            required
            autoComplete="username"
            disabled={loading}
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Passwort:</label>
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            style={styles.input}
            onFocus={(e) => e.target.style.borderColor = '#3498db'}
            onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
            required
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {})
          }}
          onMouseOver={(e) => {
            if (!loading) e.target.style.backgroundColor = '#2980b9'
          }}
          onMouseOut={(e) => {
            if (!loading) e.target.style.backgroundColor = '#3498db'
          }}
        >
          {loading && <span style={styles.loadingSpinner}></span>}
          {loading ? 'Anmelden...' : '🔐 Anmelden'}
        </button>
        
        <div style={styles.quickLogin} onClick={handleQuickLogin}>
          💡 Standard-Login einfügen
        </div>
        
        <div style={styles.hint}>
          <strong>Standard-Anmeldedaten:</strong><br />
          👤 Benutzername: <code>admin</code><br />
          🔑 Passwort: <code>admin123</code>
        </div>
        
        {debugInfo && (
          <div style={styles.debug}>
            🔧 Debug: {debugInfo}
          </div>
        )}
      </form>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Login;