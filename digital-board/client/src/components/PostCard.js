import React from 'react';

const PostCard = ({ post, kiosk = false, onEdit, onDelete }) => {
  const styles = {
    card: {
      backgroundColor: 'white',
      borderRadius: kiosk ? '20px' : '10px',
      padding: kiosk ? '40px' : '20px',
      marginBottom: kiosk ? '40px' : '20px',
      boxShadow: kiosk ? '0 8px 32px rgba(0,0,0,0.1)' : '0 4px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    },
    title: {
      fontSize: kiosk ? '48px' : '24px',
      fontWeight: 'bold',
      marginBottom: kiosk ? '25px' : '15px',
      color: '#2c3e50',
      lineHeight: '1.3',
    },
    content: {
      fontSize: kiosk ? '28px' : '16px',
      lineHeight: '1.6',
      color: '#34495e',
      marginBottom: kiosk ? '25px' : '15px',
    },
    image: {
      width: '100%',
      maxHeight: kiosk ? '600px' : '300px',
      objectFit: 'cover',
      borderRadius: kiosk ? '15px' : '8px',
      marginBottom: kiosk ? '25px' : '15px',
    },
    meta: {
      fontSize: kiosk ? '20px' : '14px',
      color: '#7f8c8d',
      borderTop: '1px solid #ecf0f1',
      paddingTop: kiosk ? '20px' : '10px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    actions: {
      display: 'flex',
      gap: '10px',
    },
    button: {
      padding: kiosk ? '15px 25px' : '8px 16px',
      fontSize: kiosk ? '18px' : '14px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'background-color 0.3s ease',
      minHeight: kiosk ? '60px' : 'auto',
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

  return (
    <div 
      style={styles.card}
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
      <h2 style={styles.title}>{post.title}</h2>
      
      {post.image && (
        <img
          src={`/uploads/${post.image}`}
          alt={post.title}
          style={styles.image}
        />
      )}
      
      <div style={styles.content}>
        {post.content.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < post.content.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
      
      <div style={styles.meta}>
        <span>
          {new Date(post.created_at).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
        
        {!kiosk && (
          <div style={styles.actions}>
            <button
              style={{...styles.button, ...styles.editButton}}
              onClick={() => onEdit(post)}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              Bearbeiten
            </button>
            <button
              style={{...styles.button, ...styles.deleteButton}}
              onClick={() => onDelete(post.id)}
              onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
            >
              Löschen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard; 