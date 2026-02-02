import { app, BrowserWindow } from 'electron';
import path from 'path';
import { trayManager } from './main/tray';
import { pollingService } from './main/services/polling';
import { setupIpcHandlers } from './main/ipc/handlers';
import { setupAutoLaunch } from './main/services/autolaunch';

// S'assurer qu'une seule instance de l'app tourne
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    trayManager.showPreferencesWindow();
  });

  // Masquer l'icône du dock (app menu bar uniquement)
  if (process.platform === 'darwin') {
    app.dock?.hide();
  }

  app.whenReady().then(() => {
    setupIpcHandlers();
    trayManager.initialize();
    setupAutoLaunch();

    pollingService.start((data) => {
      trayManager.updateFromData(data);
    });

    app.on('refresh-data' as any, () => {
      pollingService.refresh();
    });
  });

  app.on('window-all-closed', () => {
    // Ne rien faire pour garder l'app ouverte
  });

  app.on('before-quit', () => {
    pollingService.stop();
    trayManager.destroy();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      trayManager.showPreferencesWindow();
    }
  });
}
