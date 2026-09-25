import { useState, useEffect, useCallback } from 'react';
import type { Classroom, CreateClassDTO, UpdateClassDTO } from '../../shared/types.js';
import { apiClient } from '../api/client.js';

export function useClasses() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.classes.list();
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar turmas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const createClass = async (dto: CreateClassDTO): Promise<Classroom> => {
    const created = await apiClient.classes.create(dto);
    setClasses((prev) => [...prev, created]);
    return created;
  };

  const updateClass = async (id: string, dto: UpdateClassDTO): Promise<Classroom> => {
    const updated = await apiClient.classes.update(id, dto);
    setClasses((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteClass = async (id: string): Promise<boolean> => {
    await apiClient.classes.delete(id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
    return true;
  };

  return {
    classes,
    loading,
    error,
    refreshClasses: fetchClasses,
    createClass,
    updateClass,
    deleteClass,
    setClasses,
  };
}
