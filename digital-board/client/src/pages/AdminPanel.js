import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';

// Stelle sicher, dass axios immer an Port 5000 geht
axios.defaults.baseURL = 'http://localhost:5000';

const AdminPanel = () => {
  const [work4allStatus, setWork4allStatus] = useState({
    lastSync: null,
    isConnected: false,
    employees: 0,
    vehicles: 0,
    events: 0,
    syncing: false
  });

  // NEUER State für System-Informationen
  const [systemInfo, setSystemInfo] = useState({
    loading: true,
    server: {
      platform: '',
      uptime: 0,
      memory: { used: 0, total: 0 },
      cpu: { usage: 0, cores: 0 }
    },
    database: {
      totalRecords: 0,
      posts: 0,
      news: 0,
      tradeshows: 0,
      employees: 0,
      workplanTasks: 0,
      size: 0
    },
    digitalBoard: {
      totalViews: 0,
      activeUsers: 0,
      lastActivity: null,
      kioskConnected: false
    }
  });

  // NEUE States für work4all Dashboard-Daten
  const [work4allDashboard, setWork4allDashboard] = useState({
    loading: true,
    error: null,
    attendance: {
      currentlyOnSite: 0,
      onVacation: 0,
      onSickLeave: 0,
      workingRemote: 0
    },
    projects: {
      activeProjects: 0,
      upcomingDeadlines: 0,
      overdueTasks: 0,
      completedThisWeek: 0
    },
    resources: {
      availableVehicles: 0,
      bookedMeetingRooms: 0,
      activeEquipment: 0,
      maintenanceScheduled: 0
    },
    workforce: {
      workingToday: 0,
      scheduledTomorrow: 0,
      upcomingTrainings: 0,
      certificationExpiring: 0
    }
  });

  // NEUE States für Modal-System
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: '', // 'vehicles', 'onsite', 'projects', 'deadlines'
    title: '',
    data: []
  });

  const [work4allProjects, setWork4allProjects] = useState([]);
  const [work4allEquipment, setWork4allEquipment] = useState({
    meetingRooms: [],
    equipment: [],
    vehicles: []
  });
  const [work4allSocial, setWork4allSocial] = useState({
    upcomingBirthdays: [],
    companyEvents: [],
    achievements: []
  });

  const [notifications, setNotifications] = useState([]);
  const [syncProgress, setSyncProgress] = useState({
    show: false,
    type: '',
    progress: 0,
    status: '',
    details: {}
  });

  // NEUE States für Session-Tracking
  const [sessionStats, setSessionStats] = useState({
    loading: true,
    totalActiveSessions: 0,
    kioskSessions: 0,
    adminSessions: 0,
    mobileSessions: 0,
    currentPages: {},
    avgSessionDuration: 0,
    uniqueIPs: 0
  });

  const [activeSessions, setActiveSessions] = useState([]);

  // NEUE States für Kiosk-Konfiguration
  const [kioskConfig, setKioskConfig] = useState({
    loading: true,
    modules: {},
    maintenanceMode: {
      enabled: false,
      message: '',
      showETA: false,
      eta: null
    },
    displaySettings: {
      refreshInterval: 30,
      autoRotate: false,
      rotationInterval: 60,
      theme: 'default'
    },
    lastUpdated: null,
    updatedBy: null
  });

  const [kioskStats, setKioskStats] = useState({
    totalModules: 0,
    enabledModules: 0,
    disabledModules: 0,
    enabledModulesList: [],
    disabledModulesList: [],
    maintenanceMode: false,
    activeKiosks: 0,
    lastUpdated: null,
    updatedBy: null
  });

  // Toast Notification System
  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const fetchWork4AllStatus = async () => {
    try {
      const response = await axios.get('/api/work4all/status');
      setWork4allStatus(response.data);
    } catch (error) {
      console.error('work4all Status Fehler:', error);
      addNotification('❌ Fehler beim Laden des work4all Status', 'error');
    }
  };

  // NEUE Funktion für System-Informationen
  const fetchSystemInfo = async () => {
    try {
      const response = await axios.get('/api/admin/system-info');
      setSystemInfo(prev => ({
        ...prev,
        ...response.data,
        loading: false
      }));
    } catch (error) {
      console.error('System Info Fehler:', error);
      setSystemInfo(prev => ({ ...prev, loading: false }));
      addNotification('❌ Fehler beim Laden der System-Informationen', 'error');
    }
  };

  // NEUE Funktionen für work4all Dashboard-Daten
  const fetchWork4AllDashboard = async () => {
    try {
      setWork4allDashboard(prev => ({ ...prev, loading: true }));
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Kein Token verfügbar');
      
      const response = await axios.get('/api/work4all/dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Korrigiere die Datenstruktur
      setWork4allDashboard({
        loading: false,
        error: null,
        attendance: response.data.attendance,
        projects: response.data.projects,
        resources: response.data.resources,
        workforce: response.data.workforce
      });
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error);
      setWork4allDashboard(prev => ({
        ...prev,
        loading: false,
        error: 'Fehler beim Laden der Dashboard-Daten'
      }));
    }
  };

  const fetchWork4AllProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Kein Token verfügbar');
      
      const response = await axios.get('/api/work4all/project-overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWork4allProjects(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Projekt-Daten:', error);
    }
  };

  const fetchWork4AllEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Kein Token verfügbar');
      
      const response = await axios.get('/api/work4all/equipment-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWork4allEquipment(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Equipment-Daten:', error);
    }
  };

  const fetchWork4AllSocial = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Kein Token verfügbar');
      
      const response = await axios.get('/api/work4all/social-events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWork4allSocial(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Social-Event-Daten:', error);
    }
  };

  // Formatierungs-Hilfsfunktionen
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const simulateProgress = (type, duration = 10000) => {
    setSyncProgress({
      show: true,
      type: type,
      progress: 0,
      status: 'Starte Synchronisation...',
      details: {}
    });

    const steps = [
      { progress: 10, status: 'Verbindung zu work4all...' },
      { progress: 25, status: 'Lade Daten von work4all...' },
      { progress: 50, status: 'Verarbeite Daten...' },
      { progress: 75, status: 'Synchronisiere zur Datenbank...' },
      { progress: 90, status: 'Finalisiere...' },
      { progress: 100, status: 'Abgeschlossen!' }
    ];

    let currentStep = 0;
    const stepDuration = duration / steps.length;

    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setSyncProgress(prev => ({
          ...prev,
          progress: steps[currentStep].progress,
          status: steps[currentStep].status
        }));
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setSyncProgress(prev => ({ ...prev, show: false }));
        }, 1000);
      }
    }, stepDuration);

    return interval;
  };

  const handleWork4AllSync = async (type) => {
    setWork4allStatus(prev => ({ ...prev, syncing: true }));
    
    // Starte Progress-Simulation
    const progressInterval = simulateProgress(type, type === 'full' ? 15000 : 8000);
    
    try {
      let endpoint = '/api/work4all/sync';
      let typeName = 'Vollständige Synchronisation';
      
      if (type === 'employees') {
        endpoint = '/api/work4all/sync-employees';
        typeName = 'Mitarbeiter-Synchronisation';
      }
      if (type === 'vehicles') {
        endpoint = '/api/work4all/sync-vehicles';
        typeName = 'Fahrzeug-Synchronisation';
      }
      if (type === 'events') {
        endpoint = '/api/work4all/sync-events';
        typeName = 'Veranstaltungs-Synchronisation';
      }
      
      const response = await axios.post(endpoint);
      
      // Erfolgreiche Synchronisation
      clearInterval(progressInterval);
      setSyncProgress(prev => ({ 
        ...prev, 
        progress: 100, 
        status: 'Erfolgreich abgeschlossen!',
        details: response.data
      }));
      
      addNotification(
        `✅ ${typeName} erfolgreich abgeschlossen`,
        'success',
        7000
      );
      
      setTimeout(() => {
        setSyncProgress(prev => ({ ...prev, show: false }));
      }, 2000);
      
      // Status neu laden
      fetchWork4AllStatus();
    } catch (error) {
      console.error('Sync-Fehler:', error);
      clearInterval(progressInterval);
      setSyncProgress(prev => ({ ...prev, show: false }));
      
      addNotification(
        `❌ Synchronisation fehlgeschlagen: ${error.response?.data?.error || error.message}`,
        'error',
        10000
      );
    } finally {
      setWork4allStatus(prev => ({ ...prev, syncing: false }));
    }
  };

  const testWork4AllConnection = async () => {
    try {
      addNotification('🔍 Teste work4all Verbindung...', 'info', 3000);
      const response = await axios.get('/api/work4all/test');
      addNotification(
        `✅ work4all Verbindung erfolgreich: ${response.data.message}`,
        'success'
      );
    } catch (error) {
      addNotification(
        `❌ work4all Verbindung fehlgeschlagen: ${error.response?.data?.error || error.message}`,
        'error',
        8000
      );
    }
  };

  // Lade Session-Statistiken
  const loadSessionStats = async () => {
    try {
      console.log('📊 Lade Session-Statistiken...');
      const token = localStorage.getItem('token');
      console.log('🔑 Token vorhanden:', !!token);
      
      const [statsResponse, activeResponse] = await Promise.all([
        axios.get('/api/sessions/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/sessions/active', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      console.log('📈 Raw Session Stats:', statsResponse.data);
      console.log('👥 Active Sessions:', activeResponse.data);
      
      setSessionStats({
        loading: false,
        ...statsResponse.data
      });
      
      setActiveSessions(activeResponse.data);
      
      console.log('✅ Session-Statistiken erfolgreich geladen:', {
        total: statsResponse.data.totalActiveSessions,
        kiosk: statsResponse.data.kioskSessions,
        admin: statsResponse.data.adminSessions
      });
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der Session-Statistiken:', error);
      console.error('❌ Fehler-Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Setze Fallback-Werte bei Fehler
      setSessionStats({
        loading: false,
        totalActiveSessions: 0,
        kioskSessions: 0,
        adminSessions: 0,
        mobileSessions: 0,
        currentPages: {},
        avgSessionDuration: 0,
        uniqueIPs: 0,
        error: error.message
      });
      
      setActiveSessions([]);
      addNotification('❌ Fehler beim Laden der Session-Statistiken', 'error');
    }
  };

  // Lade Kiosk-Konfiguration
  const loadKioskConfig = async () => {
    try {
      console.log('📱 Lade Kiosk-Konfiguration...');
      
      const [configResponse, statsResponse] = await Promise.all([
        axios.get('/api/kiosk/config'),
        axios.get('/api/kiosk/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      setKioskConfig({
        loading: false,
        ...configResponse.data
      });
      
      setKioskStats(statsResponse.data);
      
      console.log('✅ Kiosk-Konfiguration geladen:', configResponse.data);
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der Kiosk-Konfiguration:', error);
      setKioskConfig(prev => ({ ...prev, loading: false }));
      addNotification('❌ Fehler beim Laden der Kiosk-Konfiguration', 'error');
    }
  };

  // Einzelnes Modul umschalten
  const toggleKioskModule = async (moduleName, enabled) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`/api/kiosk/module/${moduleName}`, 
        { enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Aktualisiere lokalen State
      setKioskConfig(prev => ({
        ...prev,
        modules: {
          ...prev.modules,
          [moduleName]: {
            ...prev.modules[moduleName],
            enabled
          }
        },
        lastUpdated: new Date().toISOString()
      }));
      
      addNotification(
        `${response.data.message} (${response.data.notifiedSessions} Kiosks benachrichtigt)`,
        'success'
      );
      
      // Stats neu laden
      loadKioskConfig();
      
    } catch (error) {
      console.error('❌ Fehler beim Umschalten des Moduls:', error);
      addNotification('❌ Fehler beim Umschalten des Moduls', 'error');
    }
  };

  // Wartungsmodus umschalten
  const toggleMaintenanceMode = async (enabled, message = '', eta = null) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch('/api/kiosk/maintenance', 
        { enabled, message, eta },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setKioskConfig(prev => ({
        ...prev,
        maintenanceMode: response.data.maintenanceMode,
        lastUpdated: new Date().toISOString()
      }));
      
      addNotification(
        `${response.data.message} (${response.data.notifiedSessions} Kiosks benachrichtigt)`,
        enabled ? 'warning' : 'success'
      );
      
      loadKioskConfig();
      
    } catch (error) {
      console.error('❌ Fehler beim Umschalten des Wartungsmodus:', error);
      addNotification('❌ Fehler beim Umschalten des Wartungsmodus', 'error');
    }
  };

  // Alle Module aktivieren/deaktivieren
  const toggleAllModules = async (enabled) => {
    try {
      const token = localStorage.getItem('token');
      const modules = {};
      
      Object.keys(kioskConfig.modules).forEach(moduleKey => {
        modules[moduleKey] = { enabled };
      });
      
      const response = await axios.put('/api/kiosk/config', 
        { modules },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setKioskConfig(prev => ({
        ...prev,
        modules: {
          ...prev.modules,
          ...Object.keys(prev.modules).reduce((acc, key) => ({
            ...acc,
            [key]: { ...prev.modules[key], enabled }
          }), {})
        },
        lastUpdated: new Date().toISOString()
      }));
      
      addNotification(
        `Alle Module ${enabled ? 'aktiviert' : 'deaktiviert'} (${response.data.notifiedSessions} Kiosks benachrichtigt)`,
        'success'
      );
      
      loadKioskConfig();
      
    } catch (error) {
      console.error('❌ Fehler beim Umschalten aller Module:', error);
      addNotification('❌ Fehler beim Umschalten aller Module', 'error');
    }
  };

  // Modal-Funktionen
  const openModal = async (type, title) => {
    try {
      let data = [];
      const token = localStorage.getItem('token');
      
      switch (type) {
        case 'vehicles':
          addNotification('🚗 Lade Fahrzeug-Details...', 'info', 2000);
          const vehiclesResponse = await axios.get('/api/vehicles', {
            headers: { Authorization: `Bearer ${token}` }
          });
          data = vehiclesResponse.data.filter(v => v.status === 'verfügbar');
          break;
          
        case 'onsite':
          addNotification('👥 Lade Vor-Ort-Personal...', 'info', 2000);
          const employeesResponse = await axios.get('/api/employees', {
            headers: { Authorization: `Bearer ${token}` }
          });
          data = employeesResponse.data.filter(e => 
            e.is_active_employee && 
            e.employment_status !== 'urlaub' && 
            e.employment_status !== 'krank' &&
            e.work_location !== 'remote'
          );
          break;
          
        case 'projects':
          addNotification('🚀 Lade Projekt-Details...', 'info', 2000);
          data = work4allProjects; // Bereits geladen
          break;
          
        case 'deadlines':
          addNotification('⏰ Lade Termine...', 'info', 2000);
          const tradeshowsResponse = await axios.get('/api/tradeshows', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const now = new Date();
          const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          data = tradeshowsResponse.data.filter(ts => {
            const startDate = new Date(ts.start_date);
            return startDate >= now && startDate <= nextWeek;
          });
          break;
          
        default:
          addNotification('❌ Unbekannter Modal-Typ', 'error');
          return;
      }
      
      setModalState({
        isOpen: true,
        type,
        title,
        data
      });
      
    } catch (error) {
      console.error('Modal-Lade-Fehler:', error);
      addNotification('❌ Fehler beim Laden der Modal-Daten', 'error');
    }
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: '',
      title: '',
      data: []
    });
  };

  useEffect(() => {
    fetchWork4AllStatus();
    fetchSystemInfo();
    fetchWork4AllDashboard();
    fetchWork4AllProjects();
    fetchWork4AllEquipment();
    fetchWork4AllSocial();
    loadSessionStats();
    loadKioskConfig();
    
    // Aktualisiere System-Info alle 30 Sekunden
    const interval = setInterval(() => {
      fetchSystemInfo();
      fetchWork4AllDashboard();
      loadSessionStats();
      loadKioskConfig();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '30px',
      textAlign: 'center'
    },
    section: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#34495e',
      marginBottom: '15px'
    },
    statusGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    },
    statusCard: {
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '6px',
      textAlign: 'center'
    },
    statusTitle: {
      fontSize: '14px',
      color: '#6c757d',
      marginBottom: '5px'
    },
    statusValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#2c3e50'
    },
    buttonGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '10px'
    },
    button: {
      padding: '12px 20px',
      fontSize: '16px',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.3s'
    },
    primaryButton: {
      backgroundColor: '#3498db',
      color: 'white'
    },
    successButton: {
      backgroundColor: '#27ae60',
      color: 'white'
    },
    warningButton: {
      backgroundColor: '#f39c12',
      color: 'white'
    },
    connectionStatus: {
      padding: '10px 15px',
      borderRadius: '6px',
      marginBottom: '15px',
      fontWeight: 'bold'
    },
    connected: {
      backgroundColor: '#d4edda',
      color: '#155724',
      border: '1px solid #c3e6cb'
    },
    disconnected: {
      backgroundColor: '#f8d7da',
      color: '#721c24', 
      border: '1px solid #f5c6cb'
    },
    // Toast Notification Styles
    toastContainer: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    toast: {
      backgroundColor: 'white',
      padding: '15px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      borderLeft: '4px solid',
      minWidth: '300px',
      maxWidth: '500px',
      animation: 'slideIn 0.3s ease-out'
    },
    toastSuccess: {
      borderLeftColor: '#27ae60'
    },
    toastError: {
      borderLeftColor: '#e74c3c'
    },
    toastInfo: {
      borderLeftColor: '#3498db'
    },
    toastWarning: {
      borderLeftColor: '#f39c12'
    },
    toastClose: {
      float: 'right',
      background: 'none',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      color: '#95a5a6'
    },
    // Progress Bar Styles
    progressOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    },
    progressModal: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      minWidth: '400px',
      textAlign: 'center'
    },
    progressTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: '#2c3e50'
    },
    progressBarContainer: {
      backgroundColor: '#ecf0f1',
      borderRadius: '10px',
      height: '20px',
      marginBottom: '15px',
      overflow: 'hidden'
    },
    progressBar: {
      height: '100%',
      backgroundColor: '#3498db',
      borderRadius: '10px',
      transition: 'width 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    progressStatus: {
      fontSize: '16px',
      color: '#7f8c8d',
      marginBottom: '10px'
    }
  };

  // Modal-Komponente
  const DetailModal = () => {
    if (!modalState.isOpen) return null;

    const renderModalContent = () => {
      switch (modalState.type) {
        case 'vehicles':
          return modalState.data.map(vehicle => (
            <div key={vehicle.id} style={{
              padding: '15px',
              border: '1px solid #ecf0f1',
              borderRadius: '8px',
              marginBottom: '10px',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                🚗 {vehicle.brand} {vehicle.model}
              </div>
              <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
                🆔 {vehicle.license_plate} | 📅 Typ: {vehicle.vehicle_type} | 🎨 {vehicle.color}
              </div>
              <div style={{ color: '#27ae60', fontSize: '12px', marginTop: '5px' }}>
                ✅ Verfügbar | 🛣️ {vehicle.mileage || 0} km
              </div>
            </div>
          ));
          
        case 'onsite':
          return modalState.data.map(employee => (
            <div key={employee.id} style={{
              padding: '15px',
              border: '1px solid #ecf0f1',
              borderRadius: '8px',
              marginBottom: '10px',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                👤 {employee.name}
              </div>
              <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
                🏢 {employee.department} | 💼 {employee.position_title}
              </div>
              <div style={{ color: '#27ae60', fontSize: '12px', marginTop: '5px' }}>
                📍 {employee.work_location} | 📧 {employee.email}
              </div>
            </div>
          ));
          
        case 'projects':
          return modalState.data.map(project => (
            <div key={project.id} style={{
              padding: '15px',
              border: '1px solid #ecf0f1',
              borderRadius: '8px',
              marginBottom: '10px',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                🚀 {project.name}
              </div>
              <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '5px' }}>
                👨‍💼 {project.responsible} | 📅 Deadline: {new Date(project.deadline).toLocaleDateString('de-DE')}
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '3px' }}>
                  Fortschritt: {project.progress}%
                </div>
                <div style={{
                  backgroundColor: '#ecf0f1',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    backgroundColor: project.progress >= 80 ? '#27ae60' : 
                                   project.progress >= 50 ? '#f39c12' : '#3498db',
                    height: '100%',
                    width: `${project.progress}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            </div>
          ));
          
        case 'deadlines':
          return modalState.data.map(event => (
            <div key={event.id} style={{
              padding: '15px',
              border: '1px solid #ecf0f1',
              borderRadius: '8px',
              marginBottom: '10px',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                🎪 {event.name}
              </div>
              <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
                📍 {event.location} | 📅 {new Date(event.start_date).toLocaleDateString('de-DE')} - {new Date(event.end_date).toLocaleDateString('de-DE')}
              </div>
              <div style={{ color: '#3498db', fontSize: '12px', marginTop: '5px' }}>
                📝 {event.description || 'Keine Beschreibung verfügbar'}
              </div>
            </div>
          ));
          
        default:
          return <div>Keine Daten verfügbar</div>;
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          maxWidth: '800px',
          maxHeight: '80vh',
          width: '90%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid #ecf0f1',
            paddingBottom: '15px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#2c3e50',
              margin: 0
            }}>
              {modalState.title} ({modalState.data.length})
            </h2>
            <button
              onClick={closeModal}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#95a5a6',
                padding: '5px'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
            {modalState.data.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#7f8c8d',
                padding: '40px',
                fontSize: '16px'
              }}>
                Keine Daten verfügbar
              </div>
            ) : (
              renderModalContent()
            )}
          </div>
          
          <div style={{
            borderTop: '1px solid #ecf0f1',
            paddingTop: '15px',
            marginTop: '15px',
            textAlign: 'right'
          }}>
            <button
              onClick={closeModal}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Progress Modal Component
  const ProgressModal = () => {
    if (!syncProgress.show) return null;

    return (
      <div style={styles.progressOverlay}>
        <div style={styles.progressModal}>
          <div style={styles.progressTitle}>
            🔄 {syncProgress.type === 'full' ? 'Vollständige Synchronisation' : 
                syncProgress.type === 'employees' ? 'Mitarbeiter-Synchronisation' :
                syncProgress.type === 'vehicles' ? 'Fahrzeug-Synchronisation' :
                syncProgress.type === 'events' ? 'Veranstaltungs-Synchronisation' : 'Synchronisation'}
          </div>
          
          <div style={styles.progressBarContainer}>
            <div 
              style={{
                ...styles.progressBar,
                width: `${syncProgress.progress}%`
              }}
            >
              {syncProgress.progress}%
            </div>
          </div>
          
          <div style={styles.progressStatus}>
            {syncProgress.status}
          </div>
          
          {syncProgress.details && Object.keys(syncProgress.details).length > 0 && (
            <div style={{ fontSize: '14px', color: '#95a5a6', marginTop: '10px' }}>
              Details werden nach Abschluss angezeigt...
            </div>
          )}
        </div>
      </div>
    );
  };

  // Toast Notification Component
  const ToastNotification = ({ notification }) => {
    const getToastStyle = () => {
      switch (notification.type) {
        case 'success': return { ...styles.toast, ...styles.toastSuccess };
        case 'error': return { ...styles.toast, ...styles.toastError };
        case 'warning': return { ...styles.toast, ...styles.toastWarning };
        default: return { ...styles.toast, ...styles.toastInfo };
      }
    };

    return (
      <div style={getToastStyle()}>
        <button 
          style={styles.toastClose}
          onClick={() => removeNotification(notification.id)}
        >
          ×
        </button>
        <div>{notification.message}</div>
      </div>
    );
  };

  return (
    <Layout>
      <div style={styles.container}>
        {/* Toast Notifications */}
        <div style={styles.toastContainer}>
          {notifications.map(notification => (
            <ToastNotification key={notification.id} notification={notification} />
          ))}
        </div>

        {/* Progress Modal */}
        <ProgressModal />

        {/* Detail Modal */}
        <DetailModal />

        <h1 style={styles.header}>🔧 Admin Panel</h1>
        
        {/* work4all Synchronisation */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔄 work4all Integration</h2>
          
          <div style={{
            ...styles.connectionStatus,
            ...(work4allStatus.isConnected ? styles.connected : styles.disconnected)
          }}>
            {work4allStatus.isConnected ? '✅ work4all verbunden' : '❌ work4all nicht verbunden'}
            {work4allStatus.lastSync && ` | Letzte Sync: ${new Date(work4allStatus.lastSync).toLocaleString('de-DE')}`}
          </div>

          <div style={styles.statusGrid}>
            <div style={styles.statusCard}>
              <div style={styles.statusTitle}>Alle Mitarbeiter</div>
              <div style={styles.statusValue}>{work4allStatus.employees}</div>
            </div>
            <div style={styles.statusCard}>
              <div style={styles.statusTitle}>Fahrzeuge</div>
              <div style={styles.statusValue}>{work4allStatus.vehicles}</div>
            </div>
            <div style={styles.statusCard}>
              <div style={styles.statusTitle}>Veranstaltungen</div>
              <div style={styles.statusValue}>{work4allStatus.events}</div>
            </div>
          </div>

          <div style={styles.buttonGrid}>
            <button
              style={{...styles.button, ...styles.primaryButton}}
              onClick={testWork4AllConnection}
              disabled={work4allStatus.syncing}
            >
              🔍 Verbindung testen
            </button>
            
            <button
              style={{...styles.button, ...styles.successButton}}
              onClick={() => handleWork4AllSync('employees')}
              disabled={work4allStatus.syncing}
            >
              👥 Lagermitarbeiter sync
            </button>
            
            <button
              style={{...styles.button, ...styles.successButton}}
              onClick={() => handleWork4AllSync('vehicles')}
              disabled={work4allStatus.syncing}
            >
              🚗 Fahrzeuge sync
            </button>
            
            <button
              style={{...styles.button, ...styles.warningButton}}
              onClick={() => handleWork4AllSync('events')}
              disabled={work4allStatus.syncing}
            >
              🎪 Veranstaltungen sync
            </button>
            
            <button
              style={{...styles.button, ...styles.warningButton}}
              onClick={() => handleWork4AllSync('full')}
              disabled={work4allStatus.syncing}
            >
              {work4allStatus.syncing ? '⏳ Synchronisiert...' : '🔄 Vollständige Sync'}
            </button>
          </div>
        </div>

        {/* work4all Dashboard-Übersicht */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🌐 work4all Dashboard-Übersicht</h2>
          
          {work4allDashboard.loading ? (
            <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
              🔄 Lade work4all Dashboard-Daten...
            </div>
          ) : (
            <div>
              {/* Anwesenheit - NUR ECHTE WORK4ALL DATEN */}
              <div style={{
                backgroundColor: '#e8f5e8',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #27ae60'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
                  👥 Anwesenheit & Personal (aus work4all: {work4allStatus.employees} Mitarbeiter)
                </h3>
                
                <div style={styles.statusGrid}>
                  <div style={{
                    ...styles.statusCard,
                    cursor: 'pointer',
                    border: work4allDashboard.attendance.currentlyOnSite > 0 ? '2px solid #27ae60' : '1px solid #ecf0f1'
                  }}
                  onClick={() => {
                    if (work4allDashboard.attendance.currentlyOnSite > 0) {
                      openModal('onsite', '👥 Vor-Ort-Personal');
                    }
                  }}>
                    <div style={styles.statusTitle}>🏢 Vor Ort</div>
                    <div style={styles.statusValue}>{work4allDashboard.attendance.currentlyOnSite}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                      {work4allDashboard.attendance.currentlyOnSite > 0 ? 'Klicken für Liste' : 'Niemand vor Ort'}
                    </div>
                  </div>
                  
                  <div style={{
                    ...styles.statusCard,
                    cursor: 'pointer',
                    border: work4allDashboard.attendance.onVacation > 0 ? '2px solid #3498db' : '1px solid #ecf0f1'
                  }}
                  onClick={() => {
                    if (work4allDashboard.attendance.onVacation > 0) {
                      addNotification('🏖️ Urlaub-Details: work4all API /api/Urlaub/query wird implementiert', 'info');
                    }
                  }}>
                    <div style={styles.statusTitle}>🏖️ Urlaub</div>
                    <div style={styles.statusValue}>{work4allDashboard.attendance.onVacation}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                      {work4allDashboard.attendance.onVacation > 0 ? 'Klicken für Details' : 'Aktuell niemand'}
                    </div>
                  </div>
                  
                  <div style={{
                    ...styles.statusCard,
                    cursor: 'pointer',
                    border: work4allDashboard.attendance.onSickLeave > 0 ? '2px solid #e74c3c' : '1px solid #ecf0f1'
                  }}
                  onClick={() => {
                    if (work4allDashboard.attendance.onSickLeave > 0) {
                      addNotification('🤒 Krankheit-Details: work4all API /api/Krankheit/query wird implementiert', 'info');
                    }
                  }}>
                    <div style={styles.statusTitle}>🤒 Krank</div>
                    <div style={styles.statusValue}>{work4allDashboard.attendance.onSickLeave}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                      {work4allDashboard.attendance.onSickLeave > 0 ? 'Klicken für Details' : 'Aktuell niemand'}
                    </div>
                  </div>
                </div>
                
                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  backgroundColor: 'rgba(52, 152, 219, 0.1)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#2c3e50'
                }}>
                  💡 <strong>Info:</strong> Anwesenheitsdaten werden direkt aus work4all-System bezogen. 
                  Remote-Arbeit wird nur angezeigt wenn work4all API echte Daten liefert.
                </div>
              </div>

              {/* Projekte */}
              <div style={{
                backgroundColor: '#fff3e0',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #f39c12'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
                  📊 Projekte & Aufgaben (basiert auf {work4allStatus.events} Veranstaltungen)
                </h3>
                
                <div style={styles.statusGrid}>
                  <div style={{
                    ...styles.statusCard,
                    cursor: 'pointer',
                    border: work4allDashboard.projects.activeProjects > 0 ? '2px solid #3498db' : '1px solid #ecf0f1'
                  }}
                  onClick={() => {
                    if (work4allDashboard.projects.activeProjects > 0) {
                      openModal('projects', '🚀 Aktive Projekte');
                    }
                  }}>
                    <div style={styles.statusTitle}>🚀 Aktive Projekte</div>
                    <div style={styles.statusValue}>{work4allDashboard.projects.activeProjects}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                      {work4allDashboard.projects.activeProjects > 0 ? 'Klicken für Details' : 'Keine aktiven'}
                    </div>
                  </div>
                  
                  <div style={{
                    ...styles.statusCard,
                    cursor: 'pointer',
                    border: work4allDashboard.projects.upcomingDeadlines > 0 ? '2px solid #f39c12' : '1px solid #ecf0f1'
                  }}
                  onClick={() => {
                    if (work4allDashboard.projects.upcomingDeadlines > 0) {
                      openModal('deadlines', '⏰ Kommende Termine (7 Tage)');
                    }
                  }}>
                    <div style={styles.statusTitle}>⏰ Termine (7 Tage)</div>
                    <div style={styles.statusValue}>{work4allDashboard.projects.upcomingDeadlines}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                      {work4allDashboard.projects.upcomingDeadlines > 0 ? 'Klicken für Liste' : 'Keine Termine'}
                    </div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>⚠️ Überfällig</div>
                    <div style={styles.statusValue}>{work4allDashboard.projects.overdueTasks}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                      Arbeitsplan-Aufgaben
                    </div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>✅ Diese Woche</div>
                    <div style={styles.statusValue}>{work4allDashboard.projects.completedThisWeek}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                      Abgeschlossene Tasks
                    </div>
                  </div>
                </div>
              </div>

              {/* Fahrzeuge & Transport - ECHTE DATEN mit Modals */}
              <div style={{
                backgroundColor: '#f0f8ff',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #3498db'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
                  🚗 Fahrzeuge & Transport (aus work4all: {work4allStatus.vehicles} Fahrzeuge)
                </h3>
                
                <div style={styles.statusGrid}>
                  <div style={{
                    ...styles.statusCard,
                    cursor: 'pointer',
                    border: work4allDashboard.resources.availableVehicles > 0 ? '2px solid #27ae60' : '1px solid #ecf0f1'
                  }}
                  onClick={() => {
                    if (work4allDashboard.resources.availableVehicles > 0) {
                      openModal('vehicles', '🚗 Verfügbare Fahrzeuge');
                    }
                  }}>
                    <div style={styles.statusTitle}>🚗 Verfügbare Fahrzeuge</div>
                    <div style={styles.statusValue}>{work4allDashboard.resources.availableVehicles}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                      {work4allDashboard.resources.availableVehicles > 0 ? 'Klicken für Liste' : 'Keine verfügbar'}
                    </div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>🔧 In Wartung</div>
                    <div style={styles.statusValue}>{work4allDashboard.resources.maintenanceScheduled}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                      Fahrzeuge werden gewartet
                    </div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>📱 Unterwegs</div>
                    <div style={styles.statusValue}>{work4allStatus.vehicles - work4allDashboard.resources.availableVehicles - work4allDashboard.resources.maintenanceScheduled}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                      Aktuell im Einsatz
                    </div>
                  </div>
                </div>
                
                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  backgroundColor: 'rgba(52, 152, 219, 0.1)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#2c3e50'
                }}>
                  💡 <strong>Info:</strong> Fahrzeugdaten sind echte Zahlen aus der Datenbank. 
                  Meeting-Räume und Equipment werden nur mit echter work4all API angezeigt.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* work4all Projekt-Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📋 Aktuelle Projekte (generiert aus DB-Daten)</h2>
          
          {work4allProjects.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
              📭 Lade Projekte aus Arbeitsplan und Messen...
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {work4allProjects.map((project, index) => (
                <div key={index} style={{
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #ecf0f1',
                  borderLeft: `4px solid ${
                    project.priority === 'Kritisch' ? '#e74c3c' :
                    project.priority === 'Hoch' ? '#f39c12' : '#3498db'
                  }`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', margin: '0 0 5px 0' }}>
                        {project.name}
                      </h3>
                      <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                        {project.id} • {project.responsible}
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: project.priority === 'Kritisch' ? '#e74c3c' :
                                     project.priority === 'Hoch' ? '#f39c12' : '#3498db',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {project.priority}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '14px', color: '#7f8c8d' }}>Fortschritt</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>{project.progress}%</span>
                    </div>
                    <div style={{
                      backgroundColor: '#ecf0f1',
                      borderRadius: '10px',
                      height: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        backgroundColor: project.progress >= 80 ? '#27ae60' : 
                                       project.progress >= 50 ? '#f39c12' : '#3498db',
                        height: '100%',
                        width: `${project.progress}%`,
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                    <div>
                      <strong>📅 Deadline:</strong><br/>
                      {new Date(project.deadline).toLocaleDateString('de-DE')}
                    </div>
                    <div>
                      <strong>🎯 Nächster Meilenstein:</strong><br/>
                      {project.nextMilestone} ({new Date(project.milestoneDate).toLocaleDateString('de-DE')})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#2c3e50'
          }}>
            💡 <strong>Info:</strong> Projekte werden intelligent aus Arbeitsplan ({work4allStatus.tasks || 0} Aufgaben), 
            Messen ({work4allStatus.events} Events) und Fahrzeugwartungen generiert.
          </div>
        </div>

        {/* System Status */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📊 System Status</h2>
          
          {systemInfo.loading ? (
            <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
              🔄 Lade System-Informationen...
            </div>
          ) : (
            <div>
              {/* Server-Informationen */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ecf0f1'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
                  🖥️ Server-Informationen
                </h3>
                
                <div style={styles.statusGrid}>
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>Plattform</div>
                    <div style={styles.statusValue}>
                      {systemInfo.server.platform || 'Linux'} 
                      {systemInfo.server.cpu?.cores && ` (${systemInfo.server.cpu.cores} Kerne)`}
                    </div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>Laufzeit</div>
                    <div style={styles.statusValue}>{formatUptime(systemInfo.server.uptime || 0)}</div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>Speicher</div>
                    <div style={styles.statusValue}>
                      {formatBytes(systemInfo.server.memory?.used || 0)} / {formatBytes(systemInfo.server.memory?.total || 1024 * 1024 * 1024)}
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        {systemInfo.server.memory?.total > 0 ? 
                          `${Math.round((systemInfo.server.memory.used / systemInfo.server.memory.total) * 100)}% belegt` : 
                          'Nicht verfügbar'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>CPU-Auslastung</div>
                    <div style={styles.statusValue}>
                      {systemInfo.server.cpu?.usage !== undefined ? 
                        `${Math.round(systemInfo.server.cpu.usage)}%` : 
                        'Nicht verfügbar'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Datenbank-Statistiken */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ecf0f1'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
                  💾 Datenbank-Statistiken
                </h3>
                
                <div style={styles.statusGrid}>
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>📝 Posts</div>
                    <div style={styles.statusValue}>{systemInfo.database.posts || 0}</div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>📰 News</div>
                    <div style={styles.statusValue}>{systemInfo.database.news || 0}</div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>🎪 Messen</div>
                    <div style={styles.statusValue}>{systemInfo.database.tradeshows || 0}</div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>👥 Lagermitarbeiter</div>
                    <div style={styles.statusValue}>{systemInfo.database.employees || 0}</div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>📋 Arbeitsplan</div>
                    <div style={styles.statusValue}>{systemInfo.database.workplanTasks || 0}</div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>📊 DB-Größe</div>
                    <div style={styles.statusValue}>{formatBytes(systemInfo.database.size || 0)}</div>
                  </div>
                </div>
              </div>

              {/* Digitales Brett Status - ECHTE SESSION-DATEN */}
              <div style={{
                backgroundColor: '#e8f4fd',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #3498db'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
                  📱 Digitales Brett Status (Echte Session-Daten)
                </h3>
                
                {sessionStats.loading ? (
                  <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
                    🔄 Lade Session-Daten...
                  </div>
                ) : (
                  <>
                    {sessionStats.error && (
                      <div style={{
                        backgroundColor: '#ffebee',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '15px',
                        border: '1px solid #f44336',
                        fontSize: '14px',
                        color: '#c62828'
                      }}>
                        ⚠️ Fehler beim Laden: {sessionStats.error}
                      </div>
                    )}
                    
                    <div style={styles.statusGrid}>
                      <div style={styles.statusCard}>
                        <div style={styles.statusTitle}>🟢 Aktive Sessions</div>
                        <div style={styles.statusValue}>{sessionStats.totalActiveSessions || 0}</div>
                      </div>
                      
                      <div style={styles.statusCard}>
                        <div style={styles.statusTitle}>📺 Kiosk-Modus</div>
                        <div style={styles.statusValue}>
                          {sessionStats.kioskSessions > 0 ? '✅ Verbunden' : '❌ Getrennt'}
                          {sessionStats.kioskSessions > 0 && ` (${sessionStats.kioskSessions})`}
                        </div>
                      </div>
                      
                      <div style={styles.statusCard}>
                        <div style={styles.statusTitle}>👤 Admin-Sessions</div>
                        <div style={styles.statusValue}>{sessionStats.adminSessions || 0}</div>
                      </div>
                      
                      <div style={styles.statusCard}>
                        <div style={styles.statusTitle}>📱 Mobile Sessions</div>
                        <div style={styles.statusValue}>{sessionStats.mobileSessions || 0}</div>
                      </div>
                      
                      <div style={styles.statusCard}>
                        <div style={styles.statusTitle}>⏱️ Ø Session-Dauer</div>
                        <div style={styles.statusValue}>
                          {sessionStats.avgSessionDuration || 0} Min
                        </div>
                      </div>
                      
                      <div style={styles.statusCard}>
                        <div style={styles.statusTitle}>🌐 Eindeutige IPs</div>
                        <div style={styles.statusValue}>{sessionStats.uniqueIPs || 0}</div>
                      </div>
                    </div>
                    
                    {/* Debug-Informationen */}
                    {process.env.NODE_ENV === 'development' && (
                      <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '10px',
                        borderRadius: '4px',
                        marginTop: '10px',
                        fontSize: '12px',
                        color: '#6c757d'
                      }}>
                        🔧 Debug: Loading={sessionStats.loading ? 'true' : 'false'}, 
                        Error={sessionStats.error || 'none'}, 
                        LastUpdate={new Date().toLocaleTimeString()}
                      </div>
                    )}
                    
                    {/* Aktuelle Seiten */}
                    {Object.keys(sessionStats.currentPages || {}).length > 0 && (
                      <div style={{ marginTop: '15px' }}>
                        <h4 style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '10px' }}>
                          📊 Aktuelle Seiten:
                        </h4>
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '8px' 
                        }}>
                          {Object.entries(sessionStats.currentPages || {}).map(([page, count]) => (
                            <div 
                              key={page}
                              style={{
                                backgroundColor: '#3498db',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {page}: {count}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Aktive Sessions Liste */}
                    {activeSessions.length > 0 && (
                      <div style={{ marginTop: '15px' }}>
                        <h4 style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '10px' }}>
                          🔗 Aktive Sessions ({activeSessions.length}):
                        </h4>
                        <div style={{ 
                          maxHeight: '150px', 
                          overflowY: 'auto',
                          backgroundColor: '#f8f9fa',
                          padding: '10px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {activeSessions.map((session, index) => (
                            <div key={session.clientId} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '4px 0',
                              borderBottom: index < activeSessions.length - 1 ? '1px solid #ecf0f1' : 'none'
                            }}>
                              <span>
                                <strong>{session.clientType}</strong> → {session.currentPage}
                              </span>
                              <span style={{ color: '#7f8c8d' }}>
                                {session.duration}min | {session.ip}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Kiosk-Konfiguration */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📱 Kiosk-Konfiguration (Echtzeit)</h2>
          
          {kioskConfig.loading ? (
            <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '20px' }}>
              🔄 Lade Kiosk-Konfiguration...
            </div>
          ) : (
            <div>
              {/* Status-Übersicht */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ecf0f1'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
                  📊 Kiosk Status-Übersicht
                </h3>
                
                <div style={styles.statusGrid}>
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>📺 Aktive Kiosks</div>
                    <div style={styles.statusValue}>{kioskStats.activeKiosks || 0}</div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>✅ Aktive Module</div>
                    <div style={styles.statusValue}>{kioskStats.enabledModules || 0}/{kioskStats.totalModules || 0}</div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>🔧 Wartungsmodus</div>
                    <div style={styles.statusValue}>
                      {kioskConfig.maintenanceMode.enabled ? '🔴 AN' : '🟢 AUS'}
                    </div>
                  </div>
                  
                  <div style={styles.statusCard}>
                    <div style={styles.statusTitle}>⏱️ Letzte Änderung</div>
                    <div style={styles.statusValue}>
                      {kioskConfig.lastUpdated ? 
                        new Date(kioskConfig.lastUpdated).toLocaleTimeString('de-DE') : 
                        'Nie'
                      }
                    </div>
                  </div>
                </div>
                
                {kioskConfig.updatedBy && (
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#7f8c8d', textAlign: 'center' }}>
                    Letzte Änderung von: <strong>{kioskConfig.updatedBy}</strong>
                  </div>
                )}
              </div>

              {/* Wartungsmodus Steuerung */}
              <div style={{
                backgroundColor: kioskConfig.maintenanceMode.enabled ? '#ffebee' : '#e8f5e8',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: `1px solid ${kioskConfig.maintenanceMode.enabled ? '#f44336' : '#4caf50'}`
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
                  🔧 Wartungsmodus
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <button
                    style={{
                      ...styles.button,
                      ...(kioskConfig.maintenanceMode.enabled ? styles.warningButton : styles.successButton)
                    }}
                    onClick={() => toggleMaintenanceMode(!kioskConfig.maintenanceMode.enabled)}
                  >
                    {kioskConfig.maintenanceMode.enabled ? '🔴 Wartungsmodus DEAKTIVIEREN' : '🟢 Wartungsmodus AKTIVIEREN'}
                  </button>
                  
                  {!kioskConfig.maintenanceMode.enabled && (
                    <span style={{ fontSize: '14px', color: '#27ae60' }}>
                      ✅ Alle Kiosks sind betriebsbereit
                    </span>
                  )}
                </div>
                
                {kioskConfig.maintenanceMode.enabled && (
                  <div style={{
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    <strong>🔴 Wartungsmodus aktiv:</strong><br/>
                    {kioskConfig.maintenanceMode.message}
                  </div>
                )}
              </div>

              {/* Modul-Steuerung */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ecf0f1'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
                  🎛️ Modul-Steuerung
                </h3>
                
                {/* Alle Module Controls */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                  <button
                    style={{...styles.button, ...styles.successButton}}
                    onClick={() => toggleAllModules(true)}
                  >
                    ✅ Alle aktivieren
                  </button>
                  <button
                    style={{...styles.button, ...styles.warningButton}}
                    onClick={() => toggleAllModules(false)}
                  >
                    ❌ Alle deaktivieren
                  </button>
                </div>
                
                {/* Einzelne Module */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '10px'
                }}>
                  {Object.entries(kioskConfig.modules || {}).map(([moduleKey, module]) => (
                    <div 
                      key={moduleKey}
                      style={{
                        backgroundColor: module.enabled ? '#e8f5e8' : '#ffebee',
                        padding: '15px',
                        borderRadius: '6px',
                        border: `1px solid ${module.enabled ? '#4caf50' : '#f44336'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                          {module.label}
                        </div>
                        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                          {module.description}
                        </div>
                      </div>
                      
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        <input
                          type="checkbox"
                          checked={module.enabled}
                          onChange={(e) => toggleKioskModule(moduleKey, e.target.checked)}
                          style={{
                            width: '20px',
                            height: '20px',
                            marginRight: '8px',
                            cursor: 'pointer'
                          }}
                        />
                        {module.enabled ? (
                          <span style={{ color: '#4caf50' }}>✅ AN</span>
                        ) : (
                          <span style={{ color: '#f44336' }}>❌ AUS</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aktive Module Liste */}
              {kioskStats.enabledModulesList && kioskStats.enabledModulesList.length > 0 && (
                <div style={{
                  backgroundColor: '#e8f5e8',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #4caf50'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px' }}>
                    ✅ Aktuell aktive Module ({kioskStats.enabledModulesList.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {kioskStats.enabledModulesList.map(module => (
                      <span
                        key={module}
                        style={{
                          backgroundColor: '#4caf50',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {kioskConfig.modules[module]?.label || module}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          .toast-slide-in {
            animation: slideIn 0.3s ease-out;
          }
        `}</style>
      </div>
    </Layout>
  );
};

export default AdminPanel; 