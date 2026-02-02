import React from 'react';
import { Pipeline, PipelineStatus } from '../../../shared/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PipelineItemProps {
  pipeline: Pipeline;
  onClick?: () => void;
}

const STATUS_ICONS: Record<string, string> = {
  running: '⏳',
  success: '✓',
  failed: '✕',
  pending: '○',
  created: '○',
  canceled: '⊘',
  skipped: '↷',
  manual: '▶',
  scheduled: '⏰',
};

const STATUS_CLASSES: Record<string, string> = {
  running: 'running',
  success: 'success',
  failed: 'failed',
  pending: 'pending',
  created: 'pending',
  canceled: 'pending',
  skipped: 'pending',
  manual: 'pending',
  scheduled: 'pending',
};

export const PipelineItem: React.FC<PipelineItemProps> = ({ pipeline, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.gitlabbar.app.openExternal(pipeline.webUrl);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(pipeline.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  const statusClass = STATUS_CLASSES[pipeline.status] || 'pending';
  const statusIcon = STATUS_ICONS[pipeline.status] || '○';

  return (
    <div className="pipeline-item" onClick={handleClick}>
      <div className={`pipeline-status-icon ${statusClass}`}>
        {statusIcon}
      </div>
      <div className="pipeline-content">
        <div className="pipeline-project">
          {pipeline.projectPath || pipeline.projectName}
        </div>
        <div className="pipeline-meta">
          <span>{pipeline.ref}</span>
          <span>•</span>
          <span>#{pipeline.id}</span>
          <span>•</span>
          <span>{timeAgo}</span>
          {pipeline.duration && (
            <>
              <span>•</span>
              <span>{formatDuration(pipeline.duration)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
