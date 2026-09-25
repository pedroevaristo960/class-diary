import { useState, useEffect, useCallback } from 'react';
import type {
  AppData,
  Screen,
  AttendanceSession,
  EvaluationItem,
  ParticipationRecord,
  OccurrenceRecord,
  Period,
} from './types';
import { apiClient } from './api/client';
import { loadAppData, loadAppDataAsync, saveAppData } from './storage';
import { generateId } from './utils';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { ToastContainer, type ToastMessage, type ToastType } from './components/Toast';
import { CommandPalette } from './components/CommandPalette';
import { ClassSelector } from './components/ClassSelector';
import { ClassMenu } from './components/ClassMenu';
import { StudentsView } from './components/StudentsView';
import { AttendanceView } from './components/AttendanceView';
import { EvaluationView } from './components/EvaluationView';
import { ParticipationView } from './components/ParticipationView';
import { DisciplineView } from './components/DisciplineView';
import { StudentHistoryView } from './components/StudentHistoryView';
import { ReportsView } from './components/ReportsView';
import './App.css';

export function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [currentScreen, setCurrentScreen] = useState<Screen>('classes');
  const [currentClassId, setCurrentClassId] = useState<string | null>(null);
  const [historyStudentId, setHistoryStudentId] = useState<string | undefined>(undefined);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load latest data from SQLite on startup
  useEffect(() => {
    loadAppDataAsync().then((freshData) => {
      if (freshData) {
        setData(freshData);
      }
    }).catch((err) => {
      console.error('Failed to load fresh SQLite data:', err);
    });
  }, []);

  // Sync cache
  useEffect(() => {
    saveAppData(data);
  }, [data]);

  // Toast dispatch helper
  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = generateId('toast');
    const newToast: ToastMessage = { id, type, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Global keyboard shortcut: Ctrl+K / Cmd+K for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentClass = data.classes.find((c) => c.id === currentClassId) || null;

  // 1. Create Class
  const handleCreateClass = async (newClassData: {
    name: string;
    course: string;
    grade: string;
    period: Period;
  }) => {
    try {
      const created = await apiClient.classes.create(newClassData);
      setData((prev) => ({
        ...prev,
        classes: [...prev.classes, created],
      }));
      addToast('Turma criada com sucesso!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao criar turma', 'danger');
    }
  };

  // Delete class (cascade: remove all related data)
  const handleDeleteClass = async (classId: string) => {
    try {
      await apiClient.classes.delete(classId);
      setData((prev) => ({
        ...prev,
        classes: prev.classes.filter((c) => c.id !== classId),
        students: prev.students.filter((s) => s.classId !== classId),
        attendances: prev.attendances.filter((a) => a.classId !== classId),
        evaluations: prev.evaluations.filter((e) => e.classId !== classId),
        participations: prev.participations.filter((p) => p.classId !== classId),
        occurrences: prev.occurrences.filter((o) => o.classId !== classId),
      }));
      if (currentClassId === classId) {
        setCurrentClassId(null);
        setCurrentScreen('classes');
      }
      addToast('Turma excluída', 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao excluir turma', 'danger');
    }
  };

  // 2. Add single student
  const handleAddStudent = async (name: string) => {
    if (!currentClassId) return;
    try {
      const created = await apiClient.students.create({
        classId: currentClassId,
        name,
      });
      setData((prev) => ({
        ...prev,
        students: [...prev.students, created],
      }));
      addToast('✓ Aluno adicionado', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao adicionar aluno', 'danger');
    }
  };

  // 3. Add multiple students (batch fast entry)
  const handleAddMultipleStudents = async (names: string[]) => {
    if (!currentClassId || names.length === 0) return;
    try {
      const createdList = await apiClient.students.createBatch({
        classId: currentClassId,
        names,
      });
      setData((prev) => ({
        ...prev,
        students: [...prev.students, ...createdList],
      }));
      addToast(`✓ ${createdList.length} alunos adicionados`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao adicionar alunos', 'danger');
    }
  };

  // 4. Delete student
  const handleDeleteStudent = async (studentId: string) => {
    try {
      await apiClient.students.delete(studentId);
      setData((prev) => ({
        ...prev,
        students: prev.students.filter((s) => s.id !== studentId),
      }));
      addToast('Aluno removido', 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao remover aluno', 'danger');
    }
  };

  // 5. Save attendance
  const handleSaveAttendance = async (session: AttendanceSession) => {
    try {
      const saved = await apiClient.attendance.save(session);
      setData((prev) => {
        const existingIdx = prev.attendances.findIndex(
          (a) => a.classId === saved.classId && a.date === saved.date
        );
        if (existingIdx >= 0) {
          const copy = [...prev.attendances];
          copy[existingIdx] = saved;
          return { ...prev, attendances: copy };
        }
        return { ...prev, attendances: [...prev.attendances, saved] };
      });
      addToast('✓ Presença registrada', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao registrar presença', 'danger');
    }
  };

  // 6. Save evaluation
  const handleSaveEvaluation = async (evaluation: EvaluationItem) => {
    try {
      const saved = await apiClient.evaluations.save(evaluation);
      setData((prev) => {
        const existingIdx = prev.evaluations.findIndex((e) => e.id === saved.id);
        if (existingIdx >= 0) {
          const copy = [...prev.evaluations];
          copy[existingIdx] = saved;
          return { ...prev, evaluations: copy };
        }
        return { ...prev, evaluations: [...prev.evaluations, saved] };
      });
      addToast('✓ Avaliação salva', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao salvar avaliação', 'danger');
    }
  };

  // Delete evaluation
  const handleDeleteEvaluation = async (evalId: string) => {
    try {
      await apiClient.evaluations.delete(evalId);
      setData((prev) => ({
        ...prev,
        evaluations: prev.evaluations.filter((e) => e.id !== evalId),
      }));
      addToast('Avaliação excluída', 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao excluir avaliação', 'danger');
    }
  };

  // 7. Add participation
  const handleAddParticipation = async (record: ParticipationRecord) => {
    try {
      const created = await apiClient.participations.create(record);
      setData((prev) => ({
        ...prev,
        participations: [...prev.participations, created],
      }));
      addToast('✓ Participação registrada', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao registrar participação', 'danger');
    }
  };

  // Delete participation
  const handleDeleteParticipation = async (partId: string) => {
    try {
      await apiClient.participations.delete(partId);
      setData((prev) => ({
        ...prev,
        participations: prev.participations.filter((p) => p.id !== partId),
      }));
      addToast('Participação removida', 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao remover participação', 'danger');
    }
  };

  // 8. Add occurrence / discipline
  const handleAddOccurrence = async (record: OccurrenceRecord) => {
    try {
      const created = await apiClient.occurrences.create(record);
      setData((prev) => ({
        ...prev,
        occurrences: [...prev.occurrences, created],
      }));
      addToast('✓ Ocorrência registrada', 'warning');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao registrar ocorrência', 'danger');
    }
  };

  // Delete occurrence
  const handleDeleteOccurrence = async (occId: string) => {
    try {
      await apiClient.occurrences.delete(occId);
      setData((prev) => ({
        ...prev,
        occurrences: prev.occurrences.filter((o) => o.id !== occId),
      }));
      addToast('Ocorrência removida', 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao remover ocorrência', 'danger');
    }
  };

  // Delete attendance session
  const handleDeleteAttendance = async (attId: string) => {
    try {
      await apiClient.attendance.delete(attId);
      setData((prev) => ({
        ...prev,
        attendances: prev.attendances.filter((a) => a.id !== attId),
      }));
      addToast('Sessão de presença excluída', 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao excluir presença', 'danger');
    }
  };

  // Students for currently selected class
  const classStudents = currentClassId
    ? data.students.filter((s) => s.classId === currentClassId)
    : [];

  return (
    <div className="desktop-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        currentScreen={currentScreen}
        currentClass={currentClass}
        classes={data.classes}
        onSelectScreen={(screen) => setCurrentScreen(screen)}
        onSelectClass={(cls) => {
          setCurrentClassId(cls.id);
          setCurrentScreen('class_menu');
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <div className="desktop-main">
        <Topbar
          currentScreen={currentScreen}
          currentClass={currentClass}
          onNavigateClasses={() => {
            setCurrentClassId(null);
            setCurrentScreen('classes');
          }}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main className="desktop-content">
          {/* SCREEN 1: TURMAS */}
          {currentScreen === 'classes' && (
            <ClassSelector
              classes={data.classes}
              students={data.students}
              onSelectClass={(cls) => {
                setCurrentClassId(cls.id);
                setCurrentScreen('class_menu');
              }}
              onCreateClass={handleCreateClass}
              onDeleteClass={handleDeleteClass}
            />
          )}

          {/* SCREEN 2: DENTRO DA TURMA (VISÃO GERAL / ACTION HUB) */}
          {currentScreen === 'class_menu' && currentClass && (
            <ClassMenu
              currentClass={currentClass}
              studentsCount={classStudents.length}
              onNavigate={(screen) => setCurrentScreen(screen)}
              onBackToClasses={() => {
                setCurrentClassId(null);
                setCurrentScreen('classes');
              }}
            />
          )}

          {/* SCREEN 3: ALUNOS */}
          {currentScreen === 'students' && currentClass && (
            <StudentsView
              currentClass={currentClass}
              students={classStudents}
              onAddStudent={handleAddStudent}
              onAddMultipleStudents={handleAddMultipleStudents}
              onDeleteStudent={handleDeleteStudent}
              onSelectStudentForHistory={(student) => {
                setHistoryStudentId(student.id);
                setCurrentScreen('history');
              }}
              onBack={() => setCurrentScreen('class_menu')}
            />
          )}

          {/* SCREEN 4: PRESENÇA */}
          {currentScreen === 'attendance' && currentClass && (
            <AttendanceView
              currentClass={currentClass}
              students={classStudents}
              attendances={data.attendances}
              onSaveAttendance={handleSaveAttendance}
              onDeleteAttendance={handleDeleteAttendance}
              onBack={() => setCurrentScreen('class_menu')}
            />
          )}

          {/* SCREEN 5: AVALIAÇÕES */}
          {currentScreen === 'evaluations' && currentClass && (
            <EvaluationView
              currentClass={currentClass}
              students={classStudents}
              evaluations={data.evaluations}
              onSaveEvaluation={handleSaveEvaluation}
              onDeleteEvaluation={handleDeleteEvaluation}
              onBack={() => setCurrentScreen('class_menu')}
            />
          )}

          {/* SCREEN 6: PARTICIPAÇÃO */}
          {currentScreen === 'participation' && currentClass && (
            <ParticipationView
              currentClass={currentClass}
              students={classStudents}
              participations={data.participations}
              onAddParticipation={handleAddParticipation}
              onDeleteParticipation={handleDeleteParticipation}
              onBack={() => setCurrentScreen('class_menu')}
            />
          )}

          {/* SCREEN 7: INDISCIPLINA */}
          {currentScreen === 'discipline' && currentClass && (
            <DisciplineView
              currentClass={currentClass}
              students={classStudents}
              occurrences={data.occurrences}
              onAddOccurrence={handleAddOccurrence}
              onDeleteOccurrence={handleDeleteOccurrence}
              onBack={() => setCurrentScreen('class_menu')}
            />
          )}

          {/* SCREEN 8: HISTÓRICO */}
          {currentScreen === 'history' && currentClass && (
            <StudentHistoryView
              currentClass={currentClass}
              students={classStudents}
              attendances={data.attendances}
              evaluations={data.evaluations}
              participations={data.participations}
              occurrences={data.occurrences}
              initialStudentId={historyStudentId}
              onBack={() => setCurrentScreen('class_menu')}
            />
          )}

          {/* SCREEN 9: RELATÓRIOS / PDF */}
          {currentScreen === 'reports' && currentClass && (
            <ReportsView
              currentClass={currentClass}
              students={classStudents}
              attendances={data.attendances}
              evaluations={data.evaluations}
              participations={data.participations}
              occurrences={data.occurrences}
              onBack={() => setCurrentScreen('class_menu')}
              onToast={addToast}
            />
          )}

          {/* Fallback if a class-dependent screen is opened with no class selected */}
          {currentScreen !== 'classes' && !currentClass && (
            <div className="view-content-wrapper animate-page-in">
              <div className="empty-state-card">
                <h3>Nenhuma turma selecionada</h3>
                <p>Por favor, selecione uma turma na tela inicial para acessar esta área.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCurrentScreen('classes')}
                >
                  Ir para Turmas
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        classes={data.classes}
        students={data.students}
        currentClass={currentClass}
        onSelectClass={(cls) => {
          setCurrentClassId(cls.id);
          setCurrentScreen('class_menu');
        }}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onSelectStudent={(std) => {
          const parentClass = data.classes.find((c) => c.id === std.classId);
          if (parentClass) {
            setCurrentClassId(parentClass.id);
          }
          setHistoryStudentId(std.id);
          setCurrentScreen('history');
        }}
      />

      {/* Toast Feedback Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default App;
