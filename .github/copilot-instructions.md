<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Electron + React Desktop App Instructions

- This project uses Electron with a React frontend, scaffolded via Electron Forge (webpack template).
- Main UI navigation is via a sidebar menu with three items: 'Adapt Subject String', 'Read and Send Expenses', and 'Configuration'.
- Implement navigation using React state or a router (e.g., React Router) in the renderer process.
- For cross-platform builds (Windows/macOS, ARM/Intel), use Electron Forge's packaging commands.
- The main process is in `src/main.js`; the renderer (React) is in `src/renderer.js`.
- Integrate new React components for each menu item in the renderer, and update sidebar navigation accordingly.
- Use Node.js APIs in the main process for filesystem and OS integration.
- For inter-process communication, use Electron's IPC (see `ipcMain` and `ipcRenderer`).
- Store configuration in a JSON file or use Electron's app data directory.
- Example: To add a new sidebar item, update the sidebar component in `src/renderer.js` and create a corresponding React view/component.
- For packaging, see `package.json` scripts (e.g., `electron-forge make`).
- For development, use `npm start` to launch the app in debug mode.
- See README.md for more details and workflow examples.
