// client/src/components/BookingCalendar.js - KORRIGIERTE VERSION
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookingCalendar = ({ vehicles, bookings, onRefresh }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Sichere Datum-Validierung
  const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  // Sichere Datum-Parsing
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      const parsed = new Date(dateString);
      return isValidDate(parsed) ? parsed : null;
    } catch (error) {
      console.warn('Ungültiges Datum:', dateString);
      return null;
    }
  };

  // Sichere Datum-String Konvertierung
  const getDateString = (date) => {
    if (!isValidDate(date)) return null;
    
    try {
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Fehler beim Konvertieren des Datums:', date);
      return null;
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Vorherige Monatstage
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Aktuelle Monatstage
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      const today = new Date();
      days.push({
        date: currentDay,
        isCurrentMonth: true,
        isToday: currentDay.toDateString() === today.toDateString()
      });
    }

    // Nächste Monatstage
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  };

  const getBookingsForDate = (date) => {
    const dateStr = getDateString(date);
    
    if (!dateStr) {
      console.warn('Ungültiges Datum für getBookingsForDate:', date);
      return [];
    }

    return bookings.filter(booking => {
      // Sichere Datum-Extraktion
      const startDate = parseDate(booking.start_datetime);
      const endDate = parseDate(booking.end_datetime);
      
      if (!startDate || !endDate) {
        console.warn('Ungültige Buchungsdaten:', {
          id: booking.id,
          start: booking.start_datetime,
          end: booking.end_datetime
        });
        return false;
      }
      
      const startDateStr = getDateString(startDate);
      const endDateStr = getDateString(endDate);
      
      if (!startDateStr || !endDateStr) {
        return false;
      }
      
      return dateStr >= startDateStr && dateStr <= endDateStr;
    });
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleUpdateBooking = async (bookingId, updates) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/vehicle-bookings/${bookingId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onRefresh();
      setShowModal(false);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Buchung:', error);
      alert('Fehler beim Aktualisieren der Buchung');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Möchten Sie diese Buchung wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/vehicle-bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onRefresh();
      setShowModal(false);
    } catch (error) {
      console.error('Fehler beim Löschen der Buchung:', error);
      alert('Fehler beim Löschen der Buchung');
    }
  };

  const changeMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getVehicleColor = (vehicleId) => {
    const colors = ['#3498db', '#e74c3c', '#f39c12', '#27ae60', '#9b59b6', '#1abc9c', '#34495e'];
    return colors[vehicleId % colors.length];
  };

  const formatDateTime = (dateString) => {
    const date = parseDate(dateString);
    
    if (!date) {
      return 'Ungültiges Datum';
    }
    
    try {
      return date.toLocaleString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Fehler beim Formatieren des Datums:', dateString);
      return 'Fehler beim Anzeigen';
    }
  };

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '15px',
      padding: '25px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px',
    },
    monthTitle: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    navButton: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: '12px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      transition: 'background-color 0.3s ease',
    },
    legend: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      flexWrap: 'wrap',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
    },
    legendColor: {
      width: '16px',
      height: '16px',
      borderRadius: '4px',
    },
    calendar: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '2px',
      border: '2px solid #ecf0f1',
      borderRadius: '10px',
      overflow: 'hidden',
    },
    dayHeader: {
      backgroundColor: '#34495e',
      color: 'white',
      padding: '15px',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: '14px',
    },
    dayCell: {
      minHeight: '120px',
      padding: '8px',
      backgroundColor: '#ffffff',
      border: '1px solid #ecf0f1',
      position: 'relative',
      overflow: 'hidden',
    },
    otherMonth: {
      backgroundColor: '#f8f9fa',
      color: '#bdc3c7',
    },
    today: {
      backgroundColor: '#e8f4fd',
      border: '2px solid #3498db',
    },
    dayNumber: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '5px',
    },
    booking: {
      backgroundColor: '#3498db',
      color: 'white',
      padding: '3px 6px',
      borderRadius: '4px',
      fontSize: '11px',
      marginBottom: '2px',
      cursor: 'pointer',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      transition: 'all 0.2s ease',
    },
    bookingError: {
      backgroundColor: '#e74c3c',
      color: 'white',
      padding: '3px 6px',
      borderRadius: '4px',
      fontSize: '10px',
      marginBottom: '2px',
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
      maxWidth: '500px',
      maxHeight: '80vh',
      overflow: 'auto',
    },
    modalHeader: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: '#2c3e50',
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '10px',
      padding: '10px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
    },
    detailLabel: {
      fontWeight: 'bold',
      color: '#34495e',
    },
    detailValue: {
      color: '#7f8c8d',
    },
    statusSelect: {
      padding: '8px 12px',
      border: '2px solid #ecf0f1',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white',
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      marginTop: '20px',
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
    updateButton: {
      backgroundColor: '#27ae60',
      color: 'white',
      flex: 1,
    },
    deleteButton: {
      backgroundColor: '#e74c3c',
      color: 'white',
    },
    closeButton: {
      backgroundColor: '#95a5a6',
      color: 'white',
    },
    errorMessage: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#dc2626',
      padding: '10px',
      borderRadius: '8px',
      marginBottom: '20px',
      fontSize: '14px',
    }
  };

  const days = getDaysInMonth(currentDate);
  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  // Debug-Informationen
  const invalidBookings = bookings.filter(booking => {
    const startDate = parseDate(booking.start_datetime);
    const endDate = parseDate(booking.end_datetime);
    return !startDate || !endDate;
  });

  return (
    <div style={styles.container}>
      {invalidBookings.length > 0 && (
        <div style={styles.errorMessage}>
          ⚠️ Warnung: {invalidBookings.length} Buchung(en) haben ungültige Daten und werden nicht angezeigt.
          <details style={{ marginTop: '5px' }}>
            <summary>Details anzeigen</summary>
            {invalidBookings.map(booking => (
              <div key={booking.id} style={{ fontSize: '12px', marginTop: '2px' }}>
                ID {booking.id}: Start: "{booking.start_datetime}", Ende: "{booking.end_datetime}"
              </div>
            ))}
          </details>
        </div>
      )}

      <div style={styles.header}>
        <button
          style={styles.navButton}
          onClick={() => changeMonth(-1)}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
        >
          ← Vorheriger Monat
        </button>
        
        <h2 style={styles.monthTitle}>
          {currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        </h2>
        
        <button
          style={styles.navButton}
          onClick={() => changeMonth(1)}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
        >
          Nächster Monat →
        </button>
      </div>

      {vehicles.length > 0 && (
        <div style={styles.legend}>
          <strong>Fahrzeuge:</strong>
          {vehicles.map(vehicle => (
            <div key={vehicle.id} style={styles.legendItem}>
              <div 
                style={{
                  ...styles.legendColor,
                  backgroundColor: getVehicleColor(vehicle.id)
                }}
              />
              <span>{vehicle.brand} {vehicle.model} ({vehicle.license_plate})</span>
            </div>
          ))}
        </div>
      )}

      <div style={styles.calendar}>
        {dayNames.map(day => (
          <div key={day} style={styles.dayHeader}>
            {day}
          </div>
        ))}
        
        {days.map((day, index) => {
          const dayBookings = getBookingsForDate(day.date);
          
          return (
            <div
              key={index}
              style={{
                ...styles.dayCell,
                ...(day.isCurrentMonth ? {} : styles.otherMonth),
                ...(day.isToday ? styles.today : {})
              }}
            >
              <div style={styles.dayNumber}>
                {day.date.getDate()}
              </div>
              
              {dayBookings.map(booking => {
                // Prüfe nochmals die Booking-Daten
                const startDate = parseDate(booking.start_datetime);
                const endDate = parseDate(booking.end_datetime);
                
                if (!startDate || !endDate) {
                  return (
                    <div key={booking.id} style={styles.bookingError}>
                      ❌ Fehlerhafte Buchung
                    </div>
                  );
                }

                return (
                  <div
                    key={booking.id}
                    style={{
                      ...styles.booking,
                      backgroundColor: getVehicleColor(booking.vehicle_id)
                    }}
                    onClick={() => handleBookingClick(booking)}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                      e.target.style.zIndex = '10';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.zIndex = '1';
                    }}
                    title={`${booking.employee_name} - ${booking.purpose}`}
                  >
                    🚗 {booking.employee_name}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {showModal && selectedBooking && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalHeader}>
              📅 Buchungsdetails
            </h3>
            
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Fahrzeug:</span>
              <span style={styles.detailValue}>
                {selectedBooking.brand} {selectedBooking.model} ({selectedBooking.license_plate})
              </span>
            </div>
            
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Fahrer:</span>
              <span style={styles.detailValue}>{selectedBooking.employee_name}</span>
            </div>
            
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Zweck:</span>
              <span style={styles.detailValue}>{selectedBooking.purpose}</span>
            </div>
            
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Von:</span>
              <span style={styles.detailValue}>
                {formatDateTime(selectedBooking.start_datetime)}
              </span>
            </div>
            
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Bis:</span>
              <span style={styles.detailValue}>
                {formatDateTime(selectedBooking.end_datetime)}
              </span>
            </div>
            
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Status:</span>
              <select
                style={styles.statusSelect}
                value={selectedBooking.status}
                onChange={(e) => setSelectedBooking({
                  ...selectedBooking,
                  status: e.target.value
                })}
              >
                <option value="aktiv">Aktiv</option>
                <option value="abgeschlossen">Abgeschlossen</option>
                <option value="storniert">Storniert</option>
              </select>
            </div>

            {selectedBooking.notes && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Notizen:</span>
                <span style={styles.detailValue}>{selectedBooking.notes}</span>
              </div>
            )}
            
            <div style={styles.buttonGroup}>
              <button
                style={{...styles.button, ...styles.updateButton}}
                onClick={() => handleUpdateBooking(selectedBooking.id, {
                  status: selectedBooking.status
                })}
                onMouseOver={(e) => e.target.style.backgroundColor = '#219a52'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
              >
                Aktualisieren
              </button>
              
              <button
                style={{...styles.button, ...styles.deleteButton}}
                onClick={() => handleDeleteBooking(selectedBooking.id)}
                onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
              >
                Löschen
              </button>
              
              <button
                style={{...styles.button, ...styles.closeButton}}
                onClick={() => setShowModal(false)}
                onMouseOver={(e) => e.target.style.backgroundColor = '#7f8c8d'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#95a5a6'}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;