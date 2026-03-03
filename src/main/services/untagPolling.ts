import { BrowserWindow } from 'electron';
import { UntagProject } from '../../shared/types';
import { accounts } from '../store/accounts';
import { config } from '../store/config';
import { getGitLabClient } from '../api/gitlab';

const IPC_CHANNELS = {
  UNTAG_DATA_UPDATED: 'untag:dataUpdated',
};

const UNTAG_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 3;

export interface UntagPollingData {
  untagProjects: UntagProject[];
  excludedCount: number;
  lastUpdated: Date;
}

class UntagPollingService {
  private intervalId: NodeJS.Timeout | null = null;
  private lastData: UntagPollingData = {
    untagProjects: [],
    excludedCount: 0,
    lastUpdated: new Date(),
  };
  private isRefreshing = false;

  start(): void {
    this.stop();
    this.refresh();
    this.intervalId = setInterval(() => {
      this.refresh();
    }, UNTAG_POLL_INTERVAL);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async refresh(): Promise<UntagPollingData> {
    if (this.isRefreshing) {
      return this.lastData;
    }

    this.isRefreshing = true;

    try {
      const activeAccounts = accounts.getActive();

      if (activeAccounts.length === 0) {
        this.lastData = {
          untagProjects: [],
          excludedCount: 0,
          lastUpdated: new Date(),
        };
        this.emitUpdate();
        return this.lastData;
      }

      const watchedProjectIds = config.getWatchedProjectIds();
      if (watchedProjectIds.length === 0) {
        this.lastData = {
          untagProjects: [],
          excludedCount: 0,
          lastUpdated: new Date(),
        };
        this.emitUpdate();
        return this.lastData;
      }

      const excludedIds = config.get('untagExcludedProjectIds') || [];
      const projectIds = watchedProjectIds.filter((id) => !excludedIds.includes(id));

      const allUntagProjects: UntagProject[] = [];

      for (const account of activeAccounts) {
        const token = accounts.getToken(account.id);
        if (!token) continue;

        const client = getGitLabClient(account.id, account.instanceUrl, token);

        // Process projects in batches to respect rate limiting
        for (let i = 0; i < projectIds.length; i += BATCH_SIZE) {
          const batch = projectIds.slice(i, i + BATCH_SIZE);
          const results = await Promise.all(
            batch.map(async (projectId) => {
              try {
                // First check if project has any tags
                const latestTag = await client.getLatestTag(projectId);
                if (!latestTag) {
                  // Auto-exclude projects without tags
                  this.autoExcludeProject(projectId);
                  return null;
                }
                return client.getUntagInfo(projectId);
              } catch (error) {
                console.error(`Failed to check untag for project ${projectId}:`, error);
                return null;
              }
            })
          );

          for (const result of results) {
            if (result) {
              allUntagProjects.push(result);
            }
          }
        }
      }

      // Deduplicate by projectId
      const seen = new Set<number>();
      const deduplicated = allUntagProjects.filter((p) => {
        if (seen.has(p.projectId)) return false;
        seen.add(p.projectId);
        return true;
      });

      const updatedExcludedIds = config.get('untagExcludedProjectIds') || [];

      this.lastData = {
        untagProjects: deduplicated,
        excludedCount: updatedExcludedIds.length,
        lastUpdated: new Date(),
      };

      this.emitUpdate();
      return this.lastData;
    } catch (error) {
      console.error('Untag polling error:', error);
      this.lastData = {
        ...this.lastData,
        lastUpdated: new Date(),
      };
      this.emitUpdate();
      return this.lastData;
    } finally {
      this.isRefreshing = false;
    }
  }

  private autoExcludeProject(projectId: number): void {
    const excluded = config.get('untagExcludedProjectIds') || [];
    if (!excluded.includes(projectId)) {
      excluded.push(projectId);
      config.set('untagExcludedProjectIds', excluded);
      console.log(`Auto-excluded project ${projectId} from untag (no tags found)`);
    }
  }

  private emitUpdate(): void {
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(IPC_CHANNELS.UNTAG_DATA_UPDATED, this.lastData);
      }
    });
  }

  getData(): UntagPollingData {
    return this.lastData;
  }

  clearExclusions(): void {
    config.set('untagExcludedProjectIds', []);
  }
}

export const untagPollingService = new UntagPollingService();
