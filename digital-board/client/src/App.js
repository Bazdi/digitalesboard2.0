// client/src/App.js - VERBESSERTE VERSION mit Token-Management
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminPanel from './pages/AdminPanel';
import KioskView from './pages/KioskView';
import NewsKioskView from './pages/NewsKioskView';
import NewsManagement from './pages/NewsManagement';
import PostsManagement from './pages/PostsManagement';
import VehicleManagement from './pages/VehicleManagement';
import TradeShowCalendar from './pages/TradeShowCalendar';
import WorkPlan from './pages/WorkPlan';
import BirthdayList from './pages/BirthdayList';
import PhoneList from './pages/PhoneList';
import Organigramm from './pages/Organigramm';
import WarehouseOverview from './pages/WarehouseOverview';
import WarehouseInventory from './pages/WarehouseInventory';
import WarehouseMovements from './pages/WarehouseMovements';
import WarehouseView3D from './pages/WarehouseView3D';
import EmployeeManagement from './pages/EmployeeManagement';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Token-Validierung Helper
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Prüfe ob Token in den nächsten 5 Minuten abläuft
      return payload.exp > (currentTime + 300);
    } catch (error) {
      console.error('Token-Validierung fehlgeschlagen:', error);
      return false;
    }
  };

  // Logout-Funktion
  const logout = () => {
    console.log('🚪 Logout wird durchgeführt...');
    
    // Local Storage komplett leeren
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // State zurücksetzen
    setUser(null);
    
    // Axios Default Headers löschen
    delete axios.defaults.headers.common['Authorization'];
    
    console.log('✅ Logout erfolgreich');
    
    // Optional: Seite neu laden für sauberen Zustand
    window.location.href = '/login';
  };

  // Login-Funktion
  const login = (userData, token) => {
    console.log('🔐 Login wird durchgeführt...', userData.username);
    
    if (!isTokenValid(token)) {
      console.error('❌ Token ist ungültig oder abgelaufen');
      alert('Token ist ungültig. Bitte versuchen Sie es erneut.');
      return;
    }
    
    // Daten speichern
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Axios Default Header setzen
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // State setzen
    setUser(userData);
    
    console.log('✅ Login erfolgreich');
  };

  // App-Initialisierung
  useEffect(() => {
    console.log('🚀 App wird initialisiert...');
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      console.log('🔍 Gespeicherte Anmeldedaten gefunden');
      
      if (isTokenValid(token)) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('✅ Token ist gültig, automatischer Login für:', parsedUser.username);
          
          // Axios Default Header setzen
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(parsedUser);
        } catch (error) {
          console.error('❌ Fehler beim Parsen der Benutzerdaten:', error);
          logout();
        }
      } else {
        console.log('⚠️ Token ist abgelaufen, automatischer Logout');
        logout();
      }
    } else {
      console.log('ℹ️ Keine gespeicherten Anmeldedaten gefunden');
    }
    
    setLoading(false);
  }, []);

  // Axios Interceptor für automatischen Logout bei 401/403
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('🔒 Authentifizierungsfehler erkannt, automatischer Logout');
          
          // Nur ausloggen wenn der Benutzer aktuell eingeloggt ist
          if (user) {
            alert('Ihre Sitzung ist abgelaufen. Sie werden automatisch abgemeldet.');
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [user]);

  // Token-Refresh alle 30 Minuten prüfen
  useEffect(() => {
    if (!user) return;

    const checkTokenInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      
      if (!isTokenValid(token)) {
        console.log('⏰ Token ist abgelaufen, automatischer Logout');
        alert('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
        logout();
      }
    }, 30 * 60 * 1000); // Alle 30 Minuten prüfen

    return () => clearInterval(checkTokenInterval);
  }, [user]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '24px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>🔄 Lade Anwendung...</div>
        <div style={{ fontSize: '16px', color: '#7f8c8d' }}>
          Prüfe Anmeldestatus...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Öffentliche Kiosk-Routen - MIT Layout und HeartbeatManager */}
          <Route path="/kiosk" element={
            <Layout kiosk={true}>
              <KioskView />
            </Layout>
          } />
          <Route path="/kiosk/news" element={
            <Layout kiosk={true}>
              <NewsKioskView />
            </Layout>
          } />
          <Route path="/kiosk/tradeshows" element={
            <Layout kiosk={true}>
              <TradeShowCalendar kiosk={true} />
            </Layout>
          } />
          <Route path="/kiosk/workplan" element={
            <Layout kiosk={true}>
              <WorkPlan kiosk={true} />
            </Layout>
          } />
          <Route path="/kiosk/warehouse" element={
            <Layout kiosk={true}>
              <WarehouseOverview kiosk={true} />
            </Layout>
          } />
          <Route path="/kiosk/warehouse-inventory" element={
            <Layout kiosk={true}>
              <WarehouseInventory kiosk={true} />
            </Layout>
          } />
          <Route path="/kiosk/warehouse-movements" element={
            <Layout kiosk={true}>
              <WarehouseMovements kiosk={true} />
            </Layout>
          } />
          <Route path="/kiosk/birthdays" element={
            <Layout kiosk={true}>
              <BirthdayList kiosk={true} />
            </Layout>
          } />
          <Route path="/kiosk/phonelist" element={
            <Layout kiosk={true}>
              <PhoneList kiosk={true} />
            </Layout>
          } />
          <Route path="/kiosk/organigramm" element={
            <Layout kiosk={true}>
              <Organigramm kiosk={true} />
            </Layout>
          } />
          
          {/* Admin-Routen */}
          {user ? (
            <>
              <Route path="/admin" element={<AdminDashboard user={user} logout={logout} />} />
              <Route path="/admin/news" element={<NewsManagement />} />
              <Route path="/admin/posts" element={<PostsManagement />} />
              <Route path="/admin/vehicles" element={<VehicleManagement />} />
              <Route path="/admin/warehouse" element={<WarehouseOverview />} />
              <Route path="/admin/warehouse-inventory" element={<WarehouseInventory />} />
              <Route path="/admin/warehouse-movements" element={<WarehouseMovements />} />
              <Route path="/admin/warehouse-3d" element={<WarehouseView3D />} />
              <Route path="/admin/tradeshows" element={<TradeShowCalendar />} />
              <Route path="/admin/workplan" element={<WorkPlan />} />
              <Route path="/admin/employees" element={<EmployeeManagement />} />
              <Route path="/admin/birthdays" element={<BirthdayList />} />
              <Route path="/admin/phonelist" element={<PhoneList />} />
              <Route path="/admin/organigramm" element={<Organigramm />} />
              <Route path="/admin/panel" element={<AdminPanel />} />
              <Route path="/login" element={<Navigate to="/admin" />} />
            </>
          ) : (
            <Route path="/login" element={<Login onLogin={login} />} />
          )}
          
          {/* Standard-Weiterleitungen */}
          <Route path="/" element={<Navigate to="/kiosk" />} />
          <Route path="*" element={user ? <Navigate to="/admin" /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;