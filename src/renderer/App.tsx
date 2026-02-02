import React, { useEffect, useState } from 'react';
import { MenuContainer } from './components/menu/MenuContainer';
import { PreferencesWindow } from './components/preferences/PreferencesWindow';
import './styles/global.css';
import './styles/menu.css';
import './styles/preferences.css';

type ViewType = 'menu' | 'preferences';

export const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('menu');

  useEffect(() => {
    // Déterminer la vue en fonction du hash de l'URL
    const determineView = () => {
      const hash = window.location.hash;
      if (hash === '#preferences') {
        setView('preferences');
      } else {
        setView('menu');
      }
    };

    determineView();

    // Écouter les changements de hash
    window.addEventListener('hashchange', determineView);
    return () => window.removeEventListener('hashchange', determineView);
  }, []);

  return view === 'preferences' ? <PreferencesWindow /> : <MenuContainer />;
};
