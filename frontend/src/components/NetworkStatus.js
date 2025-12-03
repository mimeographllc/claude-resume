import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function NetworkStatus() {
  const [status, setStatus] = useState('checking');
  const [details, setDetails] = useState(null);

  const checkConnection = async () => {
    setStatus('checking');
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      
      setStatus('connected');
      setDetails({
        apiUrl: API_BASE_URL,
        backendStatus: response.data.status,
        database: response.data.database
      });
    } catch (error) {
      setStatus('error');
      setDetails({
        apiUrl: API_BASE_URL,
        error: error.code === 'ERR_NETWORK' ? 'Cannot reach backend' : error.message,
        suggestion: error.code === 'ERR_NETWORK' 
          ? 'Make sure backend is running: cd backend && python main.py'
          : 'Check backend logs for errors'
      });
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return (
      <div style={styles.container}>
        <div style={styles.badge}>
          <span style={styles.dot('#FFB800')}>⏳</span>
          <span>Checking connection...</span>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={styles.container}>
        <div style={{...styles.badge, ...styles.error}}>
          <span style={styles.dot('#FF4757')}>❌</span>
          <span>Backend Offline</span>
        </div>
        {details && (
          <div style={styles.details}>
            <div><strong>API URL:</strong> {details.apiUrl}</div>
            <div><strong>Error:</strong> {details.error}</div>
            <div><strong>Fix:</strong> {details.suggestion}</div>
            <button onClick={checkConnection} style={styles.button}>
              Retry Connection
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{...styles.badge, ...styles.success}} title="Click to refresh">
        <span style={styles.dot('#00E5A0')}>✅</span>
        <span>Backend Connected</span>
      </div>
      {details && (
        <div style={styles.detailsSuccess}>
          <div><strong>API:</strong> {details.apiUrl}</div>
          <div><strong>Status:</strong> {details.backendStatus}</div>
          <div><strong>Database:</strong> {details.database}</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
    fontFamily: "'Outfit', sans-serif",
  },
  badge: {
    padding: '12px 20px',
    background: 'rgba(26, 34, 56, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#FFFFFF',
    fontSize: '0.85rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
    cursor: 'pointer',
  },
  success: {
    borderColor: 'rgba(0, 229, 160, 0.3)',
  },
  error: {
    borderColor: 'rgba(255, 71, 87, 0.3)',
    cursor: 'default',
  },
  dot: (color) => ({
    fontSize: '1rem',
  }),
  details: {
    marginTop: '10px',
    padding: '15px',
    background: 'rgba(255, 71, 87, 0.1)',
    border: '1px solid rgba(255, 71, 87, 0.3)',
    borderRadius: '12px',
    fontSize: '0.8rem',
    color: '#B8C5D6',
    maxWidth: '300px',
    lineHeight: 1.6,
  },
  detailsSuccess: {
    marginTop: '10px',
    padding: '12px',
    background: 'rgba(0, 229, 160, 0.05)',
    border: '1px solid rgba(0, 229, 160, 0.2)',
    borderRadius: '12px',
    fontSize: '0.75rem',
    color: '#B8C5D6',
    maxWidth: '300px',
    lineHeight: 1.6,
  },
  button: {
    marginTop: '10px',
    padding: '8px 16px',
    background: '#FF4757',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
  }
};

export default NetworkStatus;