// client/src/components/OrganizationChart.js - Display Only Version
import React from 'react';

const OrganizationChart = ({ data, kiosk = false }) => {
  // Organisiere Daten in Hierarchie
  const organizeData = (items) => {
    const map = {};
    const roots = [];

    // Erstelle Map aller Items
    items.forEach(item => {
      map[item.id] = { ...item, children: [] };
    });

    // Organisiere Hierarchie
    items.forEach(item => {
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });

    // Sortiere Kinder nach Position
    const sortChildren = (node) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => (a.position || 0) - (b.position || 0));
        node.children.forEach(sortChildren);
      }
    };

    roots.forEach(sortChildren);
    return roots;
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
      'Support': '🎧'
    };
    return icons[department] || '🏢';
  };

  const getDepartmentColor = (department) => {
    const colors = {
      'Management': '#2c3e50',
      'IT': '#3498db',
      'Marketing': '#e91e63',
      'HR': '#1abc9c',
      'Finanzen': '#f39c12',
      'Vertrieb': '#27ae60',
      'Produktion': '#34495e',
      'Design': '#9b59b6',
      'Support': '#e67e22'
    };
    return colors[department] || '#7f8c8d';
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderConnector = (level, hasChildren) => {
    if (level === 0) return null;

    const connectorStyle = {
      position: 'absolute',
      top: kiosk ? '-35px' : '-25px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '3px',
      height: kiosk ? '35px' : '25px',
      backgroundColor: '#bdc3c7',
      zIndex: 1
    };

    return <div style={connectorStyle}></div>;
  };

  const renderNode = (node, level = 0) => {
    const departmentColor = getDepartmentColor(node.department);
    const departmentIcon = getDepartmentIcon(node.department);

    const styles = {
      nodeContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: kiosk ? '35px 20px' : '25px 15px',
        position: 'relative',
      },
      node: {
        backgroundColor: 'white',
        border: `3px solid ${departmentColor}`,
        borderRadius: kiosk ? '20px' : '15px',
        padding: kiosk ? '25px' : '20px',
        minWidth: kiosk ? '280px' : '220px',
        boxShadow: kiosk ? '0 8px 32px rgba(0,0,0,0.15)' : '0 4px 16px rgba(0,0,0,0.1)',
        position: 'relative',
        transition: 'all 0.3s ease',
        textAlign: 'center',
        background: `linear-gradient(135deg, white 0%, ${departmentColor}08 100%)`,
      },
      avatar: {
        width: kiosk ? '80px' : '60px',
        height: kiosk ? '80px' : '60px',
        borderRadius: '50%',
        backgroundColor: departmentColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: kiosk ? '32px' : '24px',
        fontWeight: 'bold',
        margin: '0 auto 15px',
        border: '3px solid white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      },
      name: {
        fontSize: kiosk ? '24px' : '18px',
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: kiosk ? '8px' : '6px',
      },
      title: {
        fontSize: kiosk ? '18px' : '14px',
        color: departmentColor,
        marginBottom: kiosk ? '8px' : '6px',
        fontWeight: '600',
      },
      department: {
        fontSize: kiosk ? '16px' : '12px',
        color: '#7f8c8d',
        backgroundColor: '#f8f9fa',
        padding: kiosk ? '6px 12px' : '4px 8px',
        borderRadius: '15px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
      },
      childrenContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: kiosk ? '20px' : '15px',
        marginTop: kiosk ? '30px' : '20px',
        position: 'relative',
      },
      levelIndicator: {
        position: 'absolute',
        top: kiosk ? '-15px' : '-10px',
        right: kiosk ? '-15px' : '-10px',
        backgroundColor: departmentColor,
        color: 'white',
        borderRadius: '50%',
        width: kiosk ? '30px' : '24px',
        height: kiosk ? '30px' : '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: kiosk ? '14px' : '12px',
        fontWeight: 'bold',
        zIndex: 2,
      }
    };

    // Wenn ein Avatar-Bild vorhanden ist, nutze es
    const avatarStyle = node.avatar ? {
      ...styles.avatar,
      backgroundImage: `url(/uploads/${node.avatar})`,
      fontSize: 0 // Verstecke Initialen wenn Bild vorhanden
    } : styles.avatar;

    return (
      <div key={node.id} style={styles.nodeContainer}>
        {renderConnector(level, node.children && node.children.length > 0)}
        
        <div 
          style={styles.node}
          onMouseOver={(e) => {
            if (!kiosk) {
              e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
            }
          }}
          onMouseOut={(e) => {
            if (!kiosk) {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = kiosk ? '0 8px 32px rgba(0,0,0,0.15)' : '0 4px 16px rgba(0,0,0,0.1)';
            }
          }}
        >
          <div style={styles.levelIndicator}>
            {level + 1}
          </div>
          
          <div style={avatarStyle}>
            {!node.avatar && getInitials(node.name)}
          </div>
          
          <div style={styles.name}>{node.name}</div>
          <div style={styles.title}>{node.position_title}</div>
          <div style={styles.department}>
            <span>{departmentIcon}</span>
            {node.department}
          </div>
        </div>
        
        {node.children && node.children.length > 0 && (
          <div style={styles.childrenContainer}>
            {node.children.map((child, index) => 
              renderNode(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const organizedData = organizeData(data);

  const styles = {
    container: {
      padding: kiosk ? '40px 20px' : '30px 20px',
      backgroundColor: '#f8f9fa',
      borderRadius: kiosk ? '20px' : '15px',
      margin: kiosk ? '20px 0' : '10px 0',
      overflow: 'auto',
    },
    title: {
      fontSize: kiosk ? '48px' : '32px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: kiosk ? '50px' : '30px',
      color: '#2c3e50',
      background: 'linear-gradient(135deg, #2c3e50, #3498db)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    chartContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      minHeight: kiosk ? '600px' : '400px',
    },
    legend: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: kiosk ? '20px' : '15px',
      marginBottom: kiosk ? '40px' : '30px',
      padding: kiosk ? '20px' : '15px',
      backgroundColor: 'white',
      borderRadius: kiosk ? '15px' : '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: kiosk ? '16px' : '14px',
      color: '#2c3e50',
    },
    legendColor: {
      width: kiosk ? '20px' : '16px',
      height: kiosk ? '20px' : '16px',
      borderRadius: '50%',
    }
  };

  // Erstelle Legende der verwendeten Abteilungen
  const departments = [...new Set(data.map(item => item.department))];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🏢 Unternehmens-Organigramm</h2>
      
      {departments.length > 1 && (
        <div style={styles.legend}>
          {departments.map(dept => (
            <div key={dept} style={styles.legendItem}>
              <div 
                style={{
                  ...styles.legendColor,
                  backgroundColor: getDepartmentColor(dept)
                }}
              ></div>
              <span>{getDepartmentIcon(dept)} {dept}</span>
            </div>
          ))}
        </div>
      )}
      
      <div style={styles.chartContainer}>
        {organizedData.map(root => renderNode(root, 0))}
      </div>
    </div>
  );
};

export default OrganizationChart;