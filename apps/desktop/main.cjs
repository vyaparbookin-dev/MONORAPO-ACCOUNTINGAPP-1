const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Auto-updater के लिए लॉग्स चालू करें
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Red Accounting Book",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Securely expose APIs
      nodeIntegration: false, // Keep false for security
      contextIsolation: true, // Keep true for security
    },
    icon: path.join(__dirname, 'icon.ico')
  });

  // Development: Load from Vite Dev Server
  // Production: Load from built files (dist)
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  
  // If in production (built), load the index.html file
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  } else {
    win.loadURL(startUrl);
  }
}

app.whenReady().then(async () => {
  try {
    // Database और Handlers को लोड करें (Dynamic Import क्योंकि ये ESM फाइल्स हैं)
    const { initDatabase } = await import('./src/main/database/schema.js');
    const { setupHandlers } = await import('./src/main/ipc/handlers.js');
    const { startSyncService } = await import('./src/main/services/SyncService.js');
    
    initDatabase();
    setupHandlers();
    startSyncService(); // सिंक सर्विस स्टार्ट करें
    console.log('✅ Local Database & IPC Handlers Initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    // अगर SQLite में कोई एरर आये तो यूज़र को अलर्ट दिखेगा
    dialog.showErrorBox('Database Error', 'Local DB fail ho gaya hai. Error: ' + error.message);
  }

  createWindow();

  // जैसे ही ऐप चालू हो, बैकग्राउंड में अपडेट चेक करें
  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- Auto Updater Events (लॉगिंग के लिए) ---
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available.');
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.');
});

autoUpdater.on('error', (err) => {
  log.info('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  log.info("Download speed: " + progressObj.bytesPerSecond + " - Downloaded " + progressObj.percent + "%");
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded! Restarting the app...');
  autoUpdater.quitAndInstall();  
});