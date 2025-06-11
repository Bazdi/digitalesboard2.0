// client/src/pages/WorkPlan.js - Repariert für zentrale Mitarbeiterverwaltung
import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useMaintenanceMode } from '../hooks/useMaintenanceMode';

const WorkPlan = ({ kiosk = false }) => {
  const { isMaintenanceMode, MaintenanceScreen } = useMaintenanceMode();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date()));
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [draggedEmployee, setDraggedEmployee] = useState(null);
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    assigned_employees: [],
    assigned_vehicle: null
  });

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchVehicles();
    
    if (kiosk) {
      const interval = setInterval(() => {
        fetchTasks();
        fetchEmployees();
        fetchVehicles();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [kiosk, currentWeek]);

  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Montag als Start
    return new Date(d.setDate(diff));
  }

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/workplan');
      setTasks(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Aufgaben:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      // Filter nur Mitarbeiter, die das digitale Brett nutzen
      const response = await axios.get('/api/employees?filter=bulletin_board');
      setEmployees(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('/api/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Fahrzeuge:', error);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        ...taskForm,
        assigned_to: taskForm.assigned_employees.map(emp => emp.name).join(', '),
        position: tasks.length
      };

      if (editingTask) {
        await axios.put(`/api/workplan/${editingTask.id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/workplan', dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      resetTaskForm();
      fetchTasks();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Aufgabe');
    }
  };

  const handleTaskDelete = async (id) => {
    if (!window.confirm('Möchten Sie diese Aufgabe wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/workplan/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Aufgabe');
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      assigned_employees: [],
      assigned_vehicle: null
    });
    setShowTaskForm(false);
    setEditingTask(null);
    setSelectedDate(null);
  };

  const addTaskForDate = (date) => {
    if (kiosk) return;
    setSelectedDate(date);
    setTaskForm(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0]
    }));
    setShowTaskForm(true);
  };

  const editTask = (task) => {
    if (kiosk) return;
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      date: task.date || '',
      start_time: task.start_time || '',
      end_time: task.end_time || '',
      assigned_employees: task.assigned_to ? 
        task.assigned_to.split(', ').map(name => ({ name })) : [],
      assigned_vehicle: task.assigned_vehicle || null
    });
    setShowTaskForm(true);
  };

  const getWeekDays = () => {
    const days = [];
    const startDate = new Date(currentWeek);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => task.date === dateStr);
  };

  const handleDragStart = (e, employee) => {
    if (kiosk) return;
    console.log('Drag start:', employee);
    setDraggedEmployee(employee);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', employee.name);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e, task) => {
    e.preventDefault();
    if (kiosk || !draggedEmployee) return;

    console.log('Drop:', draggedEmployee.name, 'auf Task:', task.title);

    try {
      const token = localStorage.getItem('token');
      const currentAssigned = task.assigned_to ? task.assigned_to.split(', ') : [];
      
      if (!currentAssigned.includes(draggedEmployee.name)) {
        currentAssigned.push(draggedEmployee.name);
        
        await axios.put(`/api/workplan/${task.id}`, {
          ...task,
          assigned_to: currentAssigned.join(', ')
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        fetchTasks();
        console.log('Mitarbeiter erfolgreich zugewiesen');
      } else {
        console.log('Mitarbeiter bereits zugewiesen');
      }
    } catch (error) {
      console.error('Fehler beim Zuweisen:', error);
    }
    
    setDraggedEmployee(null);
  };

  const removeEmployeeFromTask = async (task, employeeName) => {
    if (kiosk) return;
    
    try {
      const token = localStorage.getItem('token');
      const currentAssigned = task.assigned_to ? task.assigned_to.split(', ') : [];
      const newAssigned = currentAssigned.filter(name => name !== employeeName);
      
      await axios.put(`/api/workplan/${task.id}`, {
        ...task,
        assigned_to: newAssigned.join(', ')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchTasks();
    } catch (error) {
      console.error('Fehler beim Entfernen:', error);
    }
  };

  const changeWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  const getStatusColor = (employment_status) => {
    switch (employment_status) {
      case 'krank': return '#e74c3c';
      case 'urlaub': return '#f39c12';
      default: return '#27ae60';
    }
  };

  const getStatusText = (employment_status) => {
    switch (employment_status) {
      case 'krank': return '🤒 Krank';
      case 'urlaub': return '🏖️ Urlaub';
      default: return '✅ Verfügbar';
    }
  };

  const getDepartmentIcon = (department) => {
    const icons = {
      'Management': '👑',
      'IT': '💻',
      'Marketing': '📢',
      'HR': '👥',
      'Finanzen': '💰',
      'Vertrieb': '📈',
      'Produktion': '🏭',
      'Design': '🎨',
      'Support': '🎧',
      'Buchhaltung': '📊'
    };
    return icons[department] || '👤';
  };

  const getVehicleInfo = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === parseInt(vehicleId));
    if (!vehicle) return 'Fahrzeug nicht gefunden';
    return `${vehicle.brand} ${vehicle.model} (${vehicle.license_plate})`;
  };

  const weekDays = getWeekDays();

  const styles = {
    container: kiosk ? { 
      padding: '40px', 
      backgroundColor: '#f8f9fa', 
      minHeight: '100vh' 
    } : {},
    header: {
      textAlign: 'center',
      marginBottom: kiosk ? '60px' : '30px',
    },
    title: {
      fontSize: kiosk ? '64px' : '32px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: kiosk ? '20px' : '10px',
    },
    backButton: kiosk ? {
      display: 'inline-block',
      backgroundColor: '#3498db',
      color: 'white',
      padding: '20px 40px',
      fontSize: '24px',
      fontWeight: 'bold',
      textDecoration: 'none',
      borderRadius: '10px',
      marginBottom: '40px',
      transition: 'background-color 0.3s ease',
    } : null,
    weekNavigation: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: kiosk ? '30px' : '20px',
      marginBottom: kiosk ? '40px' : '20px',
    },
    navButton: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: kiosk ? '15px 25px' : '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: kiosk ? '20px' : '16px',
      fontWeight: 'bold',
      transition: 'background-color 0.3s ease',
    },
    weekDisplay: {
      fontSize: kiosk ? '32px' : '24px',
      fontWeight: 'bold',
      color: '#2c3e50',
      minWidth: kiosk ? '400px' : '300px',
      textAlign: 'center',
    },
    mainContent: {
      display: 'flex',
      gap: '20px',
      height: 'calc(100vh - 200px)',
    },
    sidebar: {
      width: '280px',
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      height: 'fit-content',
      maxHeight: '80vh',
      overflowY: 'auto',
      display: kiosk ? 'none' : 'block',
    },
    sidebarTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '15px',
      color: '#2c3e50',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    linkToManagement: {
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '12px',
      textDecoration: 'none',
      display: 'inline-block',
    },
    employeeItem: {
      padding: '12px',
      marginBottom: '8px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '2px solid transparent',
      cursor: 'grab',
      transition: 'all 0.3s ease',
      userSelect: 'none',
    },
    employeeName: {
      fontWeight: 'bold',
      marginBottom: '4px',
      color: '#2c3e50',
    },
    employeeStatus: {
      fontSize: '12px',
      fontWeight: '500',
    },
    calendarGrid: {
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: kiosk ? '30px' : '20px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      overflow: 'auto',
      flex: 1,
    },
    weekGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '15px',
      minHeight: '500px',
    },
    dayColumn: {
      borderRadius: '8px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      minHeight: '400px',
    },
    dayHeader: {
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: kiosk ? '18px' : '16px',
      marginBottom: '15px',
      color: '#2c3e50',
      borderBottom: '2px solid #ecf0f1',
      paddingBottom: '10px',
    },
    dayDate: {
      fontSize: kiosk ? '14px' : '12px',
      color: '#7f8c8d',
    },
    addTaskButton: {
      width: '100%',
      padding: '10px',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
      marginBottom: '10px',
      display: kiosk ? 'none' : 'block',
    },
    taskCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: kiosk ? '20px' : '15px',
      marginBottom: '10px',
      border: '2px solid #ecf0f1',
      transition: 'all 0.3s ease',
      position: 'relative',
    },
    taskTitle: {
      fontWeight: 'bold',
      fontSize: kiosk ? '18px' : '16px',
      color: '#2c3e50',
      marginBottom: '8px',
    },
    taskTime: {
      fontSize: kiosk ? '14px' : '12px',
      color: '#3498db',
      marginBottom: '8px',
    },
    taskAssigned: {
      marginBottom: '10px',
    },
    assignedEmployee: {
      display: 'inline-block',
      backgroundColor: '#27ae60',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      marginRight: '5px',
      marginBottom: '3px',
      cursor: kiosk ? 'default' : 'pointer',
      transition: 'background-color 0.3s ease',
    },
    taskVehicle: {
      backgroundColor: '#e67e22',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      marginTop: '5px',
      display: 'inline-block',
    },
    taskActions: {
      display: kiosk ? 'none' : 'flex',
      gap: '5px',
      justifyContent: 'flex-end',
    },
    actionButton: {
      padding: '5px 8px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
    },
    editTaskButton: {
      backgroundColor: '#f39c12',
      color: 'white',
    },
    deleteTaskButton: {
      backgroundColor: '#e74c3c',
      color: 'white',
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '15px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflow: 'auto',
    },
    form: {
      display: 'grid',
      gap: '20px',
    },
    formGroup: {
      display: 'grid',
      gap: '8px',
    },
    label: {
      fontWeight: '500',
      color: '#34495e',
    },
    input: {
      padding: '12px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '16px',
      outline: 'none',
      transition: 'border-color 0.3s ease',
    },
    select: {
      padding: '12px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '16px',
      outline: 'none',
      backgroundColor: 'white',
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
    },
    button: {
      padding: '12px 20px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      transition: 'background-color 0.3s ease',
    },
    cancelButton: {
      backgroundColor: '#95a5a6',
      color: 'white',
    },
    submitButton: {
      backgroundColor: '#3498db',
      color: 'white',
    }
  };

  // Wartungsmodus-Check für alle Benutzer
  if (isMaintenanceMode) {
    return <MaintenanceScreen />;
  }

  if (kiosk) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <a href="/kiosk" style={styles.backButton}>← Zurück zum Hauptmenü</a>
          <h1 style={styles.title}>📋 Wochenarbeitsplan</h1>
        </div>
        
        <div style={styles.weekNavigation}>
          <button
            style={styles.navButton}
            onClick={() => changeWeek(-1)}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            ← Vorherige Woche
          </button>
          <div style={styles.weekDisplay}>
            {currentWeek.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} - 
            {new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
          <button
            style={styles.navButton}
            onClick={() => changeWeek(1)}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            Nächste Woche →
          </button>
        </div>
        
        <div style={styles.calendarGrid}>
          <div style={styles.weekGrid}>
            {weekDays.map((day, index) => (
              <div key={index} style={styles.dayColumn}>
                <div style={styles.dayHeader}>
                  <div>{['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'][index]}</div>
                  <div style={styles.dayDate}>
                    {day.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
                
                {getTasksForDate(day).map(task => (
                  <div key={task.id} style={styles.taskCard}>
                    <div style={styles.taskTitle}>{task.title}</div>
                    {task.start_time && task.end_time && (
                      <div style={styles.taskTime}>
                        🕐 {task.start_time} - {task.end_time}
                      </div>
                    )}
                    {task.assigned_to && (
                      <div style={styles.taskAssigned}>
                        {task.assigned_to.split(', ').map(employeeName => (
                          <span key={employeeName} style={styles.assignedEmployee}>
                            {employeeName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>📋 Wochenarbeitsplan verwalten</h1>
      </div>
      
      <div style={styles.weekNavigation}>
        <button
          style={styles.navButton}
          onClick={() => changeWeek(-1)}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
        >
          ← Vorherige Woche
        </button>
        <div style={styles.weekDisplay}>
          {currentWeek.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} - 
          {new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
        <button
          style={styles.navButton}
          onClick={() => changeWeek(1)}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
        >
          Nächste Woche →
        </button>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarTitle}>
            👥 Mitarbeiter
            <Link 
              to="/admin/employees" 
              style={styles.linkToManagement}
            >
              Verwalten
            </Link>
          </div>
          
          {employees.map(employee => (
            <div
              key={employee.id}
              style={{
                ...styles.employeeItem,
                borderColor: draggedEmployee?.id === employee.id ? '#3498db' : 'transparent',
                opacity: employee.employment_status !== 'aktiv' ? 0.7 : 1,
              }}
              draggable={employee.employment_status === 'aktiv'}
              onDragStart={(e) => handleDragStart(e, employee)}
              title={employee.employment_status === 'aktiv' ? 'Ziehen Sie den Mitarbeiter zu einer Aufgabe' : 'Mitarbeiter nicht verfügbar'}
            >
              <div style={styles.employeeName}>
                {getDepartmentIcon(employee.department)} {employee.name}
              </div>
              <div style={{
                ...styles.employeeStatus,
                color: getStatusColor(employee.employment_status)
              }}>
                {getStatusText(employee.employment_status)}
              </div>
              {employee.department && (
                <div style={{fontSize: '11px', color: '#7f8c8d'}}>
                  {employee.department}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={styles.calendarGrid}>
          <div style={styles.weekGrid}>
            {weekDays.map((day, index) => (
              <div key={index} style={styles.dayColumn}>
                <div style={styles.dayHeader}>
                  <div>{['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'][index]}</div>
                  <div style={styles.dayDate}>
                    {day.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
                
                <button
                  style={styles.addTaskButton}
                  onClick={() => addTaskForDate(day)}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
                >
                  + Aufgabe hinzufügen
                </button>
                
                {getTasksForDate(day).map(task => (
                  <div
                    key={task.id}
                    style={styles.taskCard}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, task)}
                  >
                    <div style={styles.taskTitle}>{task.title}</div>
                    {task.start_time && task.end_time && (
                      <div style={styles.taskTime}>
                        🕐 {task.start_time} - {task.end_time}
                      </div>
                    )}
                    {task.assigned_to && (
                      <div style={styles.taskAssigned}>
                        {task.assigned_to.split(', ').map(employeeName => (
                          <span
                            key={employeeName}
                            style={styles.assignedEmployee}
                            onClick={() => removeEmployeeFromTask(task, employeeName)}
                            title="Klicken zum Entfernen"
                          >
                            {employeeName} ×
                          </span>
                        ))}
                      </div>
                    )}
                    {task.assigned_vehicle && (
                      <div style={styles.taskVehicle}>
                        🚗 {getVehicleInfo(task.assigned_vehicle)}
                      </div>
                    )}
                    <div style={styles.taskActions}>
                      <button
                        style={{...styles.actionButton, ...styles.editTaskButton}}
                        onClick={() => editTask(task)}
                      >
                        ✏️
                      </button>
                      <button
                        style={{...styles.actionButton, ...styles.deleteTaskButton}}
                        onClick={() => handleTaskDelete(task.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              {editingTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe erstellen'}
            </h3>
            
            <form onSubmit={handleTaskSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Titel:</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({...prev, title: e.target.value}))}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Beschreibung:</label>
                <input
                  type="text"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({...prev, description: e.target.value}))}
                  style={styles.input}
                />
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px'}}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Datum:</label>
                  <input
                    type="date"
                    value={taskForm.date}
                    onChange={(e) => setTaskForm(prev => ({...prev, date: e.target.value}))}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Startzeit:</label>
                  <input
                    type="time"
                    value={taskForm.start_time}
                    onChange={(e) => setTaskForm(prev => ({...prev, start_time: e.target.value}))}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Endzeit:</label>
                  <input
                    type="time"
                    value={taskForm.end_time}
                    onChange={(e) => setTaskForm(prev => ({...prev, end_time: e.target.value}))}
                    style={styles.input}
                  />
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Zugewiesene Mitarbeiter:</label>
                <select
                  multiple
                  value={taskForm.assigned_employees.map(emp => emp.name)}
                  onChange={(e) => {
                    const selectedNames = Array.from(e.target.selectedOptions, option => option.value);
                    setTaskForm(prev => ({
                      ...prev,
                      assigned_employees: selectedNames.map(name => ({ name }))
                    }));
                  }}
                  style={{...styles.select, height: '120px'}}
                >
                  {employees.filter(emp => emp.employment_status === 'aktiv').map(employee => (
                    <option key={employee.id} value={employee.name}>
                      {getDepartmentIcon(employee.department)} {employee.name} ({employee.department})
                    </option>
                  ))}
                </select>
                <div style={{fontSize: '12px', color: '#7f8c8d', marginTop: '5px'}}>
                  Halten Sie Strg/Cmd gedrückt, um mehrere Mitarbeiter auszuwählen
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Zugewiesenes Fahrzeug (optional):</label>
                <select
                  value={taskForm.assigned_vehicle || ''}
                  onChange={(e) => setTaskForm(prev => ({
                    ...prev,
                    assigned_vehicle: e.target.value || null
                  }))}
                  style={styles.select}
                >
                  <option value="">-- Kein Fahrzeug auswählen --</option>
                  {vehicles.filter(vehicle => vehicle.status === 'verfügbar').map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      🚗 {vehicle.brand} {vehicle.model} ({vehicle.license_plate})
                    </option>
                  ))}
                </select>
                <div style={{fontSize: '12px', color: '#7f8c8d', marginTop: '5px'}}>
                  Das ausgewählte Fahrzeug wird für die Dauer der Aufgabe blockiert
                </div>
              </div>
              
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={resetTaskForm}
                  style={{...styles.button, ...styles.cancelButton}}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  style={{...styles.button, ...styles.submitButton}}
                >
                  {editingTask ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default WorkPlan;