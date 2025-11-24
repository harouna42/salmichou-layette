const { app, protocol, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs'); // Assurez-vous d'importer fs

let mainWindow;

function createWindow() {
  // Création de la fenêtre principale
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Optionnel
    title: 'SalmichouLayette',
    show: false // Cache la fenêtre jusqu'au chargement
  });

  // Charge l'application
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    //: `file://${path.join(__dirname, '../dist/index.html')}`;
    : 'app://index.html'; 
  mainWindow.loadURL(startUrl);

  // Affiche la fenêtre une fois prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Ouvre les DevTools en développement
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Gère la fermeture de la fenêtre
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Empêche les nouvelles fenêtres
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
}

// ⚠️ NOUVEAU CODE : Enregistrement du protocole
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    // Permet au protocole 'app://' d'accéder aux fichiers locaux
    // et de contourner les problèmes de sécurité.
    privileges: { standard: true, secure: true }
  }
]);

app.whenReady().then(() => {

  protocol.handle('app', async (request) => {
    // Construire le chemin
    const requestedPath = (new URL(request.url)).pathname.substring(1) || 'index.html';

    // 🛑 NOUVELLE CONSTRUCTION DE CHEMIN : 
    // process.resourcesPath pointe vers .../Contents/Resources
    // L'archive est donc dans .../Contents/Resources/app.asar
    
    // On doit cibler l'archive .asar elle-même et y lire le fichier.
    //const appAsarPath = path.join(process.resourcesPath, 'app.asar');
    
    // ⚠️ On joint le chemin du fichier demandé (index.html) à l'intérieur de l'archive
    //const filePath = path.join(appAsarPath, requestedPath); 
    // Le chemin complet est maintenant: .../Contents/Resources/app/index.html
    const contentsDir = path.join(process.resourcesPath, '..');
    const filePath = path.join(contentsDir, requestedPath); // ⬅️ CORRECTION DÉFINITIVE

    try {
        // Tenter la lecture asynchrone
        const fileContent = await fs.promises.readFile(filePath);
        
        // 2. Définition du type MIME
        let mimeType = 'text/plain';
        if (requestedPath.endsWith('.html')) mimeType = 'text/html';
        else if (requestedPath.endsWith('.js')) mimeType = 'text/javascript';
        else if (requestedPath.endsWith('.css')) mimeType = 'text/css';
        // Ajoutez d'autres types MIME (png, jpg, json, etc.)

        return new Response(fileContent, { headers: { 'Content-Type': mimeType } });

    } catch (error) {
        // ...
        // Le code affiche ce message si la lecture échoue
        console.error(`Erreur critique de lecture: ${filePath}`, error.message);
        return new Response(`Resource Not Found: ${filePath}`, { status: 404 }); 

    }
  });
  // Appelez createWindow après l'enregistrement
  createWindow(); 
});

// Preload script pour la communication sécurisée
//require('./preload.cjs');

// Gestionnaires d'événements de l'application
//app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Gestionnaire pour la sauvegarde de fichiers
ipcMain.handle('save-file', async (event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `salmichou-backup-${new Date().toISOString().split('T')[0]}.json`,
    filters: [
      { name: 'Fichiers JSON', extensions: ['json'] }
    ]
  });
  
  if (!result.canceled) {
    const fs = require('fs');
    fs.writeFileSync(result.filePath, data);
    return { success: true, path: result.filePath };
  }
  
  return { success: false };
});

// Gestionnaire pour l'ouverture de fichiers
ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [
      { name: 'Fichiers JSON', extensions: ['json'] }
    ],
    properties: ['openFile']
  });
  
  if (!result.canceled) {
    const fs = require('fs');
    const data = fs.readFileSync(result.filePaths[0], 'utf8');
    return { success: true, data };
  }
  
  return { success: false };
});