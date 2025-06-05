// client/src/pages/WarehouseView3D.js
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Plane } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';

// 3D Warehouse Area Component
function WarehouseArea({ area, onClick, isSelected }) {
  const meshRef = useRef();
  const textRef = useRef();
  const typeTextRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Subtle floating animation for the box
      const baseY = (area.height || 50)/200; // Half height as center point
      const floatingOffset = Math.sin(state.clock.elapsedTime + area.id) * 0.05;
      meshRef.current.position.y = baseY + floatingOffset;
      
      // Sync text labels with the floating box
      if (textRef.current) {
        textRef.current.position.y = baseY + (area.height || 50)/100 + 0.8 + floatingOffset;
      }
      if (typeTextRef.current) {
        typeTextRef.current.position.y = baseY + (area.height || 50)/100 + 0.5 + floatingOffset;
      }
      
      // Hover effect
      if (hovered) {
        meshRef.current.scale.setScalar(1.05);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  const getAreaColor = (type) => {
    switch (type) {
      case 'lager': return '#3498db';
      case 'verladung': return '#e74c3c';
      case 'büro': return '#9b59b6';
      case 'kühlung': return '#f39c12';
      case 'gang': return '#95a5a6';
      default: return '#2ecc71';
    }
  };

  const color = getAreaColor(area.area_type);
  const emissiveColor = hovered || isSelected ? color : '#000000';
  const emissiveIntensity = hovered || isSelected ? 0.2 : 0;

  // Normalize positions and sizes
  const x = ((area.x_position || 0) - 500) / 100;
  const z = ((area.y_position || 0) - 250) / 100;
  const width = (area.width || 100) / 100;
  const height = (area.height || 50) / 100;
  const depth = width; // Make it more cube-like

  return (
    <group position={[x, 0, z]}>
      <Box
        ref={meshRef}
        args={[width, height, depth]}
        onClick={() => onClick(area)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.1}
        />
      </Box>
      
      {/* Area Label - positioned above the box */}
      <Text
        ref={textRef}
        position={[0, height + 0.8, 0]}
        fontSize={0.25}
        color="#2c3e50"
        anchorX="center"
        anchorY="middle"
        maxWidth={width * 2}
      >
        {area.name}
      </Text>
      
      {/* Type Label - positioned above the name */}
      <Text
        ref={typeTextRef}
        position={[0, height + 0.5, 0]}
        fontSize={0.15}
        color="#7f8c8d"
        anchorX="center"
        anchorY="middle"
      >
        {area.area_type?.toUpperCase() || 'AREA'}
      </Text>
    </group>
  );
}

// Ground Grid Component
function WarehouseFloor() {
  return (
    <group>
      {/* Main Floor */}
      <Plane 
        args={[20, 15]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.05, 0]}
      >
        <meshStandardMaterial color="#ecf0f1" />
      </Plane>
      
      {/* Grid Lines */}
      {Array.from({ length: 21 }, (_, i) => (
        <Plane
          key={`grid-x-${i}`}
          args={[0.02, 15]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-10 + i, 0, 0]}
        >
          <meshBasicMaterial color="#bdc3c7" transparent opacity={0.3} />
        </Plane>
      ))}
      
      {Array.from({ length: 16 }, (_, i) => (
        <Plane
          key={`grid-z-${i}`}
          args={[20, 0.02]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, -7.5 + i]}
        >
          <meshBasicMaterial color="#bdc3c7" transparent opacity={0.3} />
        </Plane>
      ))}
    </group>
  );
}

// Lighting Setup
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.4} />
      <pointLight position={[0, 8, 0]} intensity={0.6} />
    </>
  );
}

// Camera Controller
function CameraController() {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(12, 8, 12);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return <OrbitControls 
    enablePan={true} 
    enableZoom={true} 
    enableRotate={true}
    minDistance={5}
    maxDistance={50}
    maxPolarAngle={Math.PI / 2}
  />;
}

// Loading Spinner
function LoadingSpinner() {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '24px',
      color: '#3498db',
      textAlign: 'center',
      zIndex: 1000
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '5px solid #ecf0f1',
        borderTop: '5px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }}></div>
      Lade 3D Warehouse...
    </div>
  );
}

// Debug Helper Component
function DebugHelper({ areas }) {
  return (
    <group>
      {/* Coordinate System Helper */}
      <arrowHelper 
        args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 2, 0xff0000]}
      />
      <arrowHelper 
        args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 2, 0x00ff00]}
      />
      <arrowHelper 
        args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 2, 0x0000ff]}
      />
      
      {/* Debug info */}
      <Text
        position={[0, 5, 0]}
        fontSize={0.5}
        color="#ff0000"
        anchorX="center"
        anchorY="middle"
      >
        {`${areas.length} Areas Loaded`}
      </Text>
    </group>
  );
}

