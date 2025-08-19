import React, { useState } from 'react';
import Sidebar from './Sidebar';


// Adapt Subject String Component

const AdaptSubjectString = () => {
  const [input, setInput] = React.useState('');
  const [output, setOutput] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    // Example transformation: reverse string (replace with your logic)
    //example of string input: 
    // '/Users/andrepereira/Library/CloudStorage/GoogleDrive-chiribi@gmail.com/.shortcut-targets-by-id/17HZxg5o68poSdDrn1dL1jAapyr3isVx2/Cooperativa Integral Minga CRL/Tesouraria/Tesouraria 2023 - 2025/_P_Alcyontec - 191/despesas/2025-05 lote 1127,95'
    if (!input || input.trim() === '') {
      setOutput('');
      return;
    }
    // Accept both Unix and Windows paths
    const normalized = input.replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length < 3) {
      setOutput('Invalid input format. Please provide a valid path.\nExample: /.../project/lote or C:/.../project/lote');
      return;
    }
    const projecto = parts[parts.length - 3];
    const lote = parts[parts.length - 1].replace("'","");
    setOutput(projecto + ' - ' + lote);
  }, [input]);



  React.useEffect(() => {
    if (output) {
      navigator.clipboard.writeText(output)
        .then(() => setCopied(true))
        .catch(() => setCopied(false));
    }
  }, [output]);

  // Hide notification after 3 seconds
  React.useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <div style={{ padding: 32, position: 'relative' }}>
      <h1>Adapt Subject String</h1>
      <textarea
        style={{ width: '100%', height: 80 }}
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Paste your string here..."
      />
      <br /><br />
      <textarea
        style={{ width: '100%', height: 80 }}
        value={output}
        readOnly
        placeholder="Transformed string..."
      />
      <br /><br />
      <button disabled>Copy Result</button>
      {copied && (
        <div style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#222',
          color: '#fff',
          textAlign: 'center',
          padding: '12px 0',
          fontSize: 16,
          zIndex: 9999,
        }}>
          Copied to clipboard!
        </div>
      )}
    </div>
  );
};


// Read and Send Expenses Component

