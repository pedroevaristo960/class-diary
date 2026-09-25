import { useState, useEffect, useCallback } from 'react';
import type { OccurrenceRecord, CreateOccurrenceDTO } from '../../shared/types.js';
import { apiClient } from '../api/client.js';

export function useDiscipline(classId?: string | null) {
  const [occurrences, setOccurrences] = useState<OccurrenceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOccurrences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (classId) {
        const data = await apiClient.occurrences.listByClass(classId);
        setOccurrences(data);
      } else {
        const data = await apiClient.occurrences.getAll();
        setOccurrences(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar ocorrências');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchOccurrences();
  }, [fetchOccurrences]);

  const addOccurrence = async (dto: CreateOccurrenceDTO): Promise<OccurrenceRecord> => {
    const created = await apiClient.occurrences.create(dto);
    setOccurrences((prev) => [created, ...prev]);
    return created;
  };

  const deleteOccurrence = async (id: string): Promise<boolean> => {
    await apiClient.occurrences.delete(id);
    setOccurrences((prev) => prev.filter((o) => o.id !== id));
    return true;
  };

  return {
    occurrences,
    loading,
    error,
    refreshOccurrences: fetchOccurrences,
    addOccurrence,
    deleteOccurrence,
    setOccurrences,
  };
}
