# mingatools
Ferramentas de administração para a Minga

## Electron + React Desktop App

This is a cross-platform desktop app scaffolded with Electron Forge (webpack template) and React frontend.

## Features
- Sidebar menu with three items: 'Adapt Subject String', 'Read and Send Expenses', 'Configuration'
- User-friendly Google OAuth sign-in with email sending capabilities
- Basic navigation between views
- Ready for Windows/macOS (ARM/Intel) builds

## Getting Started
1. Install dependencies: `npm install`
2. Add your `google-credentials.json` file to the project root (excluded from git)
3. Start in development: `npm start`
4. Build for production: `npm run make`

## Project Structure
- `src/main.js`: Electron main process
- `src/renderer.js`: React renderer process
- `src/App.js`: Main React component with views
- `.github/copilot-instructions.md`: AI agent instructions

## Google OAuth Setup
- Place your `google-credentials.json` in the project root
- The file is excluded from git for security
- Required scopes: userinfo.email, userinfo.profile, mail.google.com, gmail.send

## Customization
- Add React components for each menu item in `src/App.js`
- Use Electron IPC for main-renderer communication
- Store configuration in a JSON file or Electron app data directory

## Packaging
- Use Electron Forge for cross-platform builds
- See `package.json` for build scripts
- Remember to manually copy `google-credentials.json` to deployments
