import { useState, useEffect, useCallback } from 'react';
import type { AttendanceSession, SaveAttendanceDTO } from '../../shared/types.js';
import { apiClient } from '../api/client.js';

export function useAttendance(classId?: string | null) {
  const [attendances, setAttendances] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (classId) {
        const data = await apiClient.attendance.listByClass(classId);
        setAttendances(data);
      } else {
        const data = await apiClient.attendance.getAll();
        setAttendances(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar presenças');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  const saveAttendance = async (dto: SaveAttendanceDTO): Promise<AttendanceSession> => {
    const saved = await apiClient.attendance.save(dto);
    setAttendances((prev) => {
      const idx = prev.findIndex((a) => a.classId === saved.classId && a.date === saved.date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const deleteAttendance = async (id: string): Promise<boolean> => {
    await apiClient.attendance.delete(id);
    setAttendances((prev) => prev.filter((a) => a.id !== id));
    return true;
  };

  return {
    attendances,
    loading,
    error,
    refreshAttendances: fetchAttendances,
    saveAttendance,
    deleteAttendance,
    setAttendances,
  };
}
