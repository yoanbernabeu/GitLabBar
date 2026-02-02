import { Tray, Menu, nativeImage, BrowserWindow, screen, app, Notification } from 'electron';
import path from 'path';
import Store from 'electron-store';

export type TrayStatus = 'green' | 'orange' | 'red' | 'gray';

export interface PollingData {
  mergeRequests: any[];
  pipelines: any[];
  lastUpdated: Date;
  status: TrayStatus;
  error?: string;
}

// Path to icons
const ICONS_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets/icons')
  : path.join(app.getAppPath(), 'assets/icons');

// Store for window size
const windowStore = new Store<{ menuWindowSize: { width: number; height: number } }>({
  name: 'window-state',
  defaults: {
    menuWindowSize: { width: 500, height: 650 },
  },
});

class TrayManager {
  private tray: Tray | null = null;
  private menuWindow: BrowserWindow | null = null;
  private preferencesWindow: BrowserWindow | null = null;
  private currentStatus: TrayStatus = 'gray';
  private badgeCount = 0;

  private getIconPath(status: TrayStatus): string {
    return path.join(ICONS_PATH, `tray-${status}.png`);
  }

  private createTrayIcon(status: TrayStatus): Electron.NativeImage {
    try {
      // Load both 1x and 2x icons for Retina support
      const iconPath = this.getIconPath(status);
      const icon2xPath = path.join(ICONS_PATH, `tray-${status}@2x.png`);

      console.log('Loading tray icon from:', iconPath);

      const icon = nativeImage.createFromPath(iconPath);

      if (icon.isEmpty()) {
        console.warn('Icon is empty, using fallback');
        return this.createFallbackIcon();
      }

      // Add @2x version for Retina displays
      try {
        const icon2x = nativeImage.createFromPath(icon2xPath);
        if (!icon2x.isEmpty()) {
          icon.addRepresentation({
            scaleFactor: 2,
            width: 32,
            height: 32,
            buffer: icon2x.toPNG(),
          });
        }
      } catch (e) {
        console.warn('Could not load @2x icon');
      }

      // Don't use template image - we want colored icons
      // icon.setTemplateImage(true);
      return icon;
    } catch (error) {
      console.error('Error loading icon:', error);
      return this.createFallbackIcon();
    }
  }

