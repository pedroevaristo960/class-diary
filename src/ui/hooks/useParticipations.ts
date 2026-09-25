import { useState, useEffect, useCallback } from 'react';
import type { ParticipationRecord, CreateParticipationDTO } from '../../shared/types.js';
import { apiClient } from '../api/client.js';

export function useParticipations(classId?: string | null) {
  const [participations, setParticipations] = useState<ParticipationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (classId) {
        const data = await apiClient.participations.listByClass(classId);
        setParticipations(data);
      } else {
        const data = await apiClient.participations.getAll();
        setParticipations(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar participações');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchParticipations();
  }, [fetchParticipations]);

  const addParticipation = async (dto: CreateParticipationDTO): Promise<ParticipationRecord> => {
    const created = await apiClient.participations.create(dto);
    setParticipations((prev) => [created, ...prev]);
    return created;
  };

  const deleteParticipation = async (id: string): Promise<boolean> => {
    await apiClient.participations.delete(id);
    setParticipations((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  return {
    participations,
    loading,
    error,
    refreshParticipations: fetchParticipations,
    addParticipation,
    deleteParticipation,
    setParticipations,
  };
}
