export interface NotificationConfig {
  enabled: boolean;
  newMRAssigned: boolean;
  mrMentioned: boolean;
  pipelineStarted: boolean;
  pipelineFailed: boolean;
  pipelineSuccess: boolean;
}

export interface WatchedProject {
  id: number;
  name: string;
  path: string;
}

export interface AppConfig {
  refreshInterval: number; // in milliseconds, default: 60000
  launchAtStartup: boolean;
  notifications: NotificationConfig;
  watchedProjectIds: number[];
  watchedProjectsData: WatchedProject[];
  theme: 'system' | 'light' | 'dark';
  failedPipelineMaxAge: number; // in hours, 0 = no limit
  showUnassignedMRs: boolean;
  dismissedPipelines: number[]; // IDs of hidden pipelines
  dismissedMRs: number[]; // IDs of hidden MRs
  dismissedReleases: number[]; // IDs of hidden releases
  viewMode: 'developer' | 'productOwner';
}

export const DEFAULT_CONFIG: AppConfig = {
  refreshInterval: 60000,
  launchAtStartup: false,
  notifications: {
    enabled: true,
    newMRAssigned: true,
    mrMentioned: true,
    pipelineStarted: false,
    pipelineFailed: true,
    pipelineSuccess: false,
  },
  watchedProjectIds: [],
  watchedProjectsData: [],
  theme: 'system',
  failedPipelineMaxAge: 24, // 24 hours by default
  showUnassignedMRs: false,
  dismissedPipelines: [],
  dismissedMRs: [],
  dismissedReleases: [],
  viewMode: 'developer',
};
