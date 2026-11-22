const { app, BrowserWindow, dialog, shell, ipcMain } = require('electron');
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
    show: true,
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
    win.loadFile(path.join(__dirname, 'dist/index.html')).catch((err) => {
      log.error('Failed to load dist/index.html:', err);
    });
  } else {
    win.loadURL(startUrl).catch((err) => {
      log.error('Failed to load startUrl:', err);
    });
  }

  win.webContents.on('did-fail-load', (e, code, desc) => {
    log.error('webContents did-fail-load:', code, desc);
  });

  // Open external links (WhatsApp, Web, mailto, etc.) in user's default OS browser/app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('whatsapp:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  return win;
}

app.whenReady().then(() => {
  // Create window immediately so user sees the app window without delay
  createWindow();

  // IPC handler to open external links via default OS handler
  ipcMain.handle('open-external', (_, url) => {
    if (url) {
      shell.openExternal(url).catch(err => log.error('openExternal error:', err));
    }
    return true;
  });

  // Database and Handlers loaded asynchronously in background
  (async () => {
    try {
      const { db } = await import('./src/main/database/db.js');
      const { setupHandlers } = await import('./src/main/ipc/handlers.js');
      const { startSyncService } = await import('./src/main/services/SyncService.js');
      
      setupHandlers();
      startSyncService();
      console.log('✅ Local Database & IPC Handlers Initialized');
    } catch (error) {
      console.error('⚠️ Notice on database initialization:', error);
    }
  })();

  // Check updates safely without throwing unhandled rejection offline
  try {
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        log.warn('Auto updater check skipped:', err?.message || err);
      });
    }
  } catch (err) {
    log.warn('Auto updater init note:', err?.message || err);
  }

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