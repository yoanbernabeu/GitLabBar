import { app } from 'electron';
import { config } from '../store/config';

export function setupAutoLaunch(): void {
  const shouldLaunchAtStartup = config.isLaunchAtStartup();
  setAutoLaunch(shouldLaunchAtStartup);
}

export function setAutoLaunch(enabled: boolean): void {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true,
    path: app.getPath('exe'),
  });

  config.setLaunchAtStartup(enabled);
}

export function getAutoLaunchStatus(): boolean {
  const settings = app.getLoginItemSettings();
  return settings.openAtLogin;
}

export function toggleAutoLaunch(): boolean {
  const currentStatus = getAutoLaunchStatus();
  setAutoLaunch(!currentStatus);
  return !currentStatus;
}
