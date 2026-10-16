const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

// Resolve the bundled VLC binary. In dev it reads from ./vlc-bin,
// in a packaged app it reads from the extraResources folder.
function resolveVlcPath() {
  const devPath = path.join(__dirname, '..', '..', 'vlc-bin', 'vlc.exe');
  const prodPath = path.join(process.resourcesPath || '', 'vlc-bin', 'vlc.exe');
  if (app.isPackaged && fs.existsSync(prodPath)) return prodPath;
  if (fs.existsSync(devPath)) return devPath;
  return null; // not bundled yet — see README "Bundling VLC" section
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 860,
    minHeight: 560,
    titleBarStyle: 'hidden', // we draw our own Mac-style traffic lights
    frame: false,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, '..', 'main', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true, // the address-bar content loads inside a <webview>
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-control', () => {});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- Window control IPC (for our custom traffic-light buttons) ---
ipcMain.on('win:minimize', () => mainWindow.minimize());
ipcMain.on('win:maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('win:close', () => mainWindow.close());

// --- VLC fallback: open a URL/stream in bundled VLC when Chromium can't play it ---
// Used for RTSP, MMS, exotic codecs, local files hls.js/dash.js can't decode, etc.
ipcMain.handle('vlc:play', async (_event, targetUrl) => {
  const vlcPath = resolveVlcPath();
  if (!vlcPath) {
    return { ok: false, error: 'VLC binary not bundled. See README "Bundling VLC".' };
  }
  try {
    const child = spawn(vlcPath, [targetUrl, '--one-instance', '--playlist-enqueue'], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle('shell:openExternal', async (_event, url) => {
  await shell.openExternal(url);
  return { ok: true };
});
