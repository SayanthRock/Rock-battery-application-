/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ThemeMode, AppPreferences } from '../types';
import { DataStore, DEFAULT_PREFERENCES } from '../services/dataStore';

export function usePreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>(() => {
    return DataStore.getPreferences();
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  // Subscribe to DataStore updates (handles storage events and cross-tab broadcasts)
  useEffect(() => {
    const unsubscribe = DataStore.subscribe((latest) => {
      setPreferences(latest);
    });
    return unsubscribe;
  }, []);

  // Handle system color scheme & theme resolution
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      if (preferences.theme === 'system') {
        const isDark = mediaQuery.matches;
        setResolvedTheme(isDark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', isDark);
      } else {
        const isDark = preferences.theme === 'dark';
        setResolvedTheme(preferences.theme);
        document.documentElement.classList.toggle('dark', isDark);
      }
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [preferences.theme]);

  // Handle system reduced motion
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      setSystemReducedMotion(motionQuery.matches);
    };

    updateMotion();
    motionQuery.addEventListener('change', updateMotion);
    return () => motionQuery.removeEventListener('change', updateMotion);
  }, []);

  const effectiveReducedMotion =
    preferences.reducedMotion === 'reduce'
      ? true
      : preferences.reducedMotion === 'no-preference'
      ? false
      : systemReducedMotion;

  const updatePreference = <K extends keyof AppPreferences>(
    key: K,
    value: AppPreferences[K]
  ) => {
    DataStore.updatePreference(key, value);
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  return {
    preferences,
    updatePreference,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    effectiveReducedMotion,
  };
}
