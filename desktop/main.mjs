import { app, BrowserWindow, Menu, protocol, session, shell } from 'electron';
import { GAME_SCHEME, GAME_URL, isGameUrl, serveGame } from './protocol.mjs';

const gameName = 'Shadow Mandate 2040';
app.setName(gameName);
app.setAppUserModelId('com.jfeffe.shadowmandate2040');

protocol.registerSchemesAsPrivileged([{
  scheme: GAME_SCHEME,
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
}]);

function allowClipboardWrite(webContents, permission, origin) {
  return permission === 'clipboard-sanitized-write'
    && isGameUrl(origin)
    && isGameUrl(webContents?.getURL());
}

function createWindow() {
  const window = new BrowserWindow({
    title: gameName,
    width: 1440,
    height: 900,
    minWidth: 760,
    minHeight: 520,
    backgroundColor: '#0b1220',
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (!isGameUrl(url)) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://github.com/JFeffe/Sigma2040/compare/')) {
      void shell.openExternal(url).catch(() => {});
    }
    return { action: 'deny' };
  });
  window.once('ready-to-show', () => window.show());
  void window.loadURL(GAME_URL);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const window = BrowserWindow.getAllWindows()[0];
    if (!window) return;
    if (window.isMinimized()) window.restore();
    window.focus();
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    protocol.handle(GAME_SCHEME, serveGame);
    session.defaultSession.setPermissionCheckHandler(allowClipboardWrite);
    session.defaultSession.setPermissionRequestHandler((contents, permission, callback, details) => {
      callback(allowClipboardWrite(contents, permission, details.requestingUrl));
    });
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
