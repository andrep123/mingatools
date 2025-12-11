// Google OAuth2 helper for Electron main process
const { app, ipcMain, BrowserWindow } = require('electron');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const OAuth2Client = google.auth.OAuth2;
const googleOAuth = require('./google-oauth');

// Path to your downloaded OAuth2 credentials file
const CREDENTIALS_PATH = app.isPackaged 
  ? path.join(process.resourcesPath, 'google-credentials.json')
  : path.join(app.getAppPath(), 'google-credentials.json');
const TOKEN_PATH = path.join(app.getPath('userData'), 'google-token.json');

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
