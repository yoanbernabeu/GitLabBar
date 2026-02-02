import React, { useState } from 'react';
import { useGitLabData } from '../../hooks/useGitLabData';
import { MergeRequestList } from './MergeRequestList';
import { PipelineList } from './PipelineList';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type TabType = 'mrs' | 'pipelines';

export const MenuContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('mrs');
  const { mergeRequests, pipelines, lastUpdated, isLoading, refresh } = useGitLabData();

  const reviewCount = mergeRequests.filter((mr) => mr.userRole === 'reviewer').length;
  const runningPipelinesCount = pipelines.filter((p) => p.status === 'running').length;

  const handleRefresh = async () => {
    await refresh();
  };

  const handleOpenPreferences = () => {
    window.gitlabbar.app.showPreferences();
    window.gitlabbar.app.hideMenu();
  };

  const handleQuit = () => {
    window.gitlabbar.app.quit();
  };

  const lastUpdatedText = lastUpdated
    ? format(lastUpdated, "'Mis à jour' 'à' HH:mm", { locale: fr })
    : 'Jamais mis à jour';

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1>GitLabBar</h1>
        <div className="menu-header-actions">
          <button
            className={`icon-button ${isLoading ? 'spinning' : ''}`}
            onClick={handleRefresh}
            disabled={isLoading}
            title="Rafraîchir"
          >
            ↻
          </button>
          <button
            className="icon-button"
            onClick={handleOpenPreferences}
            title="Préférences"
          >
            ⚙
          </button>
        </div>
      </div>

      <div className="menu-tabs">
        <button
          className={`menu-tab ${activeTab === 'mrs' ? 'active' : ''}`}
          onClick={() => setActiveTab('mrs')}
        >
          Merge Requests
          {reviewCount > 0 && <span className="tab-badge">{reviewCount}</span>}
        </button>
        <button
          className={`menu-tab ${activeTab === 'pipelines' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipelines')}
        >
          Pipelines
          {runningPipelinesCount > 0 && (
            <span className="tab-badge">{runningPipelinesCount}</span>
          )}
        </button>
      </div>

      <div className="menu-content">
        {activeTab === 'mrs' ? (
          <MergeRequestList mergeRequests={mergeRequests} />
        ) : (
          <PipelineList pipelines={pipelines} />
        )}
      </div>

      <div className="menu-footer">
        <span>{lastUpdatedText}</span>
        <div className="menu-footer-actions">
          <button className="menu-footer-link" onClick={handleOpenPreferences}>
            Préférences
          </button>
          <button className="menu-footer-link" onClick={handleQuit}>
            Quitter
          </button>
        </div>
      </div>
    </div>
  );
};
