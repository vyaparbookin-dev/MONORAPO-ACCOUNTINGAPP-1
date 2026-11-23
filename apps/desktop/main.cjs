const { app, BrowserWindow, dialog, shell, ipcMain, Menu } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Auto-updater के लिए लॉग्स चालू करें
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// Auto-download को बंद रखें ताकि user की permission के बाद ही download हो
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function showDiagnosticError(win, errorDetails) {
  const errHtml = `
    <!DOCTYPE html>
    <html lang="hi">
    <head>
      <meta charset="UTF-8">
      <title>VyaparBook Desktop - प्रारंभ समस्या</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center; }
        .box { max-width: 650px; margin: 40px auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
        h1 { color: #f43f5e; font-size: 22px; margin-bottom: 12px; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
        .code { background: #0f172a; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 12px; color: #fbbf24; text-align: left; margin: 16px 0; overflow-x: auto; word-break: break-all; }
        .btn-group { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }
        button { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; transition: background 0.2s; }
        button:hover { background: #4338ca; }
        button.sec { background: #334155; }
        button.sec:hover { background: #475569; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>⚠️ VyaparBook डेस्कटॉप लोड होने में समस्या</h1>
        <p>डेस्कटॉप ऐप की फ़ाइल लोड नहीं हो पाई। आप नीचे दिए गए बटन से पुनः लोड कर सकते हैं या डेवलपर कंसोल खोलकर जांच सकते हैं:</p>
        <div class="code">${String(errorDetails || 'Unknown Loading Error')}</div>
        <div class="btn-group">
          <button onclick="window.location.reload()">🔄 पुनः लोड करें (Reload)</button>
          <button class="sec" onclick="window.electronDiagnostic && window.electronDiagnostic.openConsole()">🛠️ कंसोल खोलें (F12)</button>
        </div>
      </div>
    </body>
    </html>
  `;
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errHtml)}`);
}

function createWindow() {
  const iconPath = path.join(__dirname, 'icon.ico');
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Red Accounting Book",
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true // हमेशा DevTools उपलब्ध रखें
    },
    icon: fs.existsSync(iconPath) ? iconPath : undefined
  });

  // Always enable keyboard shortcuts: F12 / Ctrl+Shift+I for DevTools, F5 / Ctrl+R for Reload
  win.webContents.on('before-input-event', (event, input) => {
    // F12 or Ctrl+Shift+I to toggle DevTools console
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
    // F5 or Ctrl+R to reload
    if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
      win.webContents.reload();
      event.preventDefault();
    }
  });

  // Right-click Context Menu with Console / Inspect Element
  win.webContents.on('context-menu', () => {
    const menu = Menu.buildFromTemplate([
      { label: '🔄 पुनः लोड करें (Reload)', accelerator: 'CmdOrCtrl+R', click: () => win.webContents.reload() },
      { type: 'separator' },
      { label: '🛠️ कंसोल खोलें (Inspect / DevTools - F12)', accelerator: 'F12', click: () => win.webContents.toggleDevTools() }
    ]);
    menu.popup();
  });

  // IPC handler to open DevTools from in-page diagnostic buttons
  ipcMain.handle('open-devtools', () => {
    win.webContents.openDevTools();
    return true;
  });

  // Determine local dist/index.html path
  const distIndexPath = path.join(__dirname, 'dist', 'index.html');
  const distExists = fs.existsSync(distIndexPath);
  const customStartUrl = process.env.ELECTRON_START_URL;

  const loadLocalDist = () => {
    try {
      // Windows-safe forward-slash file URL via url.pathToFileURL
      const fileUrl = url.pathToFileURL(distIndexPath).href;
      log.info('Loading local file URL:', fileUrl);
      win.loadURL(fileUrl).catch((err) => {
        log.error('Failed to load local file URL:', err);
        // Secondary fallback using loadFile
        win.loadFile('dist/index.html').catch((err2) => {
          log.error('loadFile fallback failed:', err2);
          showDiagnosticError(win, err2?.message || err?.message);
        });
      });
    } catch (err) {
      log.error('pathToFileURL error, falling back to loadFile:', err);
      win.loadFile('dist/index.html').catch((err2) => {
        showDiagnosticError(win, err2?.message || err?.message);
      });
    }
  };

  // Loading Strategy:
  // 1. If in production (app.isPackaged) OR no custom dev URL is provided, load local dist/index.html
  // 2. If custom dev URL is provided (e.g. ELECTRON_START_URL), try it, and if it fails, fallback to local dist/index.html
  if (app.isPackaged || (!customStartUrl && distExists)) {
    loadLocalDist();
  } else if (customStartUrl) {
    win.loadURL(customStartUrl).catch((err) => {
      log.warn(`Dev server at ${customStartUrl} failed, falling back to local files:`, err?.message);
      if (distExists) {
        loadLocalDist();
      } else {
        showDiagnosticError(win, err?.message);
      }
    });
  } else {
    if (distExists) {
      loadLocalDist();
    } else {
      // Try local dev port 5173
      win.loadURL('http://localhost:5173').catch((err) => {
        showDiagnosticError(win, 'Vite dev server (http://localhost:5173) चालू नहीं है और dist/index.html फ़ाइल नहीं मिली।');
      });
    }
  }

  win.webContents.on('did-fail-load', (e, code, desc, validatedURL) => {
    log.error('webContents did-fail-load:', code, desc, validatedURL);
    // If it failed loading a remote URL, fallback to local dist if available
    if (validatedURL && !validatedURL.startsWith('file:') && distExists) {
      log.info('Retrying with local dist files...');
      loadLocalDist();
    }
  });

  // Open external links (WhatsApp, Web, mailto, etc.) in user's default OS browser/app
  win.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('https:') || targetUrl.startsWith('http:') || targetUrl.startsWith('whatsapp:') || targetUrl.startsWith('mailto:')) {
      shell.openExternal(targetUrl);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();

  // IPC handler to open external links via default OS handler
  ipcMain.handle('open-external', (_, extUrl) => {
    if (extUrl) {
      shell.openExternal(extUrl).catch(err => log.error('openExternal error:', err));
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
      console.error('⚠️ Notice on database initialization:', error?.message || error);
    }
  })();

  // Check updates safely without throwing unhandled rejection offline or 404
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

// --- Auto Updater Events (Silent on 404/network errors) ---
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

autoUpdater.on('update-not-available', () => {
  log.info('Update not available. Current version is latest.');
});

autoUpdater.on('error', (err) => {
  // Silent log only - do not show alert dialogs for 404 release artifacts
  log.warn('Auto-updater background note:', err?.message || err);
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
