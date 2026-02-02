import React from 'react';
import { MergeRequest } from '../../../shared/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MergeRequestItemProps {
  mr: MergeRequest;
  onClick?: () => void;
}

export const MergeRequestItem: React.FC<MergeRequestItemProps> = ({ mr, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.gitlabbar.app.openExternal(mr.webUrl);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(mr.updatedAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div className="mr-item" onClick={handleClick}>
      <img
        src={mr.author.avatar_url}
        alt={mr.author.name}
        className="mr-avatar"
      />
      <div className="mr-content">
        <div className={`mr-title ${mr.draft ? 'draft' : ''}`}>
          {mr.draft && <span>WIP: </span>}
          {mr.title}
        </div>
        <div className="mr-meta">
          <span className="mr-project">{mr.projectPath || mr.projectName}</span>
          <span className="mr-branch">
            <span>→</span>
            <span>{mr.targetBranch}</span>
          </span>
          <span>{timeAgo}</span>
        </div>
      </div>
      <div className="mr-status">
        {mr.hasConflicts && (
          <span className="status-dot conflict" title="Conflits à résoudre" />
        )}
        {!mr.hasConflicts && mr.mergeStatus === 'can_be_merged' && (
          <span className="status-dot ready" title="Prête à fusionner" />
        )}
      </div>
    </div>
  );
};
