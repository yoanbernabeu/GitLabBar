import { useState, useEffect, useCallback } from 'react';

type Theme = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

interface UseThemeResult {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => Promise<void>;
}

export function useTheme(): UseThemeResult {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  const resolveTheme = useCallback((theme: Theme): ResolvedTheme => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, []);

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    setResolvedTheme(resolveTheme(newTheme));
    await window.gitlabbar.config.set('theme', newTheme);
  }, [resolveTheme]);

  useEffect(() => {
    // Charger le thème initial
    const loadTheme = async () => {
      const savedTheme = await window.gitlabbar.config.get('theme');
      setThemeState(savedTheme);
      setResolvedTheme(resolveTheme(savedTheme));
    };

    loadTheme();

    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        setResolvedTheme(resolveTheme('system'));
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, resolveTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
  };
}
