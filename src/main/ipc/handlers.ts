import { ipcMain, shell, app } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipcChannels';
import { accounts } from '../store/accounts';
import { config } from '../store/config';
import { keychain } from '../store/keychain';
import { pollingService } from '../services/polling';
import { trayManager } from '../tray';
import { GitLabClient, getGitLabClient } from '../api/gitlab';
import { setAutoLaunch, getAutoLaunchStatus } from '../services/autolaunch';
import { GitLabAccount, GitLabAccountInput, AppConfig } from '../../shared/types';

async function resolveUserIds(client: GitLabClient, ids: number[]): Promise<number[]> {
  const resolved: number[] = [];
  for (const id of ids) {
    if (id === 0) {
      const user = await client.getCurrentUser();
      if (user) resolved.push(user.id);
    } else {
      resolved.push(id);
    }
  }
  return resolved;
}

export function setupIpcHandlers(): void {
  // ===== Accounts =====

  ipcMain.handle(IPC_CHANNELS.ACCOUNTS_GET_ALL, (): GitLabAccount[] => {
    return accounts.getAll();
  });

  ipcMain.handle(
    IPC_CHANNELS.ACCOUNTS_ADD,
    async (_, input: GitLabAccountInput): Promise<{ success: boolean; account?: GitLabAccount; error?: string }> => {
      try {
        // Validate the token first
        const client = new GitLabClient(input.instanceUrl, input.token, 'temp');
        const user = await client.validateToken();

        if (!user) {
          return { success: false, error: 'Invalid token or connection error' };
        }

        // Create the account
        const account = accounts.add(
          {
            name: input.name,
            instanceUrl: input.instanceUrl,
            username: user.username,
            avatarUrl: user.avatar_url,
            isActive: true,
          },
          input.token
        );

        if (!account) {
          return { success: false, error: 'Error saving account' };
        }

        // Restart polling to include the new account
        pollingService.restart();

        return { success: true, account };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.ACCOUNTS_REMOVE,
    (_, accountId: string): { success: boolean; error?: string } => {
      const removed = accounts.remove(accountId);
      if (removed) {
        pollingService.clearCache();
        pollingService.restart();
        return { success: true };
      }
      return { success: false, error: 'Account not found' };
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.ACCOUNTS_VALIDATE_TOKEN,
    async (_, instanceUrl: string, token: string): Promise<{ valid: boolean; user?: { username: string; name: string; avatarUrl: string } }> => {
      try {
        const client = new GitLabClient(instanceUrl, token, 'temp');
        const user = await client.validateToken();

        if (user) {
          return {
            valid: true,
            user: {
              username: user.username,
              name: user.name,
              avatarUrl: user.avatar_url,
            },
          };
        }
        return { valid: false };
      } catch {
        return { valid: false };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.ACCOUNTS_UPDATE,
    (_, accountId: string, updates: Partial<Omit<GitLabAccount, 'id'>>): { success: boolean; account?: GitLabAccount; error?: string } => {
      const account = accounts.update(accountId, updates);
      if (account) {
        pollingService.restart();
        return { success: true, account };
      }
      return { success: false, error: 'Account not found' };
    }
  );

  // ===== GitLab Data =====

  ipcMain.handle(IPC_CHANNELS.GITLAB_GET_MRS, () => {
    return pollingService.getData().mergeRequests;
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_GET_PIPELINES, () => {
    return pollingService.getData().pipelines;
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_GET_RELEASES, () => {
    return pollingService.getData().releases;
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_REFRESH, async () => {
    const data = await pollingService.refresh();
    return data;
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_DISMISS_PIPELINE, (_, pipelineId: number) => {
    const dismissed = config.get('dismissedPipelines') || [];
    if (!dismissed.includes(pipelineId)) {
      dismissed.push(pipelineId);
      config.set('dismissedPipelines', dismissed);
    }
    // Recalculate and update tray icon
    pollingService.recalculateStatus();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_RESTORE_PIPELINES, () => {
    config.set('dismissedPipelines', []);
    // Recalculate and update tray icon
    pollingService.recalculateStatus();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_GET_MR_NOTES, async (_, projectId: number, mrIid: number) => {
    const activeAccounts = accounts.getActive();
    for (const account of activeAccounts) {
      const token = accounts.getToken(account.id);
      if (!token) continue;
      const client = getGitLabClient(account.id, account.instanceUrl, token);
      try {
        const notes = await client.getMRNotes(projectId, mrIid, 20);
        // Filter out system notes, return only human comments
        return notes
          .filter((n: any) => !n.system)
          .map((n: any) => ({
            id: n.id,
            body: n.body,
            author: {
              name: n.author?.name || 'Unknown',
              username: n.author?.username || '',
              avatar_url: n.author?.avatar_url || '',
            },
            createdAt: n.created_at,
          }));
      } catch (error) {
        console.error(`Failed to get MR notes:`, error);
      }
    }
    return [];
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_GET_PROJECT_MEMBERS, async (_, projectId: number) => {
    const activeAccounts = accounts.getActive();
    for (const account of activeAccounts) {
      const token = accounts.getToken(account.id);
      if (!token) continue;
      const client = getGitLabClient(account.id, account.instanceUrl, token);
      try {
        const members = await client.getProjectMembers(projectId);
        if (members.length > 0) return members;
      } catch (error) {
        console.error(`Failed to get project members:`, error);
      }
    }
    return [];
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_ASSIGN_MR, async (_, projectId: number, mrIid: number, assigneeIds: number[]) => {
    const activeAccounts = accounts.getActive();
    for (const account of activeAccounts) {
      const token = accounts.getToken(account.id);
      if (!token) continue;
      const client = getGitLabClient(account.id, account.instanceUrl, token);
      // Resolve "me" (id=0) to current user ID
      const resolvedIds = await resolveUserIds(client, assigneeIds);
      const success = await client.assignMergeRequest(projectId, mrIid, resolvedIds);
      if (success) {
        pollingService.refresh();
        return { success: true };
      }
    }
    return { success: false, error: 'Failed to assign MR' };
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_ADD_REVIEWER, async (_, projectId: number, mrIid: number, reviewerIds: number[]) => {
    const activeAccounts = accounts.getActive();
    for (const account of activeAccounts) {
      const token = accounts.getToken(account.id);
      if (!token) continue;
      const client = getGitLabClient(account.id, account.instanceUrl, token);
      // Resolve "me" (id=0) to current user ID
      const resolvedIds = await resolveUserIds(client, reviewerIds);
      const success = await client.addReviewerToMergeRequest(projectId, mrIid, resolvedIds);
      if (success) {
        pollingService.refresh();
        return { success: true };
      }
    }
    return { success: false, error: 'Failed to add reviewer' };
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_DISMISS_MR, (_, mrId: number) => {
    const dismissed = config.get('dismissedMRs') || [];
    if (!dismissed.includes(mrId)) {
      dismissed.push(mrId);
      config.set('dismissedMRs', dismissed);
    }
    // Recalculate and update tray icon
    pollingService.recalculateStatus();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_RESTORE_MRS, () => {
    config.set('dismissedMRs', []);
    // Recalculate and update tray icon
    pollingService.recalculateStatus();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_DISMISS_RELEASE, (_, releaseId: number) => {
    const dismissed = config.get('dismissedReleases') || [];
    if (!dismissed.includes(releaseId)) {
      dismissed.push(releaseId);
      config.set('dismissedReleases', dismissed);
    }
    // Recalculate and update tray icon
    pollingService.recalculateStatus();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_RESTORE_RELEASES, () => {
    config.set('dismissedReleases', []);
    // Recalculate and update tray icon
    pollingService.recalculateStatus();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_GET_PO_RELEASES, async (_, projectId: number, page: number, perPage: number) => {
    const activeAccounts = accounts.getActive();
    if (activeAccounts.length === 0) return [];

    for (const account of activeAccounts) {
      const token = accounts.getToken(account.id);
      if (!token) continue;

      const client = getGitLabClient(account.id, account.instanceUrl, token);
      try {
        const releases = await client.getReleasesWithDeployments(projectId, perPage, page);
        if (releases.length > 0) return releases;
      } catch (error) {
        console.error(`Failed to fetch PO releases for project ${projectId}:`, error);
      }
    }
    return [];
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_SEARCH_PROJECTS, async (_, query: string) => {
    // Search on all active accounts
    const activeAccounts = accounts.getActive();
    if (activeAccounts.length === 0) return [];

    const allProjects: any[] = [];
    const seenIds = new Set<number>();

    for (const account of activeAccounts) {
      const token = accounts.getToken(account.id);
      if (!token) continue;

      const client = getGitLabClient(account.id, account.instanceUrl, token);
      const projects = await client.searchProjects(query);

      for (const project of projects) {
        if (!seenIds.has(project.id)) {
          seenIds.add(project.id);
          allProjects.push(project);
        }
      }
    }

    return allProjects;
  });

  ipcMain.handle(IPC_CHANNELS.GITLAB_GET_GROUPS, async (_, accountId: string) => {
    const account = accounts.getById(accountId);
    if (!account) return [];

    const token = accounts.getToken(accountId);
    if (!token) return [];

    const client = getGitLabClient(accountId, account.instanceUrl, token);
    return client.getGroups();
  });

  // ===== Configuration =====

  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, (_, key: keyof AppConfig) => {
    return config.get(key);
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_SET, (_, key: keyof AppConfig, value: unknown) => {
    config.set(key, value as AppConfig[keyof AppConfig]);

    // Special actions based on the key
    if (key === 'refreshInterval' || key === 'viewMode') {
      pollingService.restart();
    } else if (key === 'launchAtStartup') {
      setAutoLaunch(value as boolean);
    }

    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_GET_ALL, () => {
    return config.getAll();
  });

  // ===== Application =====

  ipcMain.handle(IPC_CHANNELS.APP_OPEN_EXTERNAL, (_, url: string) => {
    shell.openExternal(url);
  });

  ipcMain.handle(IPC_CHANNELS.APP_SHOW_PREFERENCES, () => {
    trayManager.showPreferencesWindow();
  });

  ipcMain.handle(IPC_CHANNELS.APP_QUIT, () => {
    app.quit();
  });

  ipcMain.handle(IPC_CHANNELS.APP_HIDE_MENU, () => {
    trayManager.hideMenuWindow();
  });
}
