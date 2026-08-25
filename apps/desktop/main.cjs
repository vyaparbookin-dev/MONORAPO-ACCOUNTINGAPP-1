const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Auto-updater के लिए लॉग्स चालू करें
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// Auto-download को बंद रखें ताकि user की permission के बाद ही download हो
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;


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
    // Database और Handlers को लोड करें
    const { db } = await import('./src/main/database/db.js'); // db.js से केवल db इंस्टेंस इम्पोर्ट करें
    const { initializeSchema } = await import('./src/main/database/schema.js'); // schema.js से initializeSchema इम्पोर्ट करें
    const { setupHandlers } = await import('./src/main/ipc/handlers.js');
    const { startSyncService } = await import('./src/main/services/SyncService.js');
    
    initializeSchema(); // schema.js से initializeSchema को कॉल करें
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

// --- Auto Updater Events (User-friendly dialogs) ---
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available: ' + info.version);
  dialog.showMessageBox({
    type: 'info',
    title: '🆕 नया अपडेट उपलब्ध है!',
    message: `Red Accounting Book v${info.version} तैयार है!`,
    detail: 'नया version अभी download करें। Download होते ही App अपने-आप update हो जाएगी।',
    buttons: ['✅ अभी Download करें', '⏰ बाद में'],
    defaultId: 0,
    cancelId: 1,
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available. Current version is latest.');
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater: ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let msg = `Download Speed: ${Math.round(progressObj.bytesPerSecond / 1024)} KB/s`;
  msg += ` | Downloaded: ${Math.round(progressObj.percent)}%`;
  log.info(msg);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded! Version: ' + info.version);
  dialog.showMessageBox({
    type: 'info',
    title: '✅ अपडेट Download हो गया!',
    message: `v${info.version} install करने के लिए App restart होगी।`,
    detail: 'App अभी restart होगी और नया version install हो जाएगा। सभी data safe रहेगा।',
    buttons: ['🔄 अभी Restart करें', '⏰ बाद में (App बंद करने पर)'],
    defaultId: 0,
    cancelId: 1,
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});