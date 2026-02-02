import Store from 'electron-store';
import { AppConfig, DEFAULT_CONFIG } from '../../shared/types/config';

const configStore = new Store<AppConfig>({
  name: 'config',
  defaults: DEFAULT_CONFIG,
});

export const config = {
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return (configStore as any).get(key);
  },

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    (configStore as any).set(key, value);
  },

  getAll(): AppConfig {
    return configStore.store;
  },

  setAll(newConfig: Partial<AppConfig>): void {
    Object.entries(newConfig).forEach(([key, value]) => {
      if (value !== undefined) {
        (configStore as any).set(key as keyof AppConfig, value);
      }
    });
  },

  reset(): void {
    (configStore as any).clear();
    Object.entries(DEFAULT_CONFIG).forEach(([key, value]) => {
      (configStore as any).set(key as keyof AppConfig, value);
    });
  },

  getRefreshInterval(): number {
    return (configStore as any).get('refreshInterval', DEFAULT_CONFIG.refreshInterval);
  },

  setRefreshInterval(interval: number): void {
    (configStore as any).set('refreshInterval', Math.max(10000, interval));
  },

  isLaunchAtStartup(): boolean {
    return (configStore as any).get('launchAtStartup', false);
  },

  setLaunchAtStartup(enabled: boolean): void {
    (configStore as any).set('launchAtStartup', enabled);
  },

  getWatchedProjectIds(): number[] {
    return (configStore as any).get('watchedProjectIds', []);
  },

  setWatchedProjectIds(projectIds: number[]): void {
    (configStore as any).set('watchedProjectIds', projectIds);
  },

  addWatchedProject(projectId: number): void {
    const projectIds = this.getWatchedProjectIds();
    if (!projectIds.includes(projectId)) {
      projectIds.push(projectId);
      this.setWatchedProjectIds(projectIds);
    }
  },

  removeWatchedProject(projectId: number): void {
    const projectIds = this.getWatchedProjectIds();
    const index = projectIds.indexOf(projectId);
    if (index > -1) {
      projectIds.splice(index, 1);
      this.setWatchedProjectIds(projectIds);
    }
  },
};
