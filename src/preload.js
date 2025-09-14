

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
	ipcRenderer: {
		invoke: (...args) => ipcRenderer.invoke(...args),
		// You can add more methods if needed
	}
});
