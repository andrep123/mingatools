# Electron + React Desktop App

This is a cross-platform desktop app scaffolded with Electron Forge (webpack template) and React frontend.

## Features
- Sidebar menu with three items: 'Adapt Subject String', 'Read and Send Expenses', 'Configuration'
- Basic navigation between views
- Ready for Windows/macOS (ARM/Intel) builds

## Getting Started
1. Install dependencies: `npm install`
2. Start in development: `npm start`
3. Build for production: `npm run make`

## Project Structure
- `src/main.js`: Electron main process
- `src/renderer.js`: React renderer process
- `.github/copilot-instructions.md`: AI agent instructions

## Customization
- Add React components for each menu item in `src/renderer.js`
- Use Electron IPC for main-renderer communication
- Store configuration in a JSON file or Electron app data directory

## Packaging
- Use Electron Forge for cross-platform builds
- See `package.json` for build scripts
