import { Notification, shell } from 'electron';
import { MergeRequest, Pipeline, PipelineStatus } from '../../shared/types';
import { config } from '../store/config';

// Cache to avoid duplicate notifications
const notifiedMRs = new Set<string>();
const notifiedPipelines = new Set<string>();

function getNotificationConfig() {
  return config.get('notifications');
}

export function notifyNewMRAssigned(mr: MergeRequest): void {
  const notifConfig = getNotificationConfig();
  if (!notifConfig.enabled || !notifConfig.newMRAssigned) return;

  const key = `mr-assigned-${mr.id}`;
  if (notifiedMRs.has(key)) return;

  const notification = new Notification({
    title: 'New MR assigned',
    body: `${mr.title}\nBy ${mr.author.name}`,
    silent: false,
  });

  notification.on('click', () => {
    shell.openExternal(mr.webUrl);
  });

  notification.show();
  notifiedMRs.add(key);
}

export function notifyMRMentioned(mr: MergeRequest): void {
  const notifConfig = getNotificationConfig();
  if (!notifConfig.enabled || !notifConfig.mrMentioned) return;

  const key = `mr-mentioned-${mr.id}`;
  if (notifiedMRs.has(key)) return;

  const notification = new Notification({
    title: 'You have been mentioned',
    body: `${mr.title}\nIn ${mr.projectName}`,
    silent: false,
  });

  notification.on('click', () => {
    shell.openExternal(mr.webUrl);
  });

  notification.show();
  notifiedMRs.add(key);
}

export function notifyPipelineStarted(pipeline: Pipeline): void {
  const notifConfig = getNotificationConfig();
  if (!notifConfig.enabled || !notifConfig.pipelineStarted) return;

  const key = `pipeline-started-${pipeline.id}`;
  if (notifiedPipelines.has(key)) return;

  const notification = new Notification({
    title: 'Pipeline started',
    body: `${pipeline.projectName}\nBranch: ${pipeline.ref}`,
    silent: false,
  });

  notification.on('click', () => {
    shell.openExternal(pipeline.webUrl);
  });

  notification.show();
  notifiedPipelines.add(key);
}

export function notifyPipelineFailed(pipeline: Pipeline): void {
  const notifConfig = getNotificationConfig();
  if (!notifConfig.enabled || !notifConfig.pipelineFailed) return;

  const key = `pipeline-failed-${pipeline.id}`;
  if (notifiedPipelines.has(key)) return;

  const notification = new Notification({
    title: 'Pipeline failed',
    body: `${pipeline.projectName}\nBranch: ${pipeline.ref}`,
    silent: false,
    urgency: 'critical',
  });

  notification.on('click', () => {
    shell.openExternal(pipeline.webUrl);
  });

  notification.show();
  notifiedPipelines.add(key);
}

export function notifyPipelineSuccess(pipeline: Pipeline): void {
  const notifConfig = getNotificationConfig();
  if (!notifConfig.enabled || !notifConfig.pipelineSuccess) return;

  const key = `pipeline-success-${pipeline.id}`;
  if (notifiedPipelines.has(key)) return;

  const notification = new Notification({
    title: 'Pipeline succeeded',
    body: `${pipeline.projectName}\nBranch: ${pipeline.ref}`,
    silent: false,
  });

  notification.on('click', () => {
    shell.openExternal(pipeline.webUrl);
  });

  notification.show();
  notifiedPipelines.add(key);
}

export function checkPipelineStatusChange(
  oldPipelines: Pipeline[],
  newPipelines: Pipeline[]
): void {
  const oldMap = new Map(oldPipelines.map((p) => [p.id, p]));

  for (const newPipeline of newPipelines) {
    const oldPipeline = oldMap.get(newPipeline.id);

    if (!oldPipeline) {
      // New pipeline
      if (newPipeline.status === 'running') {
        notifyPipelineStarted(newPipeline);
      }
    } else if (oldPipeline.status !== newPipeline.status) {
      // Status change
      if (newPipeline.status === 'running') {
        notifyPipelineStarted(newPipeline);
      } else if (newPipeline.status === 'failed') {
        notifyPipelineFailed(newPipeline);
      } else if (newPipeline.status === 'success') {
        notifyPipelineSuccess(newPipeline);
      }
    }
  }
}

export function checkNewMRs(oldMRs: MergeRequest[], newMRs: MergeRequest[]): void {
  const oldIds = new Set(oldMRs.map((mr) => mr.id));

  for (const mr of newMRs) {
    if (!oldIds.has(mr.id)) {
      if (mr.userRole === 'assignee') {
        notifyNewMRAssigned(mr);
      } else if (mr.userRole === 'mentioned') {
        notifyMRMentioned(mr);
      }
    }
  }
}

// Clean cache periodically (keep only the last 1000 entries)
export function cleanNotificationCache(): void {
  if (notifiedMRs.size > 1000) {
    const entries = Array.from(notifiedMRs);
    entries.slice(0, entries.length - 500).forEach((key) => notifiedMRs.delete(key));
  }
  if (notifiedPipelines.size > 1000) {
    const entries = Array.from(notifiedPipelines);
    entries.slice(0, entries.length - 500).forEach((key) => notifiedPipelines.delete(key));
  }
}

// Reset cache (useful for tests)
export function resetNotificationCache(): void {
  notifiedMRs.clear();
  notifiedPipelines.clear();
}
