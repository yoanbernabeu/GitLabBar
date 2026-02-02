import React, { useState, useEffect, useCallback } from 'react';
import { useAccounts } from '../../hooks/useAccounts';

interface Project {
  id: number;
  name: string;
  name_with_namespace: string;
  path_with_namespace: string;
}

export const ProjectsTab: React.FC = () => {
  const { accounts } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [watchedProjectIds, setWatchedProjectIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const activeAccounts = accounts.filter((a) => a.isActive);

  // Load watched projects
  useEffect(() => {
    const loadWatchedProjects = async () => {
      const ids = await window.gitlabbar.config.get('watchedProjectIds');
      setWatchedProjectIds(ids);
    };
    loadWatchedProjects();
  }, []);

  // Select first account by default
  useEffect(() => {
    if (activeAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(activeAccounts[0].id);
    }
  }, [activeAccounts, selectedAccountId]);

  // Search projects
  const searchProjects = useCallback(async () => {
    if (!selectedAccountId || searchQuery.length < 2) {
      setProjects([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await window.gitlabbar.gitlab.searchProjects(selectedAccountId, searchQuery);
      setProjects(results as Project[]);
    } catch (error) {
      console.error('Error during search:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId, searchQuery]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(searchProjects, 300);
    return () => clearTimeout(timeout);
  }, [searchProjects]);

  const toggleProject = async (projectId: number) => {
    let newIds: number[];
    if (watchedProjectIds.includes(projectId)) {
      newIds = watchedProjectIds.filter((id) => id !== projectId);
    } else {
      newIds = [...watchedProjectIds, projectId];
    }

    setWatchedProjectIds(newIds);
    await window.gitlabbar.config.set('watchedProjectIds', newIds);
  };

  const removeWatchedProject = async (projectId: number) => {
    const newIds = watchedProjectIds.filter((id) => id !== projectId);
    setWatchedProjectIds(newIds);
    await window.gitlabbar.config.set('watchedProjectIds', newIds);
  };

  return (
    <div className="preferences-section">
      <h2 className="preferences-section-title">Watched projects</h2>
      <p className="preferences-section-description">
        Select projects whose pipelines you want to monitor.
      </p>

      {activeAccounts.length === 0 ? (
        <div className="message message-error">
          No active account. Please add a GitLab account first.
        </div>
      ) : (
        <>
          {/* Account selector */}
          {activeAccounts.length > 1 && (
            <div className="form-group">
              <label className="form-label">Account</label>
              <select
                className="form-select"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({new URL(account.instanceUrl).hostname})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Project search */}
          <div className="form-group">
            <label className="form-label">Search for a project</label>
            <div className="search-input-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="form-input search-input"
                placeholder="Project name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Search results */}
          {searchQuery.length >= 2 && (
            <div className="projects-tree">
              {isLoading ? (
                <div className="loading">
                  <div className="loading-spinner" />
                  Searching...
                </div>
              ) : projects.length === 0 ? (
                <div className="empty-state" style={{ height: 'auto', padding: '20px' }}>
                  No projects found
                </div>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="project-tree-item">
                    <input
                      type="checkbox"
                      className="project-checkbox"
                      checked={watchedProjectIds.includes(project.id)}
                      onChange={() => toggleProject(project.id)}
                    />
                    <span className="project-name">{project.path_with_namespace}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Watched projects */}
          {watchedProjectIds.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>
                Watched projects ({watchedProjectIds.length})
              </h3>
              <div className="projects-tree">
                {watchedProjectIds.map((id) => (
                  <div key={id} className="project-tree-item">
                    <span className="project-name">Project #{id}</span>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => removeWatchedProject(id)}
                      style={{ marginLeft: 'auto' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
