import { contextBridge, ipcRenderer } from 'electron';

const IPC_CHANNELS = {
  ACCOUNTS_GET_ALL: 'accounts:getAll',
  ACCOUNTS_ADD: 'accounts:add',
  ACCOUNTS_REMOVE: 'accounts:remove',
  ACCOUNTS_VALIDATE_TOKEN: 'accounts:validateToken',
  ACCOUNTS_UPDATE: 'accounts:update',
  GITLAB_GET_MRS: 'gitlab:getMRs',
  GITLAB_GET_PIPELINES: 'gitlab:getPipelines',
  GITLAB_GET_RELEASES: 'gitlab:getReleases',
  GITLAB_REFRESH: 'gitlab:refresh',
  GITLAB_SEARCH_PROJECTS: 'gitlab:searchProjects',
  GITLAB_GET_GROUPS: 'gitlab:getGroups',
  GITLAB_DISMISS_PIPELINE: 'gitlab:dismissPipeline',
  GITLAB_RESTORE_PIPELINES: 'gitlab:restorePipelines',
  GITLAB_DISMISS_MR: 'gitlab:dismissMR',
  GITLAB_RESTORE_MRS: 'gitlab:restoreMRs',
  GITLAB_DISMISS_RELEASE: 'gitlab:dismissRelease',
  GITLAB_RESTORE_RELEASES: 'gitlab:restoreReleases',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_GET_ALL: 'config:getAll',
  APP_OPEN_EXTERNAL: 'app:openExternal',
  APP_SHOW_PREFERENCES: 'app:showPreferences',
  APP_QUIT: 'app:quit',
  APP_HIDE_MENU: 'app:hideMenu',
  DATA_UPDATED: 'data:updated',
  REFRESH_STATUS: 'refresh:status',
  ERROR_OCCURRED: 'error:occurred',
};

const api = {
  accounts: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.ACCOUNTS_GET_ALL),
    add: (input: any) => ipcRenderer.invoke(IPC_CHANNELS.ACCOUNTS_ADD, input),
    remove: (accountId: string) => ipcRenderer.invoke(IPC_CHANNELS.ACCOUNTS_REMOVE, accountId),
    update: (accountId: string, updates: any) => ipcRenderer.invoke(IPC_CHANNELS.ACCOUNTS_UPDATE, accountId, updates),
    validateToken: (instanceUrl: string, token: string) => ipcRenderer.invoke(IPC_CHANNELS.ACCOUNTS_VALIDATE_TOKEN, instanceUrl, token),
  },

  gitlab: {
    getMRs: () => ipcRenderer.invoke(IPC_CHANNELS.GITLAB_GET_MRS),
    getPipelines: () => ipcRenderer.invoke(IPC_CHANNELS.GITLAB_GET_PIPELINES),
    getReleases: () => ipcRenderer.invoke(IPC_CHANNELS.GITLAB_GET_RELEASES),
    refresh: () => ipcRenderer.invoke(IPC_CHANNELS.GITLAB_REFRESH),
    searchProjects: (query: string) => ipcRenderer.invoke(IPC_CHANNELS.GITLAB_SEARCH_PROJECTS, query),
    getGroups: (accountId: string) => ipcRenderer.invoke(IPC_CHANNELS.GITLAB_GET_GROUPS, accountId),
    dismissPipeline: (pipelineId: number) => ipcRenderer.invoke(IPC_CHANNELS.GITLAB_DISMISS_PIPELINE, pipelineId),
    restorePipelines: () => ipcRenderer.invoke(IPC_CHANNELS.GITLAB_RESTORE_PIPELINES),
    dismissMR: (mrId: number) => ipcRenderer.invoke(IPC_CHANNELS.GITLAB_DISMISS_MR, mrId),
    restoreMRs: () => ipcRenderer.invoke(IPC_CHANNELS.GITLAB_RESTORE_MRS),
    dismissRelease: (releaseId: number) => ipcRenderer.invoke(IPC_CHANNELS.GITLAB_DISMISS_RELEASE, releaseId),
    restoreReleases: () => ipcRenderer.invoke(IPC_CHANNELS.GITLAB_RESTORE_RELEASES),
  },

  config: {
    get: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET, key),
    set: (key: string, value: any) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, key, value),
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET_ALL),
  },

  app: {
    openExternal: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.APP_OPEN_EXTERNAL, url),
    showPreferences: () => ipcRenderer.invoke(IPC_CHANNELS.APP_SHOW_PREFERENCES),
    quit: () => ipcRenderer.invoke(IPC_CHANNELS.APP_QUIT),
    hideMenu: () => ipcRenderer.invoke(IPC_CHANNELS.APP_HIDE_MENU),
  },

  on: {
    dataUpdated: (callback: (data: any) => void) => {
      const handler = (_: any, data: any) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.DATA_UPDATED, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DATA_UPDATED, handler);
    },
    refreshStatus: (callback: (status: string) => void) => {
      const handler = (_: any, status: string) => callback(status);
      ipcRenderer.on(IPC_CHANNELS.REFRESH_STATUS, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.REFRESH_STATUS, handler);
    },
    error: (callback: (error: string) => void) => {
      const handler = (_: any, error: string) => callback(error);
      ipcRenderer.on(IPC_CHANNELS.ERROR_OCCURRED, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.ERROR_OCCURRED, handler);
    },
  },
};

contextBridge.exposeInMainWorld('gitlabbar', api);