const ReadAndSendExpenses = ({ topNotification, setTopNotification }) => {
  // Track mouse Y position for popup
  const [popupY, setPopupY] = React.useState(null);
  const [folders, setFolders] = React.useState([]);
  const [loadingFolders, setLoadingFolders] = React.useState(true);
  const [subfolders, setSubfolders] = React.useState(null);
  const [currentFolder, setCurrentFolder] = React.useState(null);
  const [hovered, setHovered] = React.useState(null);
  const [hoverFiles, setHoverFiles] = React.useState([]);
  // Store the selected folder as CentroCustos
  const [CentroCustos, setCentroCustos] = React.useState(null);
  // Progress bar state
  const [sending, setSending] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const currentFolderRef = React.useRef(null);
  React.useEffect(() => { currentFolderRef.current = currentFolder; }, [currentFolder]);

  React.useEffect(() => {
    if (!window.electron?.ipcRenderer) return;
    const handler = async (_event, despesasPath) => {
      // Always refresh main folder list
      window.electron?.ipcRenderer.invoke('get-folders').then(setFolders);
      // If in a subfolder view, refresh subfolders as well
      if (currentFolderRef.current) {
        const config = await window.electron?.ipcRenderer.invoke('get-config');
        const base = config.searchFolder || '';
        const fullPath = base ? `${base}/${currentFolderRef.current}/despesas` : `${currentFolderRef.current}/despesas`;
        let subs = await window.electron?.ipcRenderer.invoke('get-subfolders', fullPath);
        subs = subs.filter(sub => sub.toLowerCase() !== 'toc online');
        setSubfolders(subs);
      }
    };
    // Use addEventListener/removeEventListener if available, else fallback to custom 'on'/'off'
    const ipc = window.electron.ipcRenderer;
    if (typeof ipc.addEventListener === 'function') {
      ipc.addEventListener('refresh-despesas', handler);
      return () => ipc.removeEventListener('refresh-despesas', handler);
    } else if (typeof ipc.on === 'function' && typeof ipc.removeListener === 'function') {
      ipc.on('refresh-despesas', handler);
      return () => ipc.removeListener('refresh-despesas', handler);
    }
  }, []);

  React.useEffect(() => {
    const loadFilteredFolders = async () => {
      setLoadingFolders(true);
      const allFolders = await window.electron?.ipcRenderer.invoke('get-folders');
      const config = await window.electron?.ipcRenderer.invoke('get-config');
      const base = config.searchFolder || '';
      const filtered = [];
      for (const folder of allFolders) {
        // Build path to despesas subfolder
        const despesasPath = base ? `${base}/${folder}/despesas` : `${folder}/despesas`;
        // Get subfolders inside despesas
        let subs = await window.electron?.ipcRenderer.invoke('get-subfolders', despesasPath);
        if (Array.isArray(subs)) {
          subs = subs.filter(sub => sub.toLowerCase() !== 'toc online');
          if (subs.length > 0) {
            filtered.push(folder);
          }
        }
      }
      setFolders(filtered);
      setLoadingFolders(false);
    };
    loadFilteredFolders();
  }, []);

  const handleAction = async (folder) => {
    setCurrentFolder(folder);
    setCentroCustos(folder); // Store selected folder as CentroCustos
    // Get config to build full path
    const config = await window.electron?.ipcRenderer.invoke('get-config');
    const base = config.searchFolder || '';
    // Always drill into the 'despesas' subfolder inside the selected folder
    const fullPath = base ? `${base}/${folder}/despesas` : `${folder}/despesas`;
    // Ask main process for subfolders inside 'despesas'
    let subs = await window.electron?.ipcRenderer.invoke('get-subfolders', fullPath);
    // Filter out any folder named 'Toc online' (case-insensitive)
    subs = subs.filter(sub => sub.toLowerCase() !== 'toc online');
    setSubfolders(subs);
  };

  const handleBack = () => {
    setSubfolders(null);
    setCurrentFolder(null);
  };

  return (
    <div style={{ padding: 32, position: 'relative' }}>
      <h1>Read and Send Expenses</h1>
      {sending && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ width: 300, height: 18, background: '#eee', borderRadius: 8, overflow: 'hidden', margin: '0 auto 12px auto', boxShadow: '0 1px 4px #ccc' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#2196f3', transition: 'width 0.3s' }} />
          </div>
          <div style={{ textAlign: 'center', color: '#2196f3', fontWeight: 500 }}>Sending email... {progress}%</div>
        </div>
      )}
      {!subfolders ? (
        loadingFolders ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '48px 0' }}>
            <div className="spinner" style={{
              width: 48,
              height: 48,
              border: '6px solid #eee',
              borderTop: '6px solid #2196f3',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ marginTop: 16, color: '#2196f3', fontWeight: 500 }}>Loading folders...</div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <ul style={{ padding: 0, margin: 0 }}>
            {folders.map(folder => (
              <li
                key={folder}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  marginBottom: 14,
                  background: '#f8fafd',
                  borderRadius: 8,
                  boxShadow: '0 1px 4px #0001',
                  fontSize: 18,
                  fontWeight: 500,
                  listStyle: 'none',
                  minHeight: 48,
                  gap: 16
                }}
              >
                <span style={{ wordBreak: 'break-all', flex: 1 }}>{folder}</span>
                <button
                  onClick={() => handleAction(folder)}
                  style={{
                    padding: '8px 20px',
                    fontSize: 16,
                    background: '#2196f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    boxShadow: '0 1px 4px #2196f355',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#1769aa'}
                  onMouseOut={e => e.currentTarget.style.background = '#2196f3'}
                >Do Action</button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div style={{ background: '#f8fafd', borderRadius: 12, boxShadow: '0 1px 4px #0001', padding: 32, marginTop: 12 }}>
          <button onClick={handleBack} style={{ marginBottom: 24, padding: '8px 20px', fontSize: 16, background: '#2196f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, boxShadow: '0 1px 4px #2196f355', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = '#1769aa'}
            onMouseOut={e => e.currentTarget.style.background = '#2196f3'}
          >Back</button>
          <h2 style={{ marginBottom: 24 }}>Despesas Folder: {currentFolder}/despesas</h2>
          <ul style={{ position: 'relative', padding: 0, margin: 0 }}>
            {subfolders.map(sub => (
              <li
                key={sub}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  marginBottom: 14,
                  background: '#fff',
                  borderRadius: 8,
                  boxShadow: '0 1px 4px #0001',
                  fontSize: 17,
                  fontWeight: 500,
                  listStyle: 'none',
                  minHeight: 44,
                  gap: 16,
                  position: 'relative'
                }}
                onMouseEnter={async (e) => {
                  setHovered(sub);
                  setPopupY(e && e.clientY ? e.clientY : null);
                  const config = await window.electron?.ipcRenderer.invoke('get-config');
                  const base = config.searchFolder || '';
                  const fullPath = base ? `${base}/${currentFolder}/despesas/${sub}` : `${currentFolder}/despesas/${sub}`;
                  const files = await window.electron?.ipcRenderer.invoke('get-files', fullPath);
                  setHoverFiles(files);
                }}
                onMouseLeave={() => {
                  setHovered(null);
                  setHoverFiles([]);
                  setPopupY(null);
                }}
              >
                <span style={{ wordBreak: 'break-all', flex: 1 }}>{sub}</span>
                <button
                  onClick={async () => {
                    setSending(true);
                    setProgress(10);
                    const config = await window.electron?.ipcRenderer.invoke('get-config');
                    setProgress(20);
                    const base = config.searchFolder || '';
                    const folderPath = base ? `${base}/${currentFolder}/despesas/${sub}` : `${currentFolder}/despesas/${sub}`;
                    setProgress(30);
                    const files = await window.electron?.ipcRenderer.invoke('get-files', folderPath);
                    setProgress(50);
                    const filePaths = files.map(f => `${folderPath}/${f}`);
                    setProgress(70);
                    await window.electron?.ipcRenderer.invoke('send-toc-email', {
                      files: filePaths,
                      config,
                      folder: sub,
                      CentroCustos: CentroCustos
                    });
                    const result = await window.electron?.ipcRenderer.invoke('send-toc-email', {
                      files: filePaths,
                      config,
                      folder: sub,
                      CentroCustos: CentroCustos
                    });
                    setProgress(100);
                    const despesasPath = base ? `${base}/${currentFolder}/despesas` : `${currentFolder}/despesas`;
                    let subs = await window.electron?.ipcRenderer.invoke('get-subfolders', despesasPath);
                    subs = subs.filter(s => s.toLowerCase() !== 'toc online');
                    setSubfolders(subs);
                    if (result && result.success) {
                      setTopNotification({ type: 'email', message: `Email sent`, subject: `${CentroCustos} - ${sub}`, color: 'blue' });
                    } else {
                      setTopNotification({ type: 'email-error', message: `Error sending email: ${result?.error || 'Unknown error'}`, color: 'red' });
                    }
                    setTimeout(() => {
                      setSending(false);
                      setProgress(0);
                    }, 800);
                  }}
                  style={{ padding: '8px 20px', fontSize: 16, background: '#2196f3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, boxShadow: '0 1px 4px #2196f355', transition: 'background 0.2s', marginLeft: 8 }}
                  onMouseOver={e => e.currentTarget.style.background = '#1769aa'}
                  onMouseOut={e => e.currentTarget.style.background = '#2196f3'}
                >Send to TOC online</button>
                {hovered === sub && popupY !== null && (
                  <div style={{
                    position: 'fixed',
                    top: popupY,
                    left: '50%',
                    transform: 'translate(-50%, 0)',
                    background: '#fff',
                    border: '1px solid #ccc',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    padding: '16px 32px',
                    zIndex: 2000,
                    minWidth: 240,
                    maxWidth: '80vw',
                    maxHeight: '60vh',
                    overflowY: 'auto',
                  }}>
                    <strong>Files:</strong>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {hoverFiles.length > 0 ? (
                        hoverFiles.map(f => <li key={f}>{f}</li>)
                      ) : (
                        <li style={{ color: '#888' }}>No files found</li>
                      )}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {subfolders.length === 0 && <p>No subfolders found.</p>}
        </div>
      )}
      {folders.length === 0 && !subfolders && <p>No folders found.</p>}
    </div>
  );
};


// Configuration Component
const Configuration = () => {
  const [searchFolder, setSearchFolder] = React.useState('');
  const [senderEmail, setSenderEmail] = React.useState('');
  const [receiverEmail, setReceiverEmail] = React.useState('');
  const [year, setYear] = React.useState('');
  const [googleSignedIn, setGoogleSignedIn] = React.useState(false);
  const [googleError, setGoogleError] = React.useState('');
  const [showCodeModal, setShowCodeModal] = React.useState(false);
  const [codeInput, setCodeInput] = React.useState('');
  const [awaitingGoogleCode, setAwaitingGoogleCode] = React.useState(false);

  // Debug: log when showCodeModal changes
  React.useEffect(() => {
    console.log('showCodeModal changed:', showCodeModal);
  }, [showCodeModal]);

  React.useEffect(() => {
    window.electron?.ipcRenderer.invoke('get-config').then(cfg => {
      setSearchFolder(cfg.searchFolder || '');
      setSenderEmail(cfg.senderEmail || '');
      setReceiverEmail(cfg.receiverEmail || '');
      setYear(cfg.year || '');
    });
    // Check if Google token exists (simple check)
    window.electron?.ipcRenderer.invoke('get-google-user-email').then(email => {
      setGoogleSignedIn(!!email);
    }).catch(() => setGoogleSignedIn(false));
  }, []);

  const handleSave = () => {
    window.electron?.ipcRenderer.invoke('save-config', {
      searchFolder,
      senderEmail,
      receiverEmail,
      year,
    });
    alert('Configuration saved!');
  };

  const handleGoogleSignIn = async () => {
    console.log('handleGoogleSignIn called');
    setGoogleError('');
    setShowCodeModal(true);
    setAwaitingGoogleCode(true);
    console.log('setShowCodeModal(true) called');
    try {
      await window.electron?.ipcRenderer.invoke('google-sign-in');
      console.log('google-sign-in IPC completed');
    } catch (err) {
      console.error('Error in google-sign-in IPC:', err);
    }
  };

  const handleCodeSubmit = async () => {
    if (codeInput) {
      const res = await window.electron?.ipcRenderer.invoke('google-sign-in-code', codeInput);
      console.log('google-sign-in-code response:', res);
      setShowCodeModal(false);
      setCodeInput('');
      setAwaitingGoogleCode(false);
      if (res && res.success) {
        setGoogleSignedIn(true);
        alert('Google sign-in successful!');
      } else {
        setGoogleSignedIn(false);
        setGoogleError(res && res.error ? res.error : 'Sign-in failed');
      }
    } else {
      setGoogleError('No code entered.');
    }
  };

  return (
    <>
      {/* Notification always rendered at top-level, above everything */}
      {showCodeModal && (
        <div style={{
          position: 'fixed', top: 16, right: 16, background: '#2196f3', color: '#fff', padding: '10px 20px', borderRadius: 6, zIndex: 20000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontWeight: 'bold', fontSize: 16
        }}>
          Google Auth Code Modal is visible
        </div>
      )}
      <div style={{ padding: 32 }}>
        <h1>Configuration</h1>
        <div style={{ marginBottom: 16 }}>
          <label>Search Folder:</label><br />
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={searchFolder} onChange={e => setSearchFolder(e.target.value)} style={{ flex: 1 }} />
            <button
              type="button"
              onClick={async () => {
                const folder = await window.electron?.ipcRenderer.invoke('select-folder');
                if (folder) setSearchFolder(folder);
              }}
            >Choose...</button>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Sender Email:</label><br />
          <input value={senderEmail} onChange={e => setSenderEmail(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Receiver Email:</label><br />
          <input value={receiverEmail} onChange={e => setReceiverEmail(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Year:</label><br />
          <input value={year} onChange={e => setYear(e.target.value)} style={{ width: '100%' }} />
        </div>
        <button onClick={handleSave}>Save Configuration</button>
        <button
          style={{ marginLeft: 16, background: '#673ab7', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4 }}
          onClick={async () => {
            try {
              const res = await window.electron?.ipcRenderer.invoke('send-test-email', {
                to: 'chiribi@gmail.com',
                subject: 'test',
                text: 'This is a test email from the Electron app.'
              });
              if (res && res.success) {
                alert('Test email sent!');
              } else {
                alert('Failed to send test email: ' + (res && res.error ? res.error : 'Unknown error'));
              }
            } catch (e) {
              alert('Error sending test email: ' + e.message);
            }
          }}
        >Send Test Email</button>
        <div style={{ marginTop: 32 }}>
          <button
            onClick={handleGoogleSignIn}
            style={{ background: googleSignedIn ? '#4caf50' : '#2196f3', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4 }}
          >{googleSignedIn ? 'Signed in with Google' : 'Sign in with Google'}</button>
          {awaitingGoogleCode && !showCodeModal && !googleSignedIn && (
            <button
              onClick={() => setShowCodeModal(true)}
              style={{ marginLeft: 12, background: '#ff9800', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4 }}
            >Paste Google Auth Code</button>
          )}
          {googleError && <div style={{ color: 'red', marginTop: 8 }}>{googleError}</div>}
        </div>
        {showCodeModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320 }}>
              <h3>Enter Google Auth Code</h3>
              <p style={{ fontSize: 15, marginBottom: 12, color: '#333' }}>
                1. Complete the sign-in in your browser.<br />
                2. When you see an error page, copy the <b>code</b> from the browser's address bar (look for <code>?code=...</code> in the URL).<br />
                3. Paste the code below and click Submit.
              </p>
              <input
                type="text"
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                style={{ width: '100%', marginBottom: 16 }}
                placeholder="Paste code here"
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCodeSubmit} style={{ background: '#2196f3', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4 }}>Submit</button>
                <button onClick={() => { setShowCodeModal(false); setCodeInput(''); }} style={{ padding: '8px 16px', border: 'none', borderRadius: 4 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const App = () => {
  const [view, setView] = useState('adapt');

  // Top notification state for all pages
  const [topNotification, setTopNotification] = useState(null);

  let content;
  if (view === 'adapt') content = <AdaptSubjectString />;
  else if (view === 'expenses') content = <ReadAndSendExpenses topNotification={topNotification} setTopNotification={setTopNotification} />;
  else if (view === 'config') content = <Configuration />;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar currentView={view} setView={setView} />
      <div style={{ flex: 1, background: '#f5f5f5', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
        {/* Top notification area */}
        {topNotification && (
          <div style={{
            position: 'sticky',
            top: 0,
            left: 0,
            right: 0,
            background: topNotification.color === 'red' ? '#d32f2f' : '#2196f3',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: 8,
            margin: '24px 0 0 0',
            zIndex: 3000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontWeight: 'bold',
            fontSize: 17,
            maxWidth: 600,
            textAlign: 'center',
          }}>
            {topNotification.type === 'email' ? (
              <span>Email sent: <b>{topNotification.subject}</b></span>
            ) : topNotification.type === 'email-error' ? (
              <span>{topNotification.message}</span>
            ) : (
              <span>{topNotification.message}</span>
            )}
          </div>
        )}
        <div style={{ width: '100%', maxWidth: 1200, margin: '40px 0', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 40, minHeight: 600 }}>
          {content}
        </div>
      </div>
    </div>
  );
};

export default App;
