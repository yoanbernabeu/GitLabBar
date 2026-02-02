import React, { useState } from 'react';
import { AccountsTab } from './AccountsTab';
import { ProjectsTab } from './ProjectsTab';
import { NotificationsTab } from './NotificationsTab';
import { GeneralTab } from './GeneralTab';

type TabType = 'accounts' | 'projects' | 'notifications' | 'general';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'accounts', label: 'Comptes', icon: '👤' },
  { id: 'projects', label: 'Projets', icon: '📁' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'general', label: 'Général', icon: '⚙️' },
];

export const PreferencesWindow: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('accounts');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'accounts':
        return <AccountsTab />;
      case 'projects':
        return <ProjectsTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'general':
        return <GeneralTab />;
      default:
        return null;
    }
  };

  return (
    <div className="preferences-container">
      {/* Titlebar draggable */}
      <div className="preferences-titlebar">
        <h1>Préférences</h1>
      </div>

      {/* Sidebar */}
      <div className="preferences-sidebar">
        <nav className="preferences-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`preferences-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="preferences-nav-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="preferences-main">
        <div className="preferences-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
