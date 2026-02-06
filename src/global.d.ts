interface GitLabBarAPI {
  accounts: {
    getAll: () => Promise<any>;
    add: (input: any) => Promise<any>;
    remove: (accountId: string) => Promise<any>;
    update: (accountId: string, updates: any) => Promise<any>;
    validateToken: (instanceUrl: string, token: string) => Promise<any>;
  };

  gitlab: {
    getMRs: () => Promise<any>;
    getPipelines: () => Promise<any>;
    getReleases: () => Promise<any>;
    refresh: () => Promise<any>;
    searchProjects: (query: string) => Promise<any>;
    getGroups: (accountId: string) => Promise<any>;
    dismissPipeline: (pipelineId: number) => Promise<any>;
    restorePipelines: () => Promise<any>;
    dismissMR: (mrId: number) => Promise<any>;
    restoreMRs: () => Promise<any>;
    dismissRelease: (releaseId: number) => Promise<any>;
    restoreReleases: () => Promise<any>;
  };

  config: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<any>;
    getAll: () => Promise<any>;
  };

  app: {
    openExternal: (url: string) => Promise<any>;
    showPreferences: () => Promise<any>;
    quit: () => Promise<any>;
    hideMenu: () => Promise<any>;
  };

  on: {
    dataUpdated: (callback: (data: any) => void) => () => void;
    refreshStatus: (callback: (status: string) => void) => () => void;
    error: (callback: (error: string) => void) => () => void;
  };
}

interface Window {
  gitlabbar: GitLabBarAPI;
}
