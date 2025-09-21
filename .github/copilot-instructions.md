<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->


# Electron + React Desktop App Instructions

- This project uses Electron with a React frontend, scaffolded via Electron Forge (webpack template).
- The main UI is structured with a sidebar (`src/Sidebar.js`) and a main content area (`src/App.js`).
- Sidebar navigation includes:
	- 'Adapt Subject String': Utility for transforming subject strings from folder paths.
	- 'Read and Send Expenses': Browse, select, and send expense folders.
	- 'Configuration': Manage app settings, Google sign-in, and folder locations.
- Navigation is managed using React state in `src/App.js`.
- The main process logic is in `src/main.js` (window creation, IPC, config, Google OAuth, etc).
- The renderer entry is `src/renderer.js` (mounts the React app).
- To add a new sidebar item, update `src/Sidebar.js` and add a corresponding view/component in `src/App.js`.
- For inter-process communication, use Electron's IPC (`ipcMain` in main, `ipcRenderer` via contextBridge in preload).
- Configuration is stored in a JSON file in the Electron app data directory (see `main.js`).
- For cross-platform builds (Windows/macOS, ARM/Intel), use Electron Forge's packaging commands (see `package.json` scripts).
- For development, use `npm start` to launch the app in debug mode.
- See `README.md` for more details and workflow examples.
