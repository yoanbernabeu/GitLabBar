import React from 'react';
import { MergeRequest, UserRole } from '../../../shared/types';
import { MergeRequestItem } from './MergeRequestItem';
import { groupMergeRequestsByRole } from '../../hooks/useGitLabData';

interface MergeRequestListProps {
  mergeRequests: MergeRequest[];
}

const ROLE_LABELS: Record<UserRole, string> = {
  reviewer: 'À reviewer',
  assignee: 'Assignées à moi',
  author: 'Créées par moi',
  mentioned: 'Mentionné',
};

const ROLE_ORDER: UserRole[] = ['reviewer', 'assignee', 'author', 'mentioned'];

export const MergeRequestList: React.FC<MergeRequestListProps> = ({ mergeRequests }) => {
  if (mergeRequests.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <div className="empty-state-title">Aucune Merge Request</div>
        <div className="empty-state-description">
          Vous n'avez pas de MR en attente pour le moment
        </div>
      </div>
    );
  }

  const groups = groupMergeRequestsByRole(mergeRequests);

  return (
    <div className="mr-list">
      {ROLE_ORDER.map((role) => {
        const mrs = groups[role];
        if (mrs.length === 0) return null;

        return (
          <div key={role} className="mr-group">
            <div className="mr-group-header">
              {ROLE_LABELS[role]}
              <span className="mr-group-count">({mrs.length})</span>
            </div>
            {mrs.map((mr) => (
              <MergeRequestItem key={mr.id} mr={mr} />
            ))}
          </div>
        );
      })}
    </div>
  );
};
