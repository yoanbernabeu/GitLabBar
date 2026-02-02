import React, { useState, useEffect } from 'react';

export const GeneralTab: React.FC = () => {
  const [refreshInterval, setRefreshInterval] = useState(60000);
  const [launchAtStartup, setLaunchAtStartup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await window.gitlabbar.config.getAll();
        setRefreshInterval(config.refreshInterval);
        setLaunchAtStartup(config.launchAtStartup);
      } catch (error) {
        console.error('Error loading config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleRefreshIntervalChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setRefreshInterval(value);
    await window.gitlabbar.config.set('refreshInterval', value);
  };

  const handleLaunchAtStartupToggle = async () => {
    const newValue = !launchAtStartup;
    setLaunchAtStartup(newValue);
    await window.gitlabbar.config.set('launchAtStartup', newValue);
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        Loading...
      </div>
    );
  }

  return (
    <div className="preferences-section">
      <h2 className="preferences-section-title">General</h2>
      <p className="preferences-section-description">
        General application settings.
      </p>

      {/* Refresh interval */}
      <div className="form-group">
        <label className="form-label">Refresh interval</label>
        <select
          className="form-select"
          value={refreshInterval}
          onChange={handleRefreshIntervalChange}
        >
          <option value={30000}>30 seconds</option>
          <option value={60000}>1 minute</option>
          <option value={120000}>2 minutes</option>
          <option value={300000}>5 minutes</option>
          <option value={600000}>10 minutes</option>
        </select>
        <p className="form-hint">
          How often GitLabBar checks for new data
        </p>
      </div>

      {/* Auto-start */}
      <div className="toggle-group" style={{ marginTop: '24px' }}>
        <div>
          <div className="toggle-label">Launch at startup</div>
          <div className="toggle-description">
            Open GitLabBar automatically when you log in
          </div>
        </div>
        <button
          className={`toggle-switch ${launchAtStartup ? 'active' : ''}`}
          onClick={handleLaunchAtStartupToggle}
        />
      </div>

      {/* Information */}
      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--color-border-light)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>About</h3>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <p style={{ marginBottom: '8px' }}>
            <strong>GitLabBar</strong> - Menu bar app for GitLab
          </p>
          <p style={{ marginBottom: '8px' }}>Version 1.0.0</p>
          <p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.gitlabbar.app.openExternal('https://github.com/yoanbernabeu/GitLabBar');
              }}
              style={{ color: 'var(--color-accent)' }}
            >
              GitHub Repository
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
