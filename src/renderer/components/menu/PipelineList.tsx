import React from 'react';
import { Pipeline } from '../../../shared/types';
import { PipelineItem } from './PipelineItem';

interface PipelineListProps {
  pipelines: Pipeline[];
}

export const PipelineList: React.FC<PipelineListProps> = ({ pipelines }) => {
  if (pipelines.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🚀</div>
        <div className="empty-state-title">Aucune Pipeline</div>
        <div className="empty-state-description">
          Configurez des projets à surveiller dans les préférences
        </div>
      </div>
    );
  }

  // Grouper par status
  const runningPipelines = pipelines.filter((p) => p.status === 'running');
  const failedPipelines = pipelines.filter((p) => p.status === 'failed');
  const otherPipelines = pipelines.filter(
    (p) => p.status !== 'running' && p.status !== 'failed'
  );

  return (
    <div className="pipeline-list">
      {runningPipelines.length > 0 && (
        <div className="mr-group">
          <div className="mr-group-header">
            En cours
            <span className="mr-group-count">({runningPipelines.length})</span>
          </div>
          {runningPipelines.map((pipeline) => (
            <PipelineItem key={pipeline.id} pipeline={pipeline} />
          ))}
        </div>
      )}

      {failedPipelines.length > 0 && (
        <div className="mr-group">
          <div className="mr-group-header">
            Échouées
            <span className="mr-group-count">({failedPipelines.length})</span>
          </div>
          {failedPipelines.map((pipeline) => (
            <PipelineItem key={pipeline.id} pipeline={pipeline} />
          ))}
        </div>
      )}

      {otherPipelines.length > 0 && (
        <div className="mr-group">
          <div className="mr-group-header">
            Autres
            <span className="mr-group-count">({otherPipelines.length})</span>
          </div>
          {otherPipelines.slice(0, 10).map((pipeline) => (
            <PipelineItem key={pipeline.id} pipeline={pipeline} />
          ))}
        </div>
      )}
    </div>
  );
};
