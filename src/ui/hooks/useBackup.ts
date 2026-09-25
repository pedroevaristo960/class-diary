import { useState, useCallback } from 'react';
import { apiClient } from '../api/client.js';

export function useBackup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDbPath = useCallback(async (): Promise<string> => {
    return apiClient.backup.getPath();
  }, []);

  const exportBackup = async (targetPath: string) => {
    setLoading(true);
    setError(null);
    try {
      return await apiClient.backup.export(targetPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao exportar backup';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const importBackup = async (sourcePath: string) => {
    setLoading(true);
    setError(null);
    try {
      return await apiClient.backup.import(sourcePath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao importar backup';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getDbPath,
    exportBackup,
    importBackup,
  };
}
