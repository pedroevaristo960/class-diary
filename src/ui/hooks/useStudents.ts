import { useState, useEffect, useCallback } from 'react';
import type { Student, CreateStudentDTO } from '../../shared/types.js';
import { apiClient } from '../api/client.js';

export function useStudents(classId?: string | null) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (classId) {
        const data = await apiClient.students.listByClass(classId);
        setStudents(data);
      } else {
        const data = await apiClient.students.getAll();
        setStudents(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const addStudent = async (name: string, targetClassId?: string): Promise<Student> => {
    const cId = targetClassId || classId;
    if (!cId) throw new Error('Turma não selecionada');
    const created = await apiClient.students.create({ classId: cId, name });
    setStudents((prev) => [...prev, created]);
    return created;
  };

  const addMultipleStudents = async (names: string[], targetClassId?: string): Promise<Student[]> => {
    const cId = targetClassId || classId;
    if (!cId) throw new Error('Turma não selecionada');
    const createdList = await apiClient.students.createBatch({ classId: cId, names });
    setStudents((prev) => [...prev, ...createdList]);
    return createdList;
  };

  const updateStudent = async (id: string, data: Partial<CreateStudentDTO>): Promise<Student> => {
    const updated = await apiClient.students.update(id, data);
    setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const deleteStudent = async (id: string): Promise<boolean> => {
    await apiClient.students.delete(id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    return true;
  };

  return {
    students,
    loading,
    error,
    refreshStudents: fetchStudents,
    addStudent,
    addMultipleStudents,
    updateStudent,
    deleteStudent,
    setStudents,
  };
}
