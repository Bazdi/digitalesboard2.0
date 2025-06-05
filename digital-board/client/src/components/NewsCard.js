// client/src/components/NewsCard.js
import React from 'react';

const NewsCard = ({ news, kiosk = false, onEdit, onDelete }) => {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 3: return '#e74c3c'; // Hoch
      case 2: return '#f39c12'; // Mittel
      default: return '#95a5a6'; // Niedrig
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 3: return 'Hoch';
      case 2: return 'Mittel';
      default: return 'Niedrig';
    }
  };

  const styles = {
    card: {
      backgroundColor: 'white',
      borderRadius: kiosk ? '20px' : '10px',
      padding: kiosk ? '30px' : '25px',
      marginBottom: kiosk ? '30px' : '20px',
      boxShadow: kiosk ? '0 8px 32px rgba(0,0,0,0.1)' : '0 4px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      border: news.is_breaking ? '3px solid #e74c3c' : '2px solid transparent',
      position: 'relative',
    },
    breakingCard: {
      backgroundColor: '#fdf2f2',
      animation: kiosk ? 'glow 2s infinite alternate' : 'none',
    },
    breakingBanner: {
      position: 'absolute',
      top: '-2px',
      right: '-2px',
      backgroundColor: '#e74c3c',
      color: 'white',
      padding: '5px 15px',
      fontSize: kiosk ? '14px' : '12px',
      fontWeight: 'bold',
      borderRadius: '0 20px 0 10px',
      animation: 'pulse 2s infinite',
    },
    title: {
      fontSize: kiosk ? '36px' : '24px',
      fontWeight: 'bold',
      marginBottom: kiosk ? '20px' : '15px',
      color: '#2c3e50',
      lineHeight: '1.3',
    },
    meta: {
      display: 'flex',
      gap: kiosk ? '15px' : '10px',
      alignItems: 'center',
      marginBottom: kiosk ? '20px' : '15px',
      flexWrap: 'wrap',
    },
    badge: {
      padding: kiosk ? '8px 16px' : '4px 12px',
      borderRadius: '15px',
      fontSize: kiosk ? '14px' : '12px',
      fontWeight: 'bold',
      color: 'white',
    },
    breakingBadge: {
      backgroundColor: '#e74c3c',
      animation: 'pulse 2s infinite',
    },
    summary: {
      fontSize: kiosk ? '20px' : '16px',
      fontStyle: 'italic',
      color: '#7f8c8d',
      backgroundColor: '#f8f9fa',
      padding: kiosk ? '20px' : '15px',
      borderRadius: kiosk ? '10px' : '8px',
      marginBottom: kiosk ? '20px' : '15px',
      borderLeft: '4px solid #3498db',
    },
    content: {
      fontSize: kiosk ? '22px' : '16px',
      lineHeight: '1.6',
      color: '#34495e',
      marginBottom: kiosk ? '20px' : '15px',
    },
    image: {
      width: '100%',
      maxHeight: kiosk ? '400px' : '250px',
      objectFit: 'cover',
      borderRadius: kiosk ? '15px' : '8px',
      marginBottom: kiosk ? '20px' : '15px',
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: kiosk ? '20px' : '15px',
      borderTop: '2px solid #ecf0f1',
    },
    date: {
      fontSize: kiosk ? '16px' : '14px',
      color: '#7f8c8d',
    },
    expiry: {
      fontSize: kiosk ? '14px' : '12px',
      color: '#e74c3c',
      fontWeight: 'bold',
      marginLeft: '10px',
    },
    actions: {
      display: 'flex',
      gap: '10px',
    },
    button: {
      padding: kiosk ? '12px 20px' : '8px 16px',
      fontSize: kiosk ? '16px' : '14px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'background-color 0.3s ease',
    },
    editButton: {
      backgroundColor: '#3498db',
      color: 'white',
    },
    deleteButton: {
      backgroundColor: '#e74c3c',
      color: 'white',
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    return expiry <= threeDaysFromNow;
  };

  return (
    <div 
      style={{
        ...styles.card,
        ...(news.is_breaking ? styles.breakingCard : {})
      }}
      onMouseOver={(e) => {
        if (!kiosk) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
        }
      }}
      onMouseOut={(e) => {
        if (!kiosk) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        }
      }}
    >
      {news.is_breaking && (
        <div style={styles.breakingBanner}>
          🚨 BREAKING
        </div>
      )}

      <h2 style={styles.title}>{news.title}</h2>
      
      <div style={styles.meta}>
        {news.is_breaking && (
          <span style={{...styles.badge, ...styles.breakingBadge}}>
            🚨 EILMELDUNG
          </span>
        )}
        <span 
          style={{
            ...styles.badge,
            backgroundColor: getCategoryColor(news.category)
          }}
        >
          {news.category}
        </span>
        {!kiosk && (
          <span 
            style={{
              ...styles.badge,
              backgroundColor: getPriorityColor(news.priority)
            }}
          >
            {getPriorityText(news.priority)}
          </span>
        )}
      </div>

      {news.image && (
        <img
          src={`/uploads/${news.image}`}
          alt={news.title}
          style={styles.image}
        />
      )}

      {news.summary && (
        <div style={styles.summary}>
          📄 {news.summary}
        </div>
      )}
      
      <div style={styles.content}>
        {kiosk && news.summary ? (
          // Im Kiosk-Modus: zeige nur Summary oder gekürzten Content
          news.content.length > 200 ? 
            news.content.substring(0, 200) + '...' : 
            news.content
        ) : (
          // Im Admin-Modus: zeige vollen Content
          news.content.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < news.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))
        )}
      </div>
      
      <div style={styles.footer}>
        <div>
          <span style={styles.date}>
            {formatDate(news.created_at)}
          </span>
          {news.expires_at && (
            <span style={{
              ...styles.expiry,
              color: isExpiringSoon(news.expires_at) ? '#e74c3c' : '#f39c12'
            }}>
              ⏰ Läuft ab: {new Date(news.expires_at).toLocaleDateString('de-DE')}
              {isExpiringSoon(news.expires_at) && ' (Bald!)'}
            </span>
          )}
        </div>
        
        {!kiosk && onEdit && onDelete && (
          <div style={styles.actions}>
            <button
              style={{...styles.button, ...styles.editButton}}
              onClick={() => onEdit(news)}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              ✏️ Bearbeiten
            </button>
            <button
              style={{...styles.button, ...styles.deleteButton}}
              onClick={() => onDelete(news.id)}
              onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
            >
              🗑️ Löschen
            </button>
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

export default NewsCard;