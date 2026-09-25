import { useState, useEffect, useCallback } from 'react';
import type { EvaluationItem, SaveEvaluationDTO } from '../../shared/types.js';
import { apiClient } from '../api/client.js';

export function useEvaluations(classId?: string | null) {
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (classId) {
        const data = await apiClient.evaluations.listByClass(classId);
        setEvaluations(data);
      } else {
        const data = await apiClient.evaluations.getAll();
        setEvaluations(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  const saveEvaluation = async (dto: SaveEvaluationDTO): Promise<EvaluationItem> => {
    const saved = await apiClient.evaluations.save(dto);
    setEvaluations((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const deleteEvaluation = async (id: string): Promise<boolean> => {
    await apiClient.evaluations.delete(id);
    setEvaluations((prev) => prev.filter((e) => e.id !== id));
    return true;
  };

  return {
    evaluations,
    loading,
    error,
    refreshEvaluations: fetchEvaluations,
    saveEvaluation,
    deleteEvaluation,
    setEvaluations,
  };
}
