// client/src/pages/TradeShowCalendar.js - ERWEITERT mit Überschneidungs-Darstellung
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { useMaintenanceMode } from '../hooks/useMaintenanceMode';

const TradeShowCalendar = ({ kiosk = false }) => {
  const { isMaintenanceMode, MaintenanceScreen } = useMaintenanceMode();
  const [tradeshows, setTradeshows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [hoveredEvents, setHoveredEvents] = useState([]);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [hideTimeout, setHideTimeout] = useState(null);
  
  // NEUER Zeitfilter State
  const [timeFilter, setTimeFilter] = useState('future'); // 'all' oder 'future'
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    image: null
  });

  // Gruppiere ähnliche Events (um einzelne Aussteller zu vermeiden)
  const groupTradeshows = (shows) => {
    const grouped = {};
    
    shows.forEach(show => {
      // Erkenne Hauptveranstaltung aus dem Namen
      let mainEventName = show.name;
      
      // Entferne spezifische Aussteller-Marker
      mainEventName = mainEventName
        .replace(/\s*\/\s*.+$/, '') // Entferne alles nach "/"
        .replace(/\s*-\s*.+$/, '') // Entferne alles nach "-" 
        .replace(/\s*\(\s*.+\)$/, '') // Entferne Text in Klammern am Ende
        .replace(/\s+Halle\s+\d+.*$/i, '') // Entferne Hallen-Angaben
        .replace(/\s+Stand\s+\d+.*$/i, '') // Entferne Stand-Angaben
        .trim();
      
      // Gruppierungsschlüssel: Hauptname + Datum
      const groupKey = `${mainEventName}_${show.start_date}_${show.end_date}`;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          ...show,
          name: mainEventName,
          originalEvents: [show]
        };
      } else {
        // Sammle alle ursprünglichen Events
        grouped[groupKey].originalEvents.push(show);
        
        // Erweitere Beschreibung mit zusätzlichen Infos
        if (show.description && !grouped[groupKey].description.includes(show.description)) {
          grouped[groupKey].description += `\n${show.description}`;
        }
      }
    });
    
    return Object.values(grouped);
  };

  // NEUE Filterfunktion für Zeitraum
  const filterTradeShowsByTime = (shows) => {
    if (timeFilter === 'all') {
      return shows;
    }
    
    // Nur zukünftige Messen (ab heute)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Auf Mitternacht setzen
    
    return shows.filter(show => {
      const showDate = new Date(show.start_date);
      return showDate >= today;
    });
  };

  useEffect(() => {
    fetchTradeshows();
    
    if (kiosk) {
      const interval = setInterval(fetchTradeshows, 60000);
      return () => clearInterval(interval);
    }
  }, [kiosk, currentYear, timeFilter]);

  const fetchTradeshows = async () => {
    try {
      const response = await axios.get(`/api/tradeshows?year=${currentYear}`);
      const groupedShows = groupTradeshows(response.data);
      const filteredShows = filterTradeShowsByTime(groupedShows);
      setTradeshows(filteredShows);
    } catch (error) {
      console.error('Fehler beim Laden der Messen:', error);
    }
  };

  // ERWEITERT: Alle Events für ein bestimmtes Datum finden
  const getTradeShowsForDate = (date) => {
    return tradeshows.filter(show => {
      // Normalisiere alle Daten auf Mitternacht zur korrekten Vergleichung
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startDate = new Date(show.start_date);
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDate = new Date(show.end_date);
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      return targetDate >= start && targetDate <= end;
    });
  };

  // Vereinfachte Event-Hover Funktionen
  const handleEventMouseEnter = (events, mouseEvent) => {
    // Lösche bestehende Hide-Timer
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }

    const rect = mouseEvent.target.getBoundingClientRect();
    
    // Verbesserte Positionierung
    const newPosition = {
      x: Math.max(10, Math.min(rect.left, window.innerWidth - 420)),
      y: rect.bottom + 8
    };
    
    // Falls nicht genug Platz unten, dann oberhalb
    if (newPosition.y + 300 > window.innerHeight) {
      newPosition.y = rect.top - 310;
    }
    
    setHoverPosition(newPosition);
    setHoveredEvents(events);
    setTooltipVisible(true);
  };

  const handleEventMouseLeave = () => {
    // Kürzere, konsistentere Verzögerung
    const timeout = setTimeout(() => {
      setTooltipVisible(false);
      setHoveredEvents([]);
    }, 500);
    setHideTimeout(timeout);
  };

  const handleTooltipMouseEnter = () => {
    // Tooltip-Hover: Lösche Hide-Timer
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  };

  const handleTooltipMouseLeave = () => {
    // Konsistente Verzögerung auch beim Verlassen des Tooltips
    const timeout = setTimeout(() => {
    setTooltipVisible(false);
      setHoveredEvents([]);
    }, 200);
    setHideTimeout(timeout);
  };

  // ERWEITERTE Tooltip-Komponente für mehrere Events mit verbesserter Hover-Persistenz
  const EventTooltip = ({ events, position, visible }) => {
    if (!visible || !events || events.length === 0) return null;

    const tooltipStyle = {
      position: 'fixed',
      left: Math.max(10, Math.min(position.x, window.innerWidth - 420)), // Verhindere Overflow
      top: Math.max(10, Math.min(position.y, window.innerHeight - 300)), // Verhindere Overflow
      backgroundColor: 'rgba(44, 62, 80, 0.98)', // Erhöhte Opazität
      color: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      zIndex: 10000, // Höherer z-index für Admin-Portal
      maxWidth: '450px',
      fontSize: '14px',
      lineHeight: '1.5',
      maxHeight: '500px', // Größere maximale Höhe
      overflowY: 'auto',
      // VERBESSERTE HOVER-PERSISTENZ: Tooltip bleibt sichtbar beim Hover
      pointerEvents: 'auto',
      // Verhindere Text-Selektion die das Hover stören könnte
      userSelect: 'text', // GEÄNDERT: Erlaube Textauswahl
      // Bessere Scrollbar-Darstellung mit mehr Stil
      scrollbarWidth: 'thin',
      scrollbarColor: '#3498db rgba(255,255,255,0.3)',
      // NEUE Border für bessere Erkennbarkeit
      border: '2px solid rgba(52, 152, 219, 0.8)',
      // Animation für sanftes Erscheinen
      animation: 'tooltipFadeIn 0.2s ease-out'
    };

    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const getDuration = (startDate, endDate) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${diffDays} Tag${diffDays !== 1 ? 'e' : ''}`;
    };

    return (
      <div 
        style={tooltipStyle}
        onMouseEnter={handleTooltipMouseEnter}
        onMouseLeave={handleTooltipMouseLeave}
        onWheel={(e) => {
          // SCROLL-VERBESSERUNG: Verhindere dass Scroll das Tooltip schließt
          e.stopPropagation();
        }}
        onScroll={(e) => {
          // SCROLL-VERBESSERUNG: Verhindere dass Scroll das Tooltip schließt
          e.stopPropagation();
        }}
      >
        <style>
          {`
            @keyframes tooltipFadeIn {
              from {
                opacity: 0;
                transform: translateY(-10px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            
            /* Bessere Scrollbar-Styles */
            .tooltip-container::-webkit-scrollbar {
              width: 8px;
            }
            
            .tooltip-container::-webkit-scrollbar-track {
              background: rgba(255,255,255,0.1);
              border-radius: 4px;
            }
            
            .tooltip-container::-webkit-scrollbar-thumb {
              background: rgba(52, 152, 219, 0.8);
              border-radius: 4px;
            }
            
            .tooltip-container::-webkit-scrollbar-thumb:hover {
              background: rgba(52, 152, 219, 1);
            }
          `}
        </style>
        {events.length > 1 && (
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '18px', 
            marginBottom: '15px',
            borderBottom: '2px solid rgba(255,255,255,0.3)',
            paddingBottom: '10px',
            color: '#f39c12'
          }}>
            🔄 {events.length} gleichzeitige Veranstaltungen
          </div>
        )}
        
        {events.map((event, index) => (
          <div key={event.id || index} style={{ 
            marginBottom: events.length > 1 ? '20px' : '0',
            paddingBottom: events.length > 1 && index < events.length - 1 ? '15px' : '0',
            borderBottom: events.length > 1 && index < events.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
              📅 {event.name}
            </div>
            <div style={{ marginBottom: '5px' }}>
              📍 <strong>Ort:</strong> {event.location}
            </div>
            <div style={{ marginBottom: '5px' }}>
              🗓️ <strong>Von:</strong> {formatDate(event.start_date)}
            </div>
            <div style={{ marginBottom: '5px' }}>
              🗓️ <strong>Bis:</strong> {formatDate(event.end_date)}
            </div>
            <div style={{ marginBottom: '8px' }}>
              ⏱️ <strong>Dauer:</strong> {getDuration(event.start_date, event.end_date)}
            </div>
            {event.description && (
              <div style={{ 
                borderTop: '1px solid rgba(255,255,255,0.3)', 
                paddingTop: '8px',
                fontSize: '13px'
              }}>
                <strong>Details:</strong><br/>
                {event.description.substring(0, 150)}
                {event.description.length > 150 && '...'}
              </div>
            )}
            {event.originalEvents && event.originalEvents.length > 1 && (
              <div style={{ 
                borderTop: '1px solid rgba(255,255,255,0.3)', 
                paddingTop: '8px',
                fontSize: '12px',
                opacity: 0.8
              }}>
                📊 {event.originalEvents.length} verwandte Events
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStartDate || !selectedEndDate) {
      alert('Bitte wählen Sie Start- und Enddatum im Kalender aus');
      return;
    }

    const token = localStorage.getItem('token');
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('location', formData.location);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('start_date', formatDateForAPI(selectedStartDate));
    formDataToSend.append('end_date', formatDateForAPI(selectedEndDate));
    
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      if (editingShow) {
        await axios.put(`/api/tradeshows/${editingShow.id}`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post('/api/tradeshows', formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      resetForm();
      fetchTradeshows();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Messe');
    }
  };

  const handleEdit = (show) => {
    setEditingShow(show);
    setFormData({
      name: show.name,
      location: show.location,
      description: show.description || '',
      image: null
    });
    setSelectedStartDate(new Date(show.start_date));
    setSelectedEndDate(new Date(show.end_date));
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Möchten Sie diese Messe wirklich löschen?')) {
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`/api/tradeshows/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchTradeshows();
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        alert('Fehler beim Löschen der Messe');
      }
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
    setFormData({
      name: '',
      location: '',
      description: '',
      image: null
    });
    setEditingShow(null);
    setShowForm(false);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
  };

  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateClick = (date) => {
    if (kiosk) return;
    
    if (!selectedStartDate) {
      setSelectedStartDate(date);
    } else if (!selectedEndDate) {
      if (date >= selectedStartDate) {
        setSelectedEndDate(date);
        setShowForm(true);
      } else {
        setSelectedStartDate(date);
        setSelectedEndDate(null);
      }
    } else {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    }
  };

  const isDateInRange = (date, startDate, endDate) => {
    return date >= startDate && date <= endDate;
  };

  const isDateSelected = (date) => {
    if (!selectedStartDate) return false;
    if (!selectedEndDate) return date.toDateString() === selectedStartDate.toDateString();
    return isDateInRange(date, selectedStartDate, selectedEndDate);
  };

  const generateCalendar = () => {
    const months = [];
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(currentYear, month, 1);
      const lastDay = new Date(currentYear, month + 1, 0); // Letzter Tag des Monats
      const daysInMonth = lastDay.getDate();
      
      // Wochentag des ersten Tages (0 = Sonntag, 1 = Montag, ...)
      const startWeekday = firstDay.getDay();
      
      const days = [];
      
      // Leere Zellen am Anfang für Tage vor dem 1. des Monats
      for (let i = 0; i < startWeekday; i++) {
        days.push({
          date: null,
          isCurrentMonth: false,
          isToday: false,
          tradeShows: [],
          isSelected: false,
          isEmpty: true
        });
      }
      
      // Tage des aktuellen Monats
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(currentYear, month, day);
        const isToday = currentDate.toDateString() === new Date().toDateString();
        const tradeShows = getTradeShowsForDate(currentDate);
        const isSelected = isDateSelected(currentDate);

        days.push({
          date: currentDate,
          isCurrentMonth: true,
          isToday,
          tradeShows,
          isSelected,
          isEmpty: false
        });
      }
      
      // Leere Zellen am Ende, um auf 42 Zellen zu kommen (6 Wochen)
      const remainingCells = 42 - days.length;
      for (let i = 0; i < remainingCells; i++) {
        days.push({
          date: null,
          isCurrentMonth: false,
          isToday: false,
          tradeShows: [],
          isSelected: false,
          isEmpty: true
        });
      }

      months.push({
        name: monthNames[month],
        days,
        dayNames
      });
    }

    return months;
  };

  // ERWEITERT: Mehrfach-Event Indikator
  const getEventStyle = (tradeShows) => {
    if (!tradeShows || tradeShows.length === 0) return {};
    
    if (tradeShows.length === 1) {
      return {
        backgroundColor: '#e74c3c',
        color: 'white',
        fontWeight: 'bold',
        border: '2px solid #c0392b',
      };
    } else if (tradeShows.length === 2) {
      return {
        background: 'linear-gradient(45deg, #e74c3c 50%, #f39c12 50%)',
        color: 'white',
        fontWeight: 'bold',
        border: '2px solid #d35400',
      };
    } else {
      return {
        background: 'conic-gradient(#e74c3c 0deg 120deg, #f39c12 120deg 240deg, #9b59b6 240deg 360deg)',
        color: 'white',
        fontWeight: 'bold',
        border: '2px solid #8e44ad',
      };
    }
  };

  const styles = {
    container: kiosk ? { 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      minHeight: '100vh' 
    } : {},
    header: {
      textAlign: 'center',
      marginBottom: kiosk ? '30px' : '20px',
    },
    title: {
      fontSize: kiosk ? '48px' : '32px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: kiosk ? '20px' : '10px',
    },
    backButton: kiosk ? {
      display: 'inline-block',
      backgroundColor: '#3498db',
      color: 'white',
      padding: '15px 30px',
      fontSize: '20px',
      fontWeight: 'bold',
      textDecoration: 'none',
      borderRadius: '10px',
      marginBottom: '30px',
      transition: 'background-color 0.3s ease',
    } : null,
    yearControls: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '30px',
    },
    yearButton: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: kiosk ? '15px 25px' : '10px 20px',
      fontSize: kiosk ? '20px' : '16px',
      borderRadius: '5px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    yearDisplay: {
      fontSize: kiosk ? '36px' : '24px',
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    selection: {
      textAlign: 'center',
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: '#e8f4fd',
      borderRadius: '10px',
      fontSize: kiosk ? '20px' : '16px',
    },
    calendarWrapper: {
      backgroundColor: 'white',
      borderRadius: '15px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '30px',
    },
    calendarGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '25px',
      justifyContent: 'center',
    },
    monthContainer: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '15px',
      border: '2px solid #ecf0f1',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      width: '100%',
      maxWidth: '350px',
      margin: '0 auto',
    },
    monthTitle: {
      fontSize: kiosk ? '22px' : '18px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '15px',
      color: '#2c3e50',
      borderBottom: '2px solid #3498db',
      paddingBottom: '8px',
    },
    dayHeaders: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '2px',
      marginBottom: '8px',
    },
    dayHeader: {
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: kiosk ? '14px' : '12px',
      color: '#7f8c8d',
      padding: '8px 4px',
    },
    daysGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '2px',
    },
    dayCell: {
      aspectRatio: '1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: kiosk ? '16px' : '14px',
      cursor: kiosk ? 'default' : 'pointer',
      borderRadius: '6px',
      transition: 'all 0.2s ease',
      position: 'relative',
      minHeight: kiosk ? '45px' : '35px',
      border: '1px solid transparent',
    },
    currentMonth: {
      color: '#2c3e50',
      backgroundColor: '#f8f9fa',
      border: '1px solid #ecf0f1',
    },
    otherMonth: {
      color: '#bdc3c7',
      backgroundColor: '#fdfdfd',
    },
    today: {
      backgroundColor: '#e74c3c',
      color: 'white',
      fontWeight: 'bold',
      border: '3px solid #c0392b',
      boxShadow: '0 0 15px rgba(231, 76, 60, 0.4)',
      animation: 'pulse 2s infinite',
      transform: 'scale(1.05)',
    },
    selected: {
      backgroundColor: '#27ae60',
      color: 'white',
      fontWeight: 'bold',
      border: '2px solid #219a52',
    },
    // ERWEITERT: Mehrfach-Event Indikator
    eventIndicator: {
      fontSize: '10px',
      marginTop: '2px',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    tradeshowInfo: {
      position: 'absolute',
      bottom: '-2px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '9px',
      fontWeight: 'bold',
      textAlign: 'center',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      padding: '1px 2px',
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: '3px',
      pointerEvents: 'none',
    },
    button: {
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      margin: '5px',
    },
    submitButton: {
      backgroundColor: '#3498db',
      color: 'white',
    },
    cancelButton: {
      backgroundColor: '#95a5a6',
      color: 'white',
    },
    // Legend für Mehrfach-Events
    legend: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginBottom: '20px',
      flexWrap: 'wrap',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #ecf0f1',
    },
    legendColor: {
      width: '20px',
      height: '20px',
      borderRadius: '4px',
      border: '1px solid #bdc3c7',
    },
    form: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '30px',
    },
    formTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '20px',
      textAlign: 'center',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '20px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '16px',
      transition: 'border-color 0.3s ease',
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '16px',
      minHeight: '100px',
      resize: 'vertical',
      transition: 'border-color 0.3s ease',
    },
    fileInput: {
      width: '100%',
      padding: '8px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '16px',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
      marginTop: '20px',
    },
    tradeshowsList: {
      backgroundColor: 'white',
      borderRadius: '15px',
      padding: '30px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    listTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '20px',
      textAlign: 'center',
    },
    tradeshowItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '20px',
      marginBottom: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      border: '2px solid #ecf0f1',
      transition: 'all 0.3s ease',
    },
    tradeshowContent: {
      flex: 1,
    },
    tradeshowName: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '8px',
    },
    tradeshowDetails: {
      color: '#7f8c8d',
      marginBottom: '5px',
      fontSize: '16px',
    },
    tradeshowActions: {
      display: 'flex',
      gap: '10px',
      marginLeft: '20px',
    },
    editButton: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      transition: 'background-color 0.3s ease',
    },
    deleteButton: {
      backgroundColor: '#e74c3c',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      transition: 'background-color 0.3s ease',
    }
  };

  const calendar = generateCalendar();

  // NEUE Funktion: Kommende Messen ab nächstem Jahr
  const getUpcomingTradeshows = () => {
    const nextYear = currentYear + 1;
    const today = new Date();
    
    return tradeshows.filter(show => {
      const startDate = new Date(show.start_date);
      return startDate.getFullYear() >= nextYear || startDate > today;
    }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  };

  // NEUE Komponente: Kommende Messen Panel
  const UpcomingTradeShowsPanel = ({ tradeshows }) => {
    const [showMore, setShowMore] = useState(false);
    const [visibleCount, setVisibleCount] = useState(8);
    
    const upcomingShows = tradeshows
      .filter(show => new Date(show.start_date) >= new Date())
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    
    const totalShows = upcomingShows.length;
    const displayShows = showMore ? upcomingShows : upcomingShows.slice(0, visibleCount);
    const remainingShows = totalShows - visibleCount;
    
    const getDaysUntil = (date) => {
      const today = new Date();
      const showDate = new Date(date);
      const diffTime = showDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };
    
    const getCountdownColor = (days) => {
      if (days <= 30) return '#e74c3c';
      if (days <= 90) return '#f39c12';
      return '#27ae60';
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };
    
    const formatYear = (dateString) => {
      return new Date(dateString).getFullYear();
    };

    return (
      <div style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '15px',
        padding: '20px',
        marginTop: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          color: '#2c3e50',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📅 Kommende Messen {formatYear(new Date())}
          <span style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            borderRadius: '10px',
            padding: '2px 8px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {totalShows}
          </span>
        </h3>
        
        {displayShows.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#6c757d',
            fontStyle: 'italic',
            padding: '20px'
          }}>
            Keine kommenden Messen geplant
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '15px'
          }}>
            {displayShows.map((show, index) => {
              const daysUntil = getDaysUntil(show.start_date);
              const countdownColor = getCountdownColor(daysUntil);
              
              return (
                <div
                  key={show.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    padding: '15px',
                    border: `2px solid ${countdownColor}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <h4 style={{
                      margin: 0,
                      color: '#2c3e50',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      lineHeight: '1.2'
                    }}>
                      {show.name}
                    </h4>
                    <div style={{
                      backgroundColor: countdownColor,
                      color: 'white',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      marginLeft: '10px'
                    }}>
                      {daysUntil <= 0 ? 'Heute!' : `${daysUntil} Tage`}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '14px',
                    color: '#495057',
                    marginBottom: '8px'
                  }}>
                    📍 {show.location}
                  </div>
                  
                  <div style={{
                    fontSize: '13px',
                    color: '#6c757d',
                    marginBottom: '8px'
                  }}>
                    📅 {formatDate(show.start_date)} - {formatDate(show.end_date)}
                  </div>
                  
                  {show.description && (
                    <div style={{
                      fontSize: '12px',
                      color: '#6c757d',
                      lineHeight: '1.3',
                      maxHeight: '40px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {show.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Lade weitere Button statt "und X weitere..." */}
        {remainingShows > 0 && !showMore && (
          <div style={{
            textAlign: 'center',
            marginTop: '20px'
          }}>
            <button
              onClick={() => setShowMore(true)}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              Lade weitere {remainingShows} Messen
            </button>
          </div>
        )}
        
        {showMore && remainingShows > 0 && (
          <div style={{
            textAlign: 'center',
            marginTop: '20px'
          }}>
            <button
              onClick={() => setShowMore(false)}
              style={{
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#7f8c8d'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#95a5a6'}
            >
              Weniger anzeigen
            </button>
          </div>
        )}
      </div>
    );
  };

  // Wartungsmodus-Check für alle Benutzer
  if (isMaintenanceMode) {
    return <MaintenanceScreen />;
  }

  if (kiosk) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>📅 Messekalender {currentYear}</h1>
          <a href="/" style={styles.backButton}>← Zurück zum Dashboard</a>
          
          <div style={styles.yearControls}>
            <button
              style={styles.yearButton}
              onClick={() => setCurrentYear(currentYear - 1)}
            >
              ← {currentYear - 1}
            </button>
            <div style={styles.yearDisplay}>{currentYear}</div>
            <button
              style={styles.yearButton}
              onClick={() => setCurrentYear(currentYear + 1)}
            >
              {currentYear + 1} →
            </button>
          </div>
          
          {/* NEUE Legende für Mehrfach-Events */}
          <div style={styles.legend}>
            <div style={styles.legendItem}>
              <div style={{...styles.legendColor, backgroundColor: '#e74c3c'}}></div>
              <span>1 Veranstaltung</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendColor, background: 'linear-gradient(45deg, #e74c3c 50%, #f39c12 50%)'}}></div>
              <span>2 Veranstaltungen</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{...styles.legendColor, background: 'conic-gradient(#e74c3c 0deg 120deg, #f39c12 120deg 240deg, #9b59b6 240deg 360deg)'}}></div>
              <span>3+ Veranstaltungen</span>
            </div>
          </div>
        </div>

        <div style={styles.calendarWrapper}>
          <div style={styles.calendarGrid}>
            {calendar.map((month, monthIndex) => (
              <div key={monthIndex} style={styles.monthContainer}>
                <h3 style={styles.monthTitle}>{month.name}</h3>
                
                <div style={styles.dayHeaders}>
                  {month.dayNames.map(dayName => (
                    <div key={dayName} style={styles.dayHeader}>
                      {dayName}
                    </div>
                  ))}
                </div>
                
                <div style={styles.daysGrid}>
                  {month.days.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      style={{
                        ...styles.dayCell,
                        ...(day.isEmpty ? {} : (day.isCurrentMonth ? styles.currentMonth : styles.otherMonth)),
                        ...(day.isToday ? styles.today : {}),
                        ...(day.isSelected ? styles.selected : {}),
                        ...(day.tradeShows && !day.isSelected ? getEventStyle(day.tradeShows) : {}),
                        // Leere Zellen sind nicht klickbar und haben keinen Style
                        ...(day.isEmpty ? { cursor: 'default', backgroundColor: 'transparent' } : {})
                      }}
                      onClick={() => !day.isEmpty && handleDateClick(day.date)}
                      onMouseEnter={(e) => {
                        if (day.tradeShows && day.tradeShows.length > 0) {
                          handleEventMouseEnter(day.tradeShows, e);
                        }
                        if (!day.isEmpty && day.isCurrentMonth && !kiosk && !day.tradeShows) {
                          e.target.style.backgroundColor = '#3498db';
                          e.target.style.color = 'white';
                          e.target.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        handleEventMouseLeave();
                        if (!day.isEmpty && !day.isSelected && !day.isToday && !kiosk && !day.tradeShows) {
                          e.target.style.backgroundColor = day.isCurrentMonth ? '#f8f9fa' : '#fdfdfd';
                          e.target.style.color = day.isCurrentMonth ? '#2c3e50' : '#bdc3c7';
                          e.target.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      {day.date ? day.date.getDate() : ''}
                      {day.tradeShows && day.tradeShows.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '2px',
                          left: '2px',
                          right: '2px',
                          fontSize: '6px',
                          lineHeight: '1.1',
                          maxHeight: '12px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1px'
                        }}>
                          {day.tradeShows.length === 1 ? (
                            <div style={{
                              backgroundColor: 'rgba(231, 76, 60, 0.8)',
                              color: 'white',
                              padding: '1px 2px',
                              borderRadius: '2px',
                              textAlign: 'center',
                              fontSize: '6px',
                              fontWeight: 'bold',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              height: '10px',
                              lineHeight: '8px'
                            }}>
                              {day.tradeShows[0].name.length > 8 
                                ? day.tradeShows[0].name.substring(0, 8) + '...' 
                                : day.tradeShows[0].name
                              }
                            </div>
                          ) : day.tradeShows.length === 2 ? (
                            <>
                              <div style={{
                                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                                color: 'white',
                                padding: '0px 1px',
                                borderRadius: '1px',
                                textAlign: 'center',
                                fontSize: '5px',
                                fontWeight: 'bold',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                height: '6px',
                                lineHeight: '6px'
                              }}>
                                {day.tradeShows[0].name.length > 6 
                                  ? day.tradeShows[0].name.substring(0, 6) + '...' 
                                  : day.tradeShows[0].name
                                }
                              </div>
                              <div style={{
                                backgroundColor: 'rgba(243, 156, 18, 0.8)',
                                color: 'white',
                                padding: '0px 1px',
                                borderRadius: '1px',
                                textAlign: 'center',
                                fontSize: '5px',
                                fontWeight: 'bold',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                height: '6px',
                                lineHeight: '6px'
                              }}>
                                {day.tradeShows[1].name.length > 6 
                                  ? day.tradeShows[1].name.substring(0, 6) + '...' 
                                  : day.tradeShows[1].name
                                }
                              </div>
                            </>
                          ) : (
                            <div style={{
                              backgroundColor: 'rgba(231, 76, 60, 0.8)',
                              color: 'white',
                              padding: '1px 2px',
                              borderRadius: '2px',
                              textAlign: 'center',
                              fontSize: '6px',
                              fontWeight: 'bold',
                              height: '10px',
                              lineHeight: '8px'
                            }}>
                              {day.tradeShows.length} Messen
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* NEUE Messen-Liste unter dem Monat */}
                {(() => {
                  const monthTradeshows = tradeshows.filter(show => {
                    const startDate = new Date(show.start_date);
                    const endDate = new Date(show.end_date);
                    return (startDate.getMonth() === monthIndex && startDate.getFullYear() === currentYear) ||
                           (endDate.getMonth() === monthIndex && endDate.getFullYear() === currentYear) ||
                           (startDate.getMonth() < monthIndex && endDate.getMonth() > monthIndex && 
                            startDate.getFullYear() <= currentYear && endDate.getFullYear() >= currentYear);
                  });
                  
                  if (monthTradeshows.length === 0) return null;
                  
                  return (
                    <div style={{
                      marginTop: '15px',
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6'
                    }}>
                      <div style={{
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: '#2c3e50',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        📅 Messen ({monthTradeshows.length})
                      </div>
                      {monthTradeshows.map(show => (
                        <div key={show.id} style={{
                          fontSize: '11px',
                          padding: '4px 6px',
                          marginBottom: '3px',
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          borderLeft: '3px solid #e74c3c',
                          lineHeight: '1.3'
                        }}>
                          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                            {show.name}
                          </div>
                          <div style={{ color: '#7f8c8d', fontSize: '10px' }}>
                            📍 {show.location} | 📅 {new Date(show.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - {new Date(show.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ))}
            
            {/* NEUE Kommende Messen Panel - füllt die Lücke nach Dezember */}
            <div style={styles.monthContainer}>
              <UpcomingTradeShowsPanel tradeshows={tradeshows} />
            </div>
          </div>
        </div>
        
        {/* ERWEITERTE Event Tooltip */}
        <EventTooltip events={hoveredEvents} position={hoverPosition} visible={tooltipVisible} />
      </div>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>Messekalender verwalten</h1>
        <div style={styles.yearControls}>
          <button
            style={styles.yearButton}
            onClick={() => setCurrentYear(currentYear - 1)}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            ← {currentYear - 1}
          </button>
          <div style={styles.yearDisplay}>{currentYear}</div>
          <button
            style={styles.yearButton}
            onClick={() => setCurrentYear(currentYear + 1)}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            {currentYear + 1} →
          </button>
        </div>
        
        {selectedStartDate && (
          <div style={styles.selection}>
            {selectedEndDate ? (
              <span>
                📅 Messe geplant: {selectedStartDate.toLocaleDateString('de-DE')} bis {selectedEndDate.toLocaleDateString('de-DE')}
                <button
                  style={{...styles.button, ...styles.cancelButton, marginLeft: '15px', padding: '8px 16px'}}
                  onClick={resetForm}
                >
                  Auswahl zurücksetzen
                </button>
              </span>
            ) : (
              <span>
                📅 Startdatum gewählt: {selectedStartDate.toLocaleDateString('de-DE')} - Klicken Sie auf ein Enddatum
              </span>
            )}
          </div>
        )}
      </div>

      {/* NEUER Zeitfilter */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '2px solid #ecf0f1'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          padding: '8px 16px',
          borderRadius: '8px',
          backgroundColor: timeFilter === 'future' ? '#e8f4fd' : 'transparent',
          border: timeFilter === 'future' ? '2px solid #3498db' : '2px solid transparent',
          transition: 'all 0.3s ease'
        }}>
          <input
            type="radio"
            name="timeFilter"
            value="future"
            checked={timeFilter === 'future'}
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>🔮 Nur zukünftige Messen</span>
        </label>
        
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          padding: '8px 16px',
          borderRadius: '8px',
          backgroundColor: timeFilter === 'all' ? '#e8f4fd' : 'transparent',
          border: timeFilter === 'all' ? '2px solid #3498db' : '2px solid transparent',
          transition: 'all 0.3s ease'
        }}>
          <input
            type="radio"
            name="timeFilter"
            value="all"
            checked={timeFilter === 'all'}
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>📅 Alle Messen ({currentYear})</span>
        </label>
      </div>

      {showForm && (
        <div style={styles.form}>
          <h3 style={styles.formTitle}>
            {editingShow ? 'Messe bearbeiten' : 'Neue Messe hinzufügen'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
                  required
                />
              </div>
              <div>
                <label style={styles.label}>Ort:</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
                  required
                />
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Beschreibung:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={styles.textarea}
                onFocus={(e) => e.target.style.borderColor = '#3498db'}
                onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Bild (optional):</label>
              <input
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
                style={styles.fileInput}
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
                style={{...styles.button, ...styles.submitButton}}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
              >
                {editingShow ? 'Aktualisieren' : 'Erstellen'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.calendarWrapper}>
        <div style={styles.calendarGrid}>
          {calendar.map((month, monthIndex) => (
            <div key={monthIndex} style={styles.monthContainer}>
              <h3 style={styles.monthTitle}>{month.name}</h3>
              
              <div style={styles.dayHeaders}>
                {month.dayNames.map(dayName => (
                  <div key={dayName} style={styles.dayHeader}>
                    {dayName}
                  </div>
                ))}
              </div>
              
              <div style={styles.daysGrid}>
                {month.days.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    style={{
                      ...styles.dayCell,
                      ...(day.isEmpty ? {} : (day.isCurrentMonth ? styles.currentMonth : styles.otherMonth)),
                      ...(day.isToday ? styles.today : {}),
                      ...(day.isSelected ? styles.selected : {}),
                      ...(day.tradeShows && !day.isSelected ? getEventStyle(day.tradeShows) : {}),
                      // Leere Zellen sind nicht klickbar und haben keinen Style
                      ...(day.isEmpty ? { cursor: 'default', backgroundColor: 'transparent' } : {})
                    }}
                    onClick={() => !day.isEmpty && handleDateClick(day.date)}
                    onMouseEnter={(e) => {
                      if (day.tradeShows && day.tradeShows.length > 0) {
                        handleEventMouseEnter(day.tradeShows, e);
                      }
                      if (!day.isEmpty && day.isCurrentMonth && !kiosk && !day.tradeShows) {
                        e.target.style.backgroundColor = '#3498db';
                        e.target.style.color = 'white';
                        e.target.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      handleEventMouseLeave();
                      if (!day.isEmpty && !day.isSelected && !day.isToday && !kiosk && !day.tradeShows) {
                        e.target.style.backgroundColor = day.isCurrentMonth ? '#f8f9fa' : '#fdfdfd';
                        e.target.style.color = day.isCurrentMonth ? '#2c3e50' : '#bdc3c7';
                        e.target.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {day.date ? day.date.getDate() : ''}
                    {day.tradeShows && day.tradeShows.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        left: '2px',
                        right: '2px',
                        fontSize: '6px',
                        lineHeight: '1.1',
                        maxHeight: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1px'
                      }}>
                        {day.tradeShows.length === 1 ? (
                          <div style={{
                            backgroundColor: 'rgba(231, 76, 60, 0.8)',
                            color: 'white',
                            padding: '1px 2px',
                            borderRadius: '2px',
                            textAlign: 'center',
                            fontSize: '6px',
                            fontWeight: 'bold',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            height: '10px',
                            lineHeight: '8px'
                          }}>
                            {day.tradeShows[0].name.length > 8 
                              ? day.tradeShows[0].name.substring(0, 8) + '...' 
                              : day.tradeShows[0].name
                            }
                          </div>
                        ) : day.tradeShows.length === 2 ? (
                          <>
                            <div style={{
                              backgroundColor: 'rgba(231, 76, 60, 0.8)',
                              color: 'white',
                              padding: '0px 1px',
                              borderRadius: '1px',
                              textAlign: 'center',
                              fontSize: '5px',
                              fontWeight: 'bold',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              height: '6px',
                              lineHeight: '6px'
                            }}>
                              {day.tradeShows[0].name.length > 6 
                                ? day.tradeShows[0].name.substring(0, 6) + '...' 
                                : day.tradeShows[0].name
                              }
                            </div>
                            <div style={{
                              backgroundColor: 'rgba(243, 156, 18, 0.8)',
                              color: 'white',
                              padding: '0px 1px',
                              borderRadius: '1px',
                              textAlign: 'center',
                              fontSize: '5px',
                              fontWeight: 'bold',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              height: '6px',
                              lineHeight: '6px'
                            }}>
                              {day.tradeShows[1].name.length > 6 
                                ? day.tradeShows[1].name.substring(0, 6) + '...' 
                                : day.tradeShows[1].name
                              }
                            </div>
                          </>
                        ) : (
                          <div style={{
                            backgroundColor: 'rgba(231, 76, 60, 0.8)',
                            color: 'white',
                            padding: '1px 2px',
                            borderRadius: '2px',
                            textAlign: 'center',
                            fontSize: '6px',
                            fontWeight: 'bold',
                            height: '10px',
                            lineHeight: '8px'
                          }}>
                            {day.tradeShows.length} Messen
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
                  
                  {/* NEUE Messen-Liste unter dem Monat */}
                  {(() => {
                    const monthTradeshows = tradeshows.filter(show => {
                      const startDate = new Date(show.start_date);
                      const endDate = new Date(show.end_date);
                      return (startDate.getMonth() === monthIndex && startDate.getFullYear() === currentYear) ||
                             (endDate.getMonth() === monthIndex && endDate.getFullYear() === currentYear) ||
                             (startDate.getMonth() < monthIndex && endDate.getMonth() > monthIndex && 
                              startDate.getFullYear() <= currentYear && endDate.getFullYear() >= currentYear);
                    });
                    
                    if (monthTradeshows.length === 0) return null;
                    
                    return (
                      <div style={{
                        marginTop: '15px',
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6'
                      }}>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '14px',
                          color: '#2c3e50',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          📅 Messen ({monthTradeshows.length})
                        </div>
                        {monthTradeshows.map(show => (
                          <div key={show.id} style={{
                            fontSize: '11px',
                            padding: '4px 6px',
                            marginBottom: '3px',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            borderLeft: '3px solid #e74c3c',
                            lineHeight: '1.3',
                            cursor: kiosk ? 'default' : 'pointer'
                          }}
                          onClick={() => !kiosk && handleEdit(show)}
                          onMouseEnter={(e) => {
                            if (!kiosk) {
                              e.target.style.backgroundColor = '#e8f4fd';
                              e.target.style.borderLeftColor = '#3498db';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!kiosk) {
                              e.target.style.backgroundColor = 'white';
                              e.target.style.borderLeftColor = '#e74c3c';
                            }
                          }}
                          >
                            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                              {show.name}
                            </div>
                            <div style={{ color: '#7f8c8d', fontSize: '10px' }}>
                              📍 {show.location} | 📅 {new Date(show.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - {new Date(show.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
            </div>
          ))}
          
          {/* NEUE Kommende Messen Panel - füllt die Lücke nach Dezember */}
          <div style={styles.monthContainer}>
            <UpcomingTradeShowsPanel tradeshows={tradeshows} />
          </div>
        </div>
        
        {/* Event Tooltip */}
        <EventTooltip events={hoveredEvents} position={hoverPosition} visible={tooltipVisible} />
      </div>

      {tradeshows.length > 0 && (
        <div style={styles.tradeshowsList}>
          <h2 style={styles.listTitle}>
            Alle Veranstaltungen {currentYear} ({tradeshows.length} {tradeshows.length === 1 ? 'Veranstaltung' : 'Veranstaltungen'})
          </h2>
          {tradeshows.map(show => (
            <div key={show.id} style={styles.tradeshowItem}>
              <div style={styles.tradeshowContent}>
                <div style={styles.tradeshowName}>{show.name}</div>
                <div style={styles.tradeshowDetails}>📍 {show.location}</div>
                <div style={styles.tradeshowDetails}>
                  📅 {new Date(show.start_date).toLocaleDateString('de-DE')} - {new Date(show.end_date).toLocaleDateString('de-DE')}
                </div>
                {show.description && (
                  <div style={styles.tradeshowDetails}>{show.description}</div>
                )}
              </div>
              <div style={styles.tradeshowActions}>
                <button
                  style={styles.editButton}
                  onClick={() => handleEdit(show)}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
                >
                  Bearbeiten
                </button>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDelete(show.id)}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CSS Animation für Heute-Markierung */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 15px rgba(231, 76, 60, 0.4);
          }
          50% {
            box-shadow: 0 0 25px rgba(231, 76, 60, 0.8);
          }
          100% {
            box-shadow: 0 0 15px rgba(231, 76, 60, 0.4);
          }
        }
      `}</style>
    </Layout>
  );
};

export default TradeShowCalendar;