  private createFallbackIcon(): Electron.NativeImage {
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      const offset = i * 4;
      canvas[offset] = 128;
      canvas[offset + 1] = 128;
      canvas[offset + 2] = 128;
      canvas[offset + 3] = 200;
    }
    const icon = nativeImage.createFromBuffer(canvas, { width: size, height: size });
    icon.setTemplateImage(true);
    return icon;
  }

  initialize(): void {
    console.log('=== Initializing TrayManager ===');
    const icon = this.createTrayIcon('gray');
    this.tray = new Tray(icon);
    this.tray.setToolTip('GitLabBar');

    this.tray.on('click', (event, bounds) => {
      this.toggleMenuWindow(bounds);
    });

    this.tray.on('right-click', () => {
      this.showContextMenu();
    });

    if (Notification.isSupported()) {
      new Notification({
        title: 'GitLabBar',
        body: 'Application started',
      }).show();
    }
  }

  private toggleMenuWindow(bounds: Electron.Rectangle): void {
    if (this.menuWindow && !this.menuWindow.isDestroyed()) {
      if (this.menuWindow.isVisible()) {
        this.menuWindow.hide();
        return;
      }
      this.menuWindow.show();
      this.positionWindow(this.menuWindow, bounds);
      return;
    }
    this.createMenuWindow(bounds);
  }

  private createMenuWindow(bounds: Electron.Rectangle): void {
    // Load saved window size
    const savedSize = windowStore.get('menuWindowSize', { width: 500, height: 650 });

    this.menuWindow = new BrowserWindow({
      width: savedSize.width,
      height: savedSize.height,
      minWidth: 400,
      minHeight: 400,
      maxWidth: 800,
      maxHeight: 900,
      show: false,
      frame: false,
      resizable: true,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      transparent: false,
      hasShadow: true,
      vibrancy: 'menu',
      visualEffectState: 'active',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Save window size when resized
    this.menuWindow.on('resize', () => {
      if (this.menuWindow && !this.menuWindow.isDestroyed()) {
        const [width, height] = this.menuWindow.getSize();
        windowStore.set('menuWindowSize', { width, height });
      }
    });

    // Load the HTML file
    const rendererPath = path.join(app.getAppPath(), 'src/renderer/index.html');
    console.log('Loading renderer from:', rendererPath);
    this.menuWindow.loadFile(rendererPath);

    this.positionWindow(this.menuWindow, bounds);
    this.menuWindow.show();

    // DevTools in dev - disabled
    // if (!app.isPackaged) {
    //   this.menuWindow.webContents.openDevTools({ mode: 'detach' });
    // }

    this.menuWindow.on('blur', () => {
      if (this.menuWindow && !this.menuWindow.isDestroyed()) {
        this.menuWindow.hide();
      }
    });

    this.menuWindow.on('closed', () => {
      this.menuWindow = null;
    });
  }

  private positionWindow(window: BrowserWindow, trayBounds: Electron.Rectangle): void {
    const windowBounds = window.getBounds();
    const display = screen.getDisplayMatching(trayBounds);

    let x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);
    let y = Math.round(trayBounds.y + trayBounds.height);

    if (x < display.bounds.x) {
      x = display.bounds.x;
    }
    if (x + windowBounds.width > display.bounds.x + display.bounds.width) {
      x = display.bounds.x + display.bounds.width - windowBounds.width;
    }

    window.setPosition(x, y);
  }

  private showContextMenu(): void {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Refresh',
        click: () => app.emit('refresh-data'),
      },
      { type: 'separator' },
      {
        label: 'Preferences...',
        click: () => this.showPreferencesWindow(),
      },
      { type: 'separator' },
      {
        label: 'Quit GitLabBar',
        click: () => app.quit(),
      },
    ]);
    this.tray?.popUpContextMenu(contextMenu);
  }

  showPreferencesWindow(): void {
    if (this.preferencesWindow && !this.preferencesWindow.isDestroyed()) {
      this.preferencesWindow.show();
      this.preferencesWindow.focus();
      return;
    }

    this.preferencesWindow = new BrowserWindow({
      width: 700,
      height: 500,
      minWidth: 600,
      minHeight: 400,
      show: false,
      title: 'GitLabBar - Preferences',
      titleBarStyle: 'hiddenInset',
      vibrancy: 'window',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    const prefsPath = path.join(app.getAppPath(), 'src/renderer/preferences.html');
    console.log('Loading preferences from:', prefsPath);
    this.preferencesWindow.loadFile(prefsPath);

    this.preferencesWindow.once('ready-to-show', () => {
      this.preferencesWindow?.show();
    });

    this.preferencesWindow.on('closed', () => {
      this.preferencesWindow = null;
    });
  }

  updateIcon(status: TrayStatus): void {
    if (!this.tray || this.currentStatus === status) return;
    this.currentStatus = status;
    const icon = this.createTrayIcon(status);
    this.tray.setImage(icon);
  }

  updateBadge(count: number): void {
    if (!this.tray || this.badgeCount === count) return;
    this.badgeCount = count;
    const tooltip = count > 0 ? `GitLabBar - ${count} pending MR(s)` : 'GitLabBar';
    this.tray.setToolTip(tooltip);
  }

  updateFromData(data: PollingData): void {
    this.updateIcon(data.status);
    const reviewCount = data.mergeRequests.filter((mr: any) => mr.userRole === 'reviewer').length;
    this.updateBadge(reviewCount);
  }

  hideMenuWindow(): void {
    if (this.menuWindow && !this.menuWindow.isDestroyed()) {
      this.menuWindow.hide();
    }
  }

  destroy(): void {
    if (this.menuWindow && !this.menuWindow.isDestroyed()) {
      this.menuWindow.close();
    }
    if (this.preferencesWindow && !this.preferencesWindow.isDestroyed()) {
      this.preferencesWindow.close();
    }
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

export const trayManager = new TrayManager();