// Main Component
const WarehouseView3D = () => {
  const [areas, setAreas] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState(null);
  const [stats, setStats] = useState({});
  const [debug, setDebug] = useState(true);

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    try {
      console.log('Fetching warehouse data for 3D view...');
      const [areasRes, itemsRes, statsRes] = await Promise.all([
        axios.get('/api/warehouse/areas'),
        axios.get('/api/warehouse/items'),
        axios.get('/api/warehouse/stats')
      ]);
      
      console.log('Areas loaded:', areasRes.data);
      console.log('Items loaded:', itemsRes.data.length);
      
      setAreas(areasRes.data);
      setItems(itemsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Fehler beim Laden der Warehouse-Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAreaClick = (area) => {
    console.log('Area clicked:', area);
    setSelectedArea(selectedArea?.id === area.id ? null : area);
  };

  const getAreaItems = (areaId) => {
    return items.filter(item => item.area_id === areaId);
  };

  const styles = {
    container: {
      width: '100vw',
      height: '100vh',
      position: 'relative',
      backgroundColor: '#f8f9fa',
    },
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(44, 62, 80, 0.95)',
      color: 'white',
      padding: '20px',
      zIndex: 100,
      backdropFilter: 'blur(10px)',
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      margin: 0,
      textAlign: 'center',
    },
    backButton: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      backgroundColor: '#3498db',
      color: 'white',
      padding: '10px 20px',
      textDecoration: 'none',
      borderRadius: '5px',
      fontSize: '16px',
      fontWeight: 'bold',
    },
    debugButton: {
      position: 'absolute',
      top: '20px',
      right: '370px',
      backgroundColor: debug ? '#e74c3c' : '#27ae60',
      color: 'white',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
    },
    sidebar: {
      position: 'absolute',
      right: 0,
      top: '80px',
      bottom: 0,
      width: '350px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '20px',
      overflowY: 'auto',
      zIndex: 50,
      backdropFilter: 'blur(10px)',
      borderLeft: '1px solid #ecf0f1',
    },
    canvas: {
      width: '100%',
      height: '100%',
    },
    controls: {
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: '15px',
      borderRadius: '10px',
      zIndex: 100,
    },
    legend: {
      marginBottom: '20px',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '8px',
      fontSize: '14px',
    },
    colorBox: {
      width: '16px',
      height: '16px',
      marginRight: '8px',
      borderRadius: '3px',
    },
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Header */}
      <div style={styles.header}>
        <a href="/admin/warehouse" style={styles.backButton}>← Zurück</a>
        <button 
          style={styles.debugButton}
          onClick={() => setDebug(!debug)}
        >
          {debug ? 'Debug AUS' : 'Debug AN'}
        </button>
        <h1 style={styles.title}>🏭 3D Warehouse Visualisierung</h1>
      </div>

      {/* Loading */}
      {loading && <LoadingSpinner />}

      {/* 3D Canvas */}
      <Canvas
        style={styles.canvas}
        shadows
        camera={{ 
          position: [12, 8, 12], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
      >
        <Suspense fallback={null}>
          <Lighting />
          <CameraController />
          <WarehouseFloor />
          
          {debug && <DebugHelper areas={areas} />}
          
          {areas.map(area => (
            <WarehouseArea
              key={area.id}
              area={area}
              onClick={handleAreaClick}
              isSelected={selectedArea?.id === area.id}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h3>📊 Warehouse Stats</h3>
        <div style={{ marginBottom: '20px', fontSize: '14px' }}>
          <div>📦 Bereiche: <strong>{stats.total_areas || 0}</strong></div>
          <div>📋 Artikel: <strong>{stats.total_items || 0}</strong></div>
          <div>📊 Gesamtmenge: <strong>{stats.total_quantity || 0}</strong></div>
          <div style={{ color: '#e74c3c' }}>⚠️ Niedriger Bestand: <strong>{stats.low_stock_items || 0}</strong></div>
        </div>

        <div style={styles.legend}>
          <h4>🎨 Bereichstypen</h4>
          {[
            { type: 'lager', color: '#3498db', name: 'Lager' },
            { type: 'verladung', color: '#e74c3c', name: 'Verladung' },
            { type: 'büro', color: '#9b59b6', name: 'Büro' },
            { type: 'kühlung', color: '#f39c12', name: 'Spezial' },
            { type: 'gang', color: '#95a5a6', name: 'Gang' },
          ].map(item => (
            <div key={item.type} style={styles.legendItem}>
              <div style={{ ...styles.colorBox, backgroundColor: item.color }}></div>
              {item.name}
            </div>
          ))}
        </div>

        {selectedArea && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#ecf0f1', 
            borderRadius: '8px' 
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
              📍 {selectedArea.name}
            </h4>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <div><strong>Typ:</strong> {selectedArea.area_type}</div>
              <div><strong>Kapazität:</strong> {selectedArea.capacity}</div>
              <div><strong>Position:</strong> X: {selectedArea.x_position}, Y: {selectedArea.y_position}</div>
              <div><strong>Größe:</strong> {selectedArea.width} x {selectedArea.height}</div>
              <div><strong>Beschreibung:</strong> {selectedArea.description || 'Keine Beschreibung'}</div>
              
              {getAreaItems(selectedArea.id).length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <strong>📦 Artikel ({getAreaItems(selectedArea.id).length}):</strong>
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    {getAreaItems(selectedArea.id).slice(0, 5).map(item => (
                      <li key={item.id} style={{ fontSize: '12px' }}>
                        {item.name} ({item.quantity} {item.unit})
                      </li>
                    ))}
                    {getAreaItems(selectedArea.id).length > 5 && (
                      <li style={{ fontSize: '12px', fontStyle: 'italic' }}>
                        ... und {getAreaItems(selectedArea.id).length - 5} weitere
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debug Info */}
        {debug && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '8px',
            border: '1px solid #ffeaa7'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
              🔍 Debug Info
            </h4>
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <div><strong>Bereiche geladen:</strong> {areas.length}</div>
              <div><strong>Items geladen:</strong> {items.length}</div>
              <div><strong>Loading:</strong> {loading ? 'Ja' : 'Nein'}</div>
              <div><strong>Ausgewählter Bereich:</strong> {selectedArea?.name || 'Keiner'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
          🎮 Steuerung
        </div>
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
          <div>🖱️ <strong>Maus:</strong> Drehen und Zoomen</div>
          <div>👆 <strong>Klick:</strong> Bereich auswählen</div>
          <div>📱 <strong>Touch:</strong> Pinch to Zoom</div>
          <div>🔄 <strong>Rad:</strong> Zoom</div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseView3D; 