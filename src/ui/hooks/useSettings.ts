import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '../../shared/types.js';
import { apiClient } from '../api/client.js';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.settings.getAll();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key: string, value: string): Promise<void> => {
    await apiClient.settings.set(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateMultipleSettings = async (newSettings: Record<string, string>): Promise<AppSettings> => {
    const updated = await apiClient.settings.update(newSettings);
    setSettings(updated);
    return updated;
  };

  return {
    settings,
    loading,
    error,
    refreshSettings: fetchSettings,
    updateSetting,
    updateMultipleSettings,
  };
}
