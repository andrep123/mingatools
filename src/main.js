// --- Electron and core requires at the top ---

// Electron and core modules
const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const googleOAuth = require('./google-oauth');
const ElectronGoogleOAuth2 = require('electron-google-oauth2').default;

// Load Google OAuth2 credentials from google-credentials.json (excluded from git)
const CREDENTIALS_PATH = app.isPackaged 
  ? path.join(process.resourcesPath, 'google-credentials.json')
  : path.join(app.getAppPath(), 'google-credentials.json');
let GOOGLE_CLIENT_ID = '';
let GOOGLE_CLIENT_SECRET = '';
let CREDENTIALS_ERROR = null; // Track if there was an error loading credentials
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send'
];

try {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    CREDENTIALS_ERROR = 'File not found';
    console.error('[Google OAuth] Credentials file not found:', CREDENTIALS_PATH);
  } else {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    // For Google Cloud Console downloaded file, use credentials.installed
    if (credentials.installed) {
      GOOGLE_CLIENT_ID = credentials.installed.client_id;
      GOOGLE_CLIENT_SECRET = credentials.installed.client_secret;
    } else {
      // For custom format
      GOOGLE_CLIENT_ID = credentials.client_id;
      GOOGLE_CLIENT_SECRET = credentials.client_secret;
    }
    
    // Validate that we actually got credentials
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      CREDENTIALS_ERROR = 'Invalid credentials format';
      console.error('[Google OAuth] Invalid credentials format - missing client_id or client_secret');
    } else {
      console.log('[Google OAuth] Credentials loaded successfully');
    }
  }
} catch (err) {
  CREDENTIALS_ERROR = err.message;
  console.error('[Google OAuth] Failed to load credentials from google-credentials.json:', err.message);
}

// User-friendly Google sign-in IPC handler
ipcMain.handle('google-sign-in-user-friendly', async () => {
  try {
    // Check if credentials are available
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return { 
        success: false, 
        error: 'Google OAuth credentials not configured. Please add google-credentials.json file.' 
      };
    }

    const myOAuth = new ElectronGoogleOAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_SCOPES
    );
    const tokens = await myOAuth.openAuthWindowAndGetTokens();
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    return { success: true, tokens };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
// Archive a sent folder into 'TOC online' after email send
function archiveSentFolder(files, folder, event) {
  let refreshDespesasPath = null;
  console.log('[Archive] Starting folder move after email send...');
  try {
    if (files && files.length > 0) {
      const filePath = files[0];
      const parts = filePath.split(require('path').sep);
      const idx = parts.findIndex(p => p.toLowerCase() === 'despesas');
      console.log('[Archive] filePath:', filePath);
      console.log('[Archive] path parts:', parts);
      console.log('[Archive] index of "despesas":', idx);
      if (idx > 0) {
        const parentFolder = parts.slice(0, idx + 1).join(require('path').sep); // .../parent/despesas
        const sentFolderPath = require('path').join(parentFolder, folder); // .../parent/despesas/folder
        const tocOnlinePath = require('path').join(parentFolder, 'TOC online'); // INSIDE despesas
        let archivePath = require('path').join(tocOnlinePath, folder);

        // Ensure 'TOC online' exists
        if (!fs.existsSync(tocOnlinePath)) {
          fs.mkdirSync(tocOnlinePath, { recursive: true });
        }

        // If archivePath exists, append a timestamp suffix
        if (fs.existsSync(archivePath)) {
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          const timestamp = `${yyyy}_${mm}_${dd}`;
          archivePath = require('path').join(tocOnlinePath, `${folder}_${timestamp}`);
        }

        try {
          fs.renameSync(sentFolderPath, archivePath);
          // Optionally notify renderer of success
          if (event && event.sender) {
            event.sender.send('archive-success', `Folder archived as "${path.basename(archivePath)}"`);
          }
        } catch (err) {
          // Optionally notify renderer of error
          if (event && event.sender) {
            event.sender.send('archive-error', `Failed to archive folder: ${err.message}`);
          }
        }
        refreshDespesasPath = parentFolder;
      } else {
        console.error('[Archive] Could not find "despesas" in path:', filePath);
      }
    } else {
      console.error('[Archive] No files provided for archiving.');
    }
  } catch (archiveErr) {
    // Log but do not fail the email send if archive fails
    console.error('Failed to archive sent folder:', archiveErr);
  }
  if (refreshDespesasPath && event) {
    event.sender.send('refresh-despesas', refreshDespesasPath);
  }
}
// For Google sign-in code exchange
let googleSignInCodeResolver = null;








// Path to your downloaded OAuth2 credentials file
const TOKEN_PATH = path.join(app.getPath('userData'), 'google-token.json');

// Google OAuth2 helper for Electron main process
const OAuth2Client = google.auth.OAuth2;


// IPC: Open folder selection dialog
ipcMain.handle('select-folder', async (event) => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});






// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // Use process.cwd() for icon path in dev mode
    icon: path.resolve(process.cwd(), 'assets/app-icon.png'),
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Show warning dialog if credentials failed to load
  if (CREDENTIALS_ERROR) {
    mainWindow.webContents.once('did-finish-load', () => {
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Google Credentials Missing',
        message: 'Google OAuth credentials not found or invalid',
        detail: `Error: ${CREDENTIALS_ERROR}\n\n` +
                `Expected location: ${CREDENTIALS_PATH}\n\n` +
                'Google Sign-In features will not work until you add a valid google-credentials.json file to the application directory.\n\n' +
                'Please download your OAuth 2.0 credentials from Google Cloud Console and save them as "google-credentials.json" in the application folder.',
        buttons: ['OK']
      });
    });
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.whenReady().then(() => {
  // Set a minimal application menu (File and Edit)
  const minimalMenu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    }
  ]);
  Menu.setApplicationMenu(minimalMenu);
  // Set the dock icon on macOS (shows in dock during development)
  if (process.platform === 'darwin') {
    // Use process.cwd() so it works in dev mode with Electron Forge + webpack
    const iconPath = path.resolve(process.cwd(), 'assets/app-icon.png');
    if (fs.existsSync(iconPath)) {
      console.log('[App Icon] Setting dock icon:', iconPath);
      app.dock.setIcon(iconPath);
    } else {
      console.warn('[App Icon] Icon file not found:', iconPath);
    }
  }
  // Ensure config.json exists with defaults
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({
      searchFolder: '',
      senderEmail: '',
      receiverEmail: '',
      year: ''
    }, null, 2));
  }

  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


// Config file path (in user data dir)
const configPath = path.join(app.getPath('userData'), 'config.json');


// IPC: Get folders in configured search folder
ipcMain.handle('get-folders', async () => {
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {}
  const folderPath = config.searchFolder || os.homedir();
  try {
    const items = fs.readdirSync(folderPath, { withFileTypes: true });
    return items.filter(i => i.isDirectory()).map(i => i.name);
  } catch (e) {
    return [];
  }
});

// IPC: Get subfolders inside a given folder path
ipcMain.handle('get-subfolders', async (event, folderPath) => {
  try {
    const items = fs.readdirSync(folderPath, { withFileTypes: true });
    return items.filter(i => i.isDirectory()).map(i => i.name);
  } catch (e) {
    return [];
  }
});

// IPC: Get files inside a given folder path
ipcMain.handle('get-files', async (event, folderPath) => {
  try {
    const items = fs.readdirSync(folderPath, { withFileTypes: true });
    return items.filter(i => i.isFile()).map(i => i.name);
  } catch (e) {
    return [];
  }
});

