import React, { useState, useEffect } from 'react';
import { NotificationConfig } from '../../../shared/types';

export const NotificationsTab: React.FC = () => {
  const [config, setConfig] = useState<NotificationConfig>({
    enabled: true,
    newMRAssigned: true,
    mrMentioned: true,
    pipelineStarted: false,
    pipelineFailed: true,
    pipelineSuccess: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const notifications = await window.gitlabbar.config.get('notifications');
        setConfig(notifications);
      } catch (error) {
        console.error('Error loading config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleToggle = async (key: keyof NotificationConfig) => {
    const newConfig = { ...config, [key]: !config[key] };
    setConfig(newConfig);
    await window.gitlabbar.config.set('notifications', newConfig);
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
      <h2 className="preferences-section-title">Notifications</h2>
      <p className="preferences-section-description">
        Configure the notifications you want to receive.
      </p>

      {/* Main toggle */}
      <div className="toggle-group" style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border-light)' }}>
        <div>
          <div className="toggle-label" style={{ fontWeight: 600 }}>Enable notifications</div>
          <div className="toggle-description">Enable or disable all notifications</div>
        </div>
        <button
          className={`toggle-switch ${config.enabled ? 'active' : ''}`}
          onClick={() => handleToggle('enabled')}
        />
      </div>

      <div style={{ opacity: config.enabled ? 1 : 0.5, pointerEvents: config.enabled ? 'auto' : 'none' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Merge Requests</h3>

        <div className="toggle-group">
          <div>
            <div className="toggle-label">New MR assigned</div>
            <div className="toggle-description">Notification when an MR is assigned to you</div>
          </div>
          <button
            className={`toggle-switch ${config.newMRAssigned ? 'active' : ''}`}
            onClick={() => handleToggle('newMRAssigned')}
          />
        </div>

        <div className="toggle-group">
          <div>
            <div className="toggle-label">Mentioned in an MR</div>
            <div className="toggle-description">Notification when you are mentioned</div>
          </div>
          <button
            className={`toggle-switch ${config.mrMentioned ? 'active' : ''}`}
            onClick={() => handleToggle('mrMentioned')}
          />
        </div>

        <h3 style={{ fontSize: '14px', fontWeight: 600, marginTop: '24px', marginBottom: '16px' }}>Pipelines</h3>

        <div className="toggle-group">
          <div>
            <div className="toggle-label">Pipeline started</div>
            <div className="toggle-description">Notification when a pipeline starts</div>
          </div>
          <button
            className={`toggle-switch ${config.pipelineStarted ? 'active' : ''}`}
            onClick={() => handleToggle('pipelineStarted')}
          />
        </div>

        <div className="toggle-group">
          <div>
            <div className="toggle-label">Pipeline failed</div>
            <div className="toggle-description">Notification when a pipeline fails</div>
          </div>
          <button
            className={`toggle-switch ${config.pipelineFailed ? 'active' : ''}`}
            onClick={() => handleToggle('pipelineFailed')}
          />
        </div>

        <div className="toggle-group">
          <div>
            <div className="toggle-label">Pipeline succeeded</div>
            <div className="toggle-description">Notification when a pipeline succeeds</div>
          </div>
          <button
            className={`toggle-switch ${config.pipelineSuccess ? 'active' : ''}`}
            onClick={() => handleToggle('pipelineSuccess')}
          />
        </div>
      </div>
    </div>
  );
};
