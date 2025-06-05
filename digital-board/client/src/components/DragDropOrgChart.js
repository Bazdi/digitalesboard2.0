// client/src/components/DragDropOrgChart.js
import React, { useState, useRef } from 'react';

const DragDropOrgChart = ({ data, onUpdateHierarchy, onAddSubordinate, kiosk = false }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const dragRef = useRef();

  // Organisiere Daten in Hierarchie
  const organizeData = (items) => {
    const map = {};
    const roots = [];

    items.forEach(item => {
      map[item.id] = { ...item, children: [] };
    });

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

  const handleDragStart = (e, item) => {
    if (kiosk) return;
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, targetItem) => {
    e.preventDefault();
    if (draggedItem && draggedItem.id !== targetItem.id) {
      setDropTarget(targetItem.id);
    }
  };

  const handleDragLeave = (e) => {
    // Nur Drop-Target entfernen, wenn wir wirklich das Element verlassen
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTarget(null);
    }
  };

  const handleDrop = async (e, targetItem) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      return;
    }

    // Verhindere zirkuläre Abhängigkeiten
    if (isDescendant(targetItem, draggedItem)) {
      alert('Fehler: Ein Mitarbeiter kann nicht unter seinen eigenen Untergebenen platziert werden!');
      setDraggedItem(null);
      return;
    }

    // Berechne neue Hierarchie-Daten
    const newLevel = targetItem.level + 1;
    const newPosition = targetItem.children ? targetItem.children.length : 0;

    const updatedItem = {
      ...draggedItem,
      parent_id: targetItem.id,
      level: newLevel,
      position: newPosition
    };

    try {
      await onUpdateHierarchy(updatedItem);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Hierarchie:', error);
      alert('Fehler beim Speichern der neuen Position');
    }

    setDraggedItem(null);
  };

  const handleDropAsRoot = async (e) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedItem) return;

    const updatedItem = {
      ...draggedItem,
      parent_id: null,
      level: 0,
      position: 0
    };

    try {
      await onUpdateHierarchy(updatedItem);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Hierarchie:', error);
      alert('Fehler beim Speichern der neuen Position');
    }

    setDraggedItem(null);
  };

  // NEUE Funktion: Add Subordinate Handler
  const handleAddSubordinate = (parentNode) => {
    if (onAddSubordinate) {
      onAddSubordinate(parentNode);
    }
  };

  // Prüfe ob targetItem ein Nachfahre von draggedItem ist
  const isDescendant = (targetItem, potentialAncestor) => {
    const allData = organizeData(data);
    
    const findInTree = (nodes, searchId) => {
      for (const node of nodes) {
        if (node.id === searchId) return node;
        if (node.children) {
          const found = findInTree(node.children, searchId);
          if (found) return found;
        }
      }
      return null;
    };

    const ancestorNode = findInTree(allData, potentialAncestor.id);
    if (!ancestorNode) return false;

    const checkDescendants = (node) => {
      if (node.id === targetItem.id) return true;
      if (node.children) {
        return node.children.some(checkDescendants);
      }
      return false;
    };

    return checkDescendants(ancestorNode);
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
      'Lager': '📦'
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
      'Support': '#e67e22',
      'Lager': '#8b4513'
    };
    return colors[department] || '#7f8c8d';
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderNode = (node, level = 0) => {
    const departmentColor = getDepartmentColor(node.department);
    const departmentIcon = getDepartmentIcon(node.department);
    const isDropping = dropTarget === node.id;
    const isDragging = draggedItem && draggedItem.id === node.id;

    const styles = {
      nodeContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: kiosk ? '30px 15px' : '20px 10px',
        position: 'relative',
      },
      node: {
        backgroundColor: isDragging ? '#ecf0f1' : 'white',
        border: `3px solid ${isDropping ? '#27ae60' : departmentColor}`,
        borderRadius: kiosk ? '20px' : '15px',
        padding: kiosk ? '25px' : '20px',
        minWidth: kiosk ? '250px' : '200px',
        boxShadow: isDragging ? '0 8px 32px rgba(0,0,0,0.3)' : 
                   isDropping ? '0 8px 32px rgba(39, 174, 96, 0.3)' :
                   kiosk ? '0 6px 24px rgba(0,0,0,0.1)' : '0 4px 16px rgba(0,0,0,0.1)',
        position: 'relative',
        transition: 'all 0.3s ease',
        textAlign: 'center',
        cursor: kiosk ? 'default' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: isDropping ? 'scale(1.05)' : 'scale(1)',
        background: isDropping ? 
          `linear-gradient(135deg, #d5f4e6 0%, white 100%)` :
          `linear-gradient(135deg, white 0%, ${departmentColor}08 100%)`,
      },
      dragHandle: {
        position: 'absolute',
        top: kiosk ? '10px' : '8px',
        right: kiosk ? '10px' : '8px',
        fontSize: kiosk ? '20px' : '16px',
        opacity: kiosk ? 0 : 0.5,
        cursor: 'grab',
      },
      avatar: {
        width: kiosk ? '70px' : '50px',
        height: kiosk ? '70px' : '50px',
        borderRadius: '50%',
        backgroundColor: departmentColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: kiosk ? '24px' : '18px',
        fontWeight: 'bold',
        margin: '0 auto 12px',
        border: '3px solid white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      },
      name: {
        fontSize: kiosk ? '20px' : '16px',
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: kiosk ? '6px' : '4px',
      },
      title: {
        fontSize: kiosk ? '16px' : '12px',
        color: departmentColor,
        marginBottom: kiosk ? '6px' : '4px',
        fontWeight: '600',
      },
      department: {
        fontSize: kiosk ? '14px' : '10px',
        color: '#7f8c8d',
        backgroundColor: '#f8f9fa',
        padding: kiosk ? '4px 8px' : '3px 6px',
        borderRadius: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      },
      childrenContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: kiosk ? '15px' : '10px',
        marginTop: kiosk ? '25px' : '15px',
        position: 'relative',
      },
      dropZone: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%',
        borderRadius: kiosk ? '20px' : '15px',
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
        border: '2px dashed #27ae60',
        display: isDropping ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: kiosk ? '18px' : '14px',
        color: '#27ae60',
        fontWeight: 'bold',
        zIndex: 10,
        pointerEvents: 'none',
      }
    };

    return (
      <div key={node.id} style={styles.nodeContainer}>
        <div 
          style={styles.node}
          draggable={!kiosk}
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, node)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
        >
          {!kiosk && <div style={styles.dragHandle}>⋮⋮</div>}
          
          <div style={styles.dropZone}>
            📥 Hier ablegen
          </div>
          
          <div 
            style={{
              ...styles.avatar,
              backgroundImage: node.avatar ? `url(/uploads/${node.avatar})` : 'none'
            }}
          >
            {!node.avatar && getInitials(node.name)}
          </div>
          
          <div style={styles.name}>{node.name}</div>
          <div style={styles.title}>{node.position_title}</div>
          <div style={styles.department}>
            <span>{departmentIcon}</span>
            {node.department}
          </div>
          
          {/* NEUER Add-Subordinate-Button - nur im Admin-Modus */}
          {!kiosk && onAddSubordinate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddSubordinate(node);
              }}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.3s ease',
                width: '100%'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#219a52';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#27ae60';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={`Untergebenen zu ${node.name} hinzufügen`}
            >
              <span>👥</span>
              Untergebenen hinzufügen
            </button>
          )}
        </div>
        
        {node.children && node.children.length > 0 && (
          <div style={styles.childrenContainer}>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const organizedData = organizeData(data);

  const styles = {
    container: {
      padding: kiosk ? '30px 15px' : '20px 10px',
      backgroundColor: '#f8f9fa',
      borderRadius: kiosk ? '20px' : '15px',
      margin: kiosk ? '20px 0' : '10px 0',
      overflow: 'auto',
      position: 'relative',
    },
    title: {
      fontSize: kiosk ? '40px' : '28px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: kiosk ? '40px' : '25px',
      color: '#2c3e50',
    },
    instructions: kiosk ? { display: 'none' } : {
      backgroundColor: '#3498db',
      color: 'white',
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '20px',
      textAlign: 'center',
      fontSize: '16px',
    },
    chartContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      minHeight: kiosk ? '500px' : '300px',
    },
    rootDropZone: {
      width: '100%',
      minHeight: '100px',
      border: draggedItem ? '3px dashed #27ae60' : '3px dashed transparent',
      borderRadius: '15px',
      backgroundColor: draggedItem ? 'rgba(39, 174, 96, 0.1)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
      fontSize: '18px',
      color: '#27ae60',
      fontWeight: 'bold',
      transition: 'all 0.3s ease',
    }
  };

  return (
    <div style={styles.container}>
      {!kiosk && (
        <div style={styles.instructions}>
          💡 <strong>Einfache Bedienung:</strong> Ziehen Sie Mitarbeiter per Drag & Drop auf andere Personen, um die Hierarchie zu ändern!
        </div>
      )}
      
      <h2 style={styles.title}>🏢 Unternehmens-Organigramm</h2>
      
      {!kiosk && (
        <div 
          style={styles.rootDropZone}
          onDragOver={handleDragOver}
          onDrop={handleDropAsRoot}
        >
          {draggedItem ? '👑 Hier ablegen um zur obersten Ebene zu machen' : ''}
        </div>
      )}
      
      <div style={styles.chartContainer}>
        {organizedData.map(root => renderNode(root, 0))}
      </div>
    </div>
  );
};

export default DragDropOrgChart;