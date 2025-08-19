import React, { useEffect, useState } from 'react';

const Sidebar = ({ currentView, setView }) => {
  const [email, setEmail] = useState(null);

  useEffect(() => {
    async function fetchEmail() {
      if (window.electron && window.electron.ipcRenderer) {
        try {
          const result = await window.electron.ipcRenderer.invoke('get-google-user-email');
          setEmail(result);
        } catch (error) {
          setEmail(null);
        }
      }
    }
    fetchEmail();
  }, []);

  return (
    <div style={{ width: 260, background: '#222', color: '#fff', height: '100vh', paddingTop: 32, boxShadow: '2px 0 8px #0002' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 16, letterSpacing: 1 }}>Menu</h2>
      <div style={{ textAlign: 'center', marginBottom: 24, fontSize: '0.97em', color: '#aaa', wordBreak: 'break-all', padding: '0 16px' }}>
        {email ? (
          <>Signed in as:<br /><strong>{email}</strong></>
        ) : (
          <>Not signed in</>
        )}
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>
          <button style={buttonStyle(currentView === 'adapt')}
            onClick={() => setView('adapt')}>Adapt Subject String</button>
        </li>
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
