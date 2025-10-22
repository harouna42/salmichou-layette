const { contextBridge, ipcRenderer } = require('electron');

// Exposition sécurisée des APIs Electron
contextBridge.exposeInMainWorld('electronAPI', {
  // Sauvegarde de fichier
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  
  // Ouverture de fichier
  openFile: () => ipcRenderer.invoke('open-file'),
  
  // Informations sur la plateforme
  platform: process.platform,
  
  // Version de l'application
  version: process.env.npm_package_version || '1.0.0'
});