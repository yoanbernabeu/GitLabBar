import { BrowserWindow } from 'electron';
import { MergeRequest, Pipeline, Release } from '../../shared/types';
import { accounts } from '../store/accounts';
import { config } from '../store/config';
import { getGitLabClient, clearClientCache } from '../api/gitlab';
import { checkNewMRs, checkPipelineStatusChange, cleanNotificationCache } from './notifications';

export type TrayStatus = 'green' | 'orange' | 'red' | 'gray';

export interface PollingData {
  mergeRequests: MergeRequest[];
  pipelines: Pipeline[];
  releases: Release[];
  lastUpdated: Date;
  status: TrayStatus;
  error?: string;
}

const IPC_CHANNELS = {
  DATA_UPDATED: 'data:updated',
};

class PollingService {
  private intervalId: NodeJS.Timeout | null = null;
  private lastData: PollingData = {
    mergeRequests: [],
    pipelines: [],
    releases: [],
    lastUpdated: new Date(),
    status: 'gray',
  };
  private onDataUpdate: ((data: PollingData) => void) | null = null;
  private isRefreshing = false;

  start(callback?: (data: PollingData) => void): void {
    if (callback) {
      this.onDataUpdate = callback;
    }

    this.stop();
    this.refresh();

    const interval = config.getRefreshInterval();
    this.intervalId = setInterval(() => {
      this.refresh();
    }, interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  restart(): void {
    this.start(this.onDataUpdate || undefined);
  }

  async refresh(): Promise<PollingData> {
    if (this.isRefreshing) {
      return this.lastData;
    }

    this.isRefreshing = true;

    try {
      const activeAccounts = accounts.getActive();

      if (activeAccounts.length === 0) {
        this.lastData = {
          mergeRequests: [],
          pipelines: [],
          releases: [],
          lastUpdated: new Date(),
          status: 'gray',
        };
        this.emitUpdate();
        return this.lastData;
      }

      const allMergeRequests: MergeRequest[] = [];
      const allPipelines: Pipeline[] = [];
      const allReleases: Release[] = [];

      for (const account of activeAccounts) {
        const token = accounts.getToken(account.id);
        if (!token) continue;

        const client = getGitLabClient(account.id, account.instanceUrl, token);

        try {
          const mrs = await client.getAllMergeRequests();

          for (const mr of mrs) {
            const project = await client.getProject(mr.projectId);
            if (project) {
              mr.projectName = project.name;
              mr.projectPath = project.path_with_namespace;
            }
          }

          allMergeRequests.push(...mrs);

          // Fetch MRs without reviewer if the option is enabled
          const showUnassignedMRs = config.get('showUnassignedMRs');
          if (showUnassignedMRs) {
            const watchedProjectIds = config.getWatchedProjectIds();
            if (watchedProjectIds.length > 0) {
              const unassignedMRs = await client.getUnassignedMergeRequests(watchedProjectIds);
              // Don't add MRs that are already present
              const existingIds = new Set(allMergeRequests.map(mr => mr.id));
              for (const mr of unassignedMRs) {
                if (!existingIds.has(mr.id)) {
                  allMergeRequests.push(mr);
                }
              }
            }
          }

          // Fetch user's active pipelines (running/pending on recent projects)
          const userActivePipelines = await client.getUserActivePipelines();

          // Only keep pipelines from watched projects
          const watchedProjectIds = config.getWatchedProjectIds();
          const watchedSet = new Set(watchedProjectIds);
          const watchedActivePipelines = userActivePipelines.filter(p => watchedSet.has(p.projectId));

          // Filter out too old running/pending pipelines (probably stuck)
          const maxRunningAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 jours max pour running/pending
          const now = Date.now();
          const recentActivePipelines = watchedActivePipelines.filter(p => {
            const pipelineAge = now - new Date(p.createdAt).getTime();
            return pipelineAge <= maxRunningAgeMs;
          });

          allPipelines.push(...recentActivePipelines);

          // Also fetch failed pipelines from watched projects only
          const allProjectIds = [...watchedProjectIds];

          if (allProjectIds.length > 0) {
            const pipelines = await client.getAllPipelinesForProjects(allProjectIds);
            const maxAgeHours = config.get('failedPipelineMaxAge') || 24;
            const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
            const now = Date.now();

            // Keep only recent failed pipelines (running/pending already fetched)
            const failedPipelines = pipelines.filter(p => {
              if (p.status === 'failed') {
                if (maxAgeHours === 0) return true; // 0 = pas de limite
                const pipelineAge = now - new Date(p.createdAt).getTime();
                return pipelineAge <= maxAgeMs;
              }
              return false;
            });
            allPipelines.push(...failedPipelines);
          }

          // Deduplicate pipelines by ID
          const pipelineMap = new Map<number, Pipeline>();
          allPipelines.forEach(p => pipelineMap.set(p.id, p));
          allPipelines.length = 0;
          allPipelines.push(...pipelineMap.values());

          // Fetch jobs for each pipeline
          const pipelinesWithJobs = await Promise.all(
            allPipelines.map(p => client.getPipelineWithJobs(p))
          );
          allPipelines.length = 0;
          allPipelines.push(...pipelinesWithJobs);

          // Fetch releases from watched projects
          const watchedProjectIdsForReleases = config.getWatchedProjectIds();
          const viewMode = config.get('viewMode') || 'developer';
          const releasesLimit = viewMode === 'productOwner' ? 5 : 3;
          if (watchedProjectIdsForReleases.length > 0) {
            const releasesPromises = watchedProjectIdsForReleases.map(projectId =>
              client.getReleasesWithDeployments(projectId, releasesLimit).catch(() => [])
            );
            const releasesResults = await Promise.all(releasesPromises);
            allReleases.push(...releasesResults.flat());
          }
        } catch (error) {
          console.error(`Error fetching data for account ${account.name}:`, error);
        }
      }

      checkNewMRs(this.lastData.mergeRequests, allMergeRequests);
      checkPipelineStatusChange(this.lastData.pipelines, allPipelines);

      console.log('Pipelines to display:', allPipelines.map(p => ({
        id: p.id,
        project: p.projectName,
        status: p.status,
        ref: p.ref,
        createdAt: p.createdAt
      })));

      console.log('Releases to display:', allReleases.map(r => ({
        id: r.id,
        project: r.projectName,
        tagName: r.tagName,
        deployments: r.deployments?.map(d => `${d.environment}:${d.status}`) || []
      })));

      const status = this.calculateStatus(allMergeRequests, allPipelines);

      this.lastData = {
        mergeRequests: allMergeRequests,
        pipelines: allPipelines,
        releases: allReleases,
        lastUpdated: new Date(),
        status,
      };

      cleanNotificationCache();

      this.emitUpdate();
      return this.lastData;
    } catch (error) {
      console.error('Polling error:', error);
      this.lastData = {
        ...this.lastData,
        lastUpdated: new Date(),
        status: 'gray',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.emitUpdate();
      return this.lastData;
    } finally {
      this.isRefreshing = false;
    }
  }

  private calculateStatus(mrs: MergeRequest[], pipelines: Pipeline[]): TrayStatus {
    // Get dismissed items to exclude them from status calculation
    const dismissedPipelines = config.get('dismissedPipelines') || [];
    const dismissedMRs = config.get('dismissedMRs') || [];

    // Filter out dismissed items
    const visiblePipelines = pipelines.filter((p) => !dismissedPipelines.includes(p.id));
    const visibleMRs = mrs.filter((mr) => !dismissedMRs.includes(mr.id));

    const hasFailedPipeline = visiblePipelines.some((p) => p.status === 'failed');
    if (hasFailedPipeline) {
      return 'red';
    }

    const hasRunningPipeline = visiblePipelines.some((p) => p.status === 'running');
    if (hasRunningPipeline) {
      return 'orange';
    }

    const hasReviewNeeded = visibleMRs.some((mr) => mr.userRole === 'reviewer');
    if (hasReviewNeeded) {
      return 'green';
    }

    if (visibleMRs.length > 0 || visiblePipelines.length > 0) {
      return 'green';
    }

    return 'gray';
  }

  private emitUpdate(): void {
    if (this.onDataUpdate) {
      this.onDataUpdate(this.lastData);
    }

    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(IPC_CHANNELS.DATA_UPDATED, this.lastData);
      }
    });
  }

  getData(): PollingData {
    return this.lastData;
  }

  getMergeRequestsCount(): number {
    return this.lastData.mergeRequests.length;
  }

  getReviewCount(): number {
    return this.lastData.mergeRequests.filter((mr) => mr.userRole === 'reviewer').length;
  }

  setOnDataUpdate(callback: (data: PollingData) => void): void {
    this.onDataUpdate = callback;
  }

  clearCache(): void {
    clearClientCache();
  }

  // Recalculate status without fetching new data (used when dismissing items)
  recalculateStatus(): void {
    const newStatus = this.calculateStatus(this.lastData.mergeRequests, this.lastData.pipelines);
    if (newStatus !== this.lastData.status) {
      this.lastData = {
        ...this.lastData,
        status: newStatus,
      };
      this.emitUpdate();
    }
  }
}

export const pollingService = new PollingService();