// IPC: Send email with attachments to TOC online
ipcMain.handle('send-toc-email', async (event, { files, config, folder, CentroCustos }) => {
  try {
    console.log('[IPC] send-toc-email called', new Date().toISOString());
    // CentroCustos is now available from destructuring
    // Get OAuth2 client and token
    const oAuth2Client = googleOAuth.getOAuth2Client();
    const token = googleOAuth.getStoredToken();
    if (!token) {
      return { success: false, error: 'Not signed in with Google.' };
    }
    oAuth2Client.setCredentials(token);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    // Prepare email
    const boundary = 'boundary123';
    // Determine subject: folder before 'despesas' - folder
    let subject = folder;
    try {
      // Find the folder before 'despesas' in the full path of the first file
      if (files && files.length > 0) {
        const filePath = files[0];
        const parts = filePath.split(require('path').sep);
        // Find the index of 'despesas' (case-insensitive)
        const idx = parts.findIndex(p => p.toLowerCase() === 'despesas');
        if (idx > 0) {
          const beforeDespesas = parts[idx - 1];
          subject = `${beforeDespesas} - ${folder}`;
        }
      }
    } catch (e) {
      // fallback to just folder
      subject = folder;
    }
    // Encode subject as UTF-8 base64 per RFC 2047 (fix for accented chars)
    const utf8Subject = Buffer.from(subject, 'utf-8');
    const encodedSubject = `=?UTF-8?B?${utf8Subject.toString('base64')}?=`;
    const fileNames = files.map(f => require('path').basename(f));
    const messageParts = [
      `From: ${config.senderEmail}`,
      `To: ${config.receiverEmail}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      `Attached are the files from centro de custos: ${CentroCustos || ''}`,
      `Lote: ${folder}`,
      ...fileNames,
    ];
    // Attach files, skip missing and collect errors
    let missingFiles = [];
    let attachedCount = 0;
    console.log('[Email] Checking file existence before sending...');
    for (const filePath of files) {
      const normalizedPath = path.resolve(filePath);
      console.log(`[Email] Raw filePath: ${filePath.filename}`);
      console.log(`[Email] Normalized filePath: ${normalizedPath.filename}`);
      let fileContent;
      let finalPath = normalizedPath;
      try {
        const stats = fs.lstatSync(normalizedPath);
        console.log(`[Email] lstatSync type:`, stats.isSymbolicLink() ? 'symlink' : stats.isFile() ? 'file' : 'other');
        if (stats.isSymbolicLink()) {
          try {
            const linkTarget = fs.readlinkSync(normalizedPath);
            finalPath = path.resolve(path.dirname(normalizedPath), linkTarget);
            console.log(`[Email] Symlink target resolved to: ${finalPath}`);
          } catch (linkErr) {
            console.log(`[Email] Could not resolve symlink: ${normalizedPath}. Error: ${linkErr.message}`);
            missingFiles.push(filePath);
            continue;
          }
        }
        fileContent = fs.readFileSync(finalPath).toString('base64');
        console.log(`[Email] file content: `, fileContent);
      } catch (err) {
        console.log(`[Email] Could not read file or lstat: ${finalPath}. Error: ${err.message}`);
        missingFiles.push(filePath);
        continue;
      }
      const filename = path.basename(filePath);
      messageParts.push(
        `--${boundary}`,
        `Content-Type: application/octet-stream; name="${filename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${filename}"`,
        '',
        fileContent,
        ''
      );
      attachedCount++;
      console.log('[Email] attachedCount = ',attachedCount);
    }
    if (attachedCount === 0) {
      console.log('[Email] No files could be attached, aborting send.');
      return { success: false, error: `No files could be attached. Missing files: ${missingFiles.join(', ')}` };
    }
    messageParts.push(`--${boundary}--`);
    const raw = Buffer.from(messageParts.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    });

    // Archive after email send
    archiveSentFolder(files, folder, event);

    // If some files were missing, return a warning, not an error
    if (missingFiles.length > 0) {
      return {
        success: true,
        warning: `Email sent, but some files could not be attached: ${missingFiles.join(', ')}`
      };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});




// IPC handler: Sign in with Google
ipcMain.handle('google-sign-in', async (event) => {
  const oAuth2Client = getOAuth2Client();
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'openid',
      'email',
      'profile'
    ],
    prompt: 'consent',
  });

  shell.openExternal(authUrl); // Open system browser

  // Wait for the code from the renderer
  return new Promise((resolve) => {
    googleSignInCodeResolver = async (code) => {
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        resolve({ success: true, ...tokens });
      } catch (err) {
        resolve({ success: false, error: err.message || String(err) });
      }
      googleSignInCodeResolver = null;
    };
  });
});

// Top-level handler for google-sign-in-code
ipcMain.handle('google-sign-in-code', async (event, code) => {
  if (typeof googleSignInCodeResolver === 'function') {
    await googleSignInCodeResolver(code);
    return { success: true };
  } else {
    return { success: false, error: 'No pending Google sign-in request.' };
  }
});

function getOAuth2Client() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  return new OAuth2Client(client_id, client_secret, redirect_uris[0]);
}

// Helper: Get stored token
function getStoredToken() {
  if (fs.existsSync(TOKEN_PATH)) {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  }
  return null;
}

module.exports = { getOAuth2Client, getStoredToken, TOKEN_PATH };

// Export the getOAuth2Client function for use in other modules

// IPC: Save configuration
ipcMain.handle('save-config', async (event, config) => {
  console.log('[Config] Saving config to', configPath, 'with data:', config);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return true;
});

// IPC: Get configuration
ipcMain.handle('get-config', async () => {
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    console.log('[Config] Reading config from', configPath, 'data:', data);
    return JSON.parse(data);
  } catch (e) {
    console.warn('[Config] Failed to read config from', configPath, e);
    return {};
  }
});

// IPC: Send test email
ipcMain.handle('send-test-email', async (event, { to, subject, text }) => {
  try {
    const oAuth2Client = googleOAuth.getOAuth2Client();
    const token = googleOAuth.getStoredToken();
    if (!token) {
      return { success: false, error: 'Not signed in with Google.' };
    }
    oAuth2Client.setCredentials(token);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const messageParts = [
      `To: ${to}`,
      'Subject: ' + subject,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      text
    ];
    const raw = Buffer.from(messageParts.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// IPC: Get Google logged-in user's email
ipcMain.handle('get-google-user-email', async () => {
  const token = getStoredToken();
  console.log('[get-google-user-email] token:', token);
  if (!token) return null;

  // Try to get email from id_token (preferred)
  if (token.id_token) {
    try {
      const decoded = jwt.decode(token.id_token);
      console.log('[get-google-user-email] decoded id_token:', decoded);
      if (decoded && decoded.email) {
        // If email is present in id_token, return it immediately (no need to fetch userinfo)
        return decoded.email;
      }
    } catch (e) {
      console.log('[get-google-user-email] error decoding id_token:', e);
      return null;
    }
  }

  // Fallback: try to get email from access_token using Google API
  if (token.access_token) {
    try {
      const oAuth2Client = getOAuth2Client();
      oAuth2Client.setCredentials(token);
      // Use OpenID Connect endpoint for userinfo
      const fetch = require('node-fetch');
      const endpoint = 'https://openidconnect.googleapis.com/v1/userinfo';
      console.log('[get-google-user-email] Fetching userinfo from', endpoint);
      console.log('[get-google-user-email] Using access_token:', token.access_token ? token.access_token.slice(0,8) + '...' : 'none');
      const resp = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
        },
      });
      const data = await resp.json();
      console.log('[get-google-user-email] openid userinfo response:', data);
      return data.email || null;
    } catch (e) {
      console.log('[get-google-user-email] error fetching userinfo:', e);
      return null;
    }
  }

  return null;
});

// Get app version
const { version } = require('../package.json');
ipcMain.handle('get-app-version', () => version);

// IPC: Google sign-out
ipcMain.handle('google-sign-out', async () => {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});
