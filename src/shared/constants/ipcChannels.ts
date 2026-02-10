export const IPC_CHANNELS = {
  // Accounts
  ACCOUNTS_GET_ALL: 'accounts:getAll',
  ACCOUNTS_ADD: 'accounts:add',
  ACCOUNTS_REMOVE: 'accounts:remove',
  ACCOUNTS_VALIDATE_TOKEN: 'accounts:validateToken',
  ACCOUNTS_UPDATE: 'accounts:update',

  // GitLab Data
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
  GITLAB_GET_PO_RELEASES: 'gitlab:getPOReleases',

  // Configuration
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_GET_ALL: 'config:getAll',

  // Application
  APP_OPEN_EXTERNAL: 'app:openExternal',
  APP_SHOW_PREFERENCES: 'app:showPreferences',
  APP_QUIT: 'app:quit',
  APP_HIDE_MENU: 'app:hideMenu',

  // Events (main → renderer)
  DATA_UPDATED: 'data:updated',
  REFRESH_STATUS: 'refresh:status',
  ERROR_OCCURRED: 'error:occurred',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
