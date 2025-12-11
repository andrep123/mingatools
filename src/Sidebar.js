import React, { useEffect, useState } from 'react';

const Sidebar = ({ currentView, setView, refreshGoogleStatusSignal }) => {
  const [email, setEmail] = useState(null);
  const [appVersion, setAppVersion] = useState('');
  const [googleLoggedIn, setGoogleLoggedIn] = useState(null);

  // This function fetches the email and login status
  const fetchEmailAndStatus = async () => {
    if (window.electron && window.electron.ipcRenderer) {
      try {
        const result = await window.electron.ipcRenderer.invoke('get-google-user-email');
        setEmail(result);
        setGoogleLoggedIn(!!result);
      } catch (error) {
        setEmail(null);
        setGoogleLoggedIn(false);
      }
    }
  };

  useEffect(() => {
    fetchEmailAndStatus();
    // Fetch app version
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.invoke('get-app-version').then(setAppVersion);
    }
  }, []);

  // Listen for refresh signal
  useEffect(() => {
    if (refreshGoogleStatusSignal !== undefined) {
      fetchEmailAndStatus();
    }
    // eslint-disable-next-line
  }, [refreshGoogleStatusSignal]);

  return (
    <div style={{
      width: 260,
      background: '#222',
      color: '#fff',
  height: '90%',
      paddingTop: 32,
      boxShadow: '2px 0 8px #0002',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div>
        <h2 style={{ textAlign: 'center', marginBottom: 16, letterSpacing: 1 }}>Menu</h2>
        <div
          style={{
            textAlign: 'center',
            marginBottom: 24,
            fontSize: '0.97em',
            color: '#aaa',
            wordBreak: 'break-all',
            padding: '0 16px',
            maxHeight: 60,
            overflowY: 'auto',
            scrollbarWidth: 'thin', // for Firefox
          }}
        >
          {email ? (
            <>
              Signed in as:<br /><strong>{email}</strong>
            </>
          ) : (
            <>
              Not signed in to Google
            </>
          )}
        </div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>
            <button style={buttonStyle(currentView === 'expenses')}
              onClick={() => setView('expenses')}>Read and Send Expenses</button>
          </li>
          <li>
            <button style={buttonStyle(currentView === 'config')}
              onClick={() => setView('config')}>Configuration</button>
          </li>
        </ul>
      </div>
      <div style={{
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 12.5,
        color: '#aaa',
        lineHeight: 1.5
      }}>
        <div style={{ fontSize: 13 }}>Version: {appVersion}</div>
        <span>Author: André Pereira<br />
          <a href="mailto:chiribi@gmail.com" style={{ color: '#aaa', textDecoration: 'none' }}>chiribi@gmail.com</a>
        </span>
      </div>
    </div>
  );
};

const buttonStyle = (active) => ({
  width: '100%',
  padding: '12px 0',
  margin: '8px 0',
  background: active ? '#444' : '#333',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontWeight: active ? 'bold' : 'normal',
  fontSize: 16,
});

export default Sidebar;
