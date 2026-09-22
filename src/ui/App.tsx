import { useState, useEffect, useCallback } from 'react';
import type {
  AppData,
  Classroom,
  Student,
  Screen,
  AttendanceSession,
  EvaluationItem,
  ParticipationRecord,
  OccurrenceRecord,
  Period,
} from './types';
import { loadAppData, saveAppData } from './storage';
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

  // Auto-save whenever data state updates
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
  const handleCreateClass = (newClassData: {
    name: string;
    course: string;
    grade: string;
    period: Period;
  }) => {
    const newClass: Classroom = {
      id: generateId('class'),
      ...newClassData,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      classes: [...prev.classes, newClass],
    }));
    addToast('Turma criada com sucesso!', 'success');
  };

  // 2. Add single student
  const handleAddStudent = (name: string) => {
    if (!currentClassId) return;
    const newStudent: Student = {
      id: generateId('std'),
      classId: currentClassId,
      name,
      active: true,
    };
    setData((prev) => ({
      ...prev,
      students: [...prev.students, newStudent],
    }));
    addToast('✓ Aluno adicionado', 'success');
  };

  // 3. Add multiple students (batch fast entry)
  const handleAddMultipleStudents = (names: string[]) => {
    if (!currentClassId || names.length === 0) return;
    const newStudents: Student[] = names.map((name) => ({
      id: generateId('std'),
      classId: currentClassId,
      name,
      active: true,
    }));
    setData((prev) => ({
      ...prev,
      students: [...prev.students, ...newStudents],
    }));
    addToast(`✓ ${names.length} alunos adicionados`, 'success');
  };

  // 4. Delete student
  const handleDeleteStudent = (studentId: string) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== studentId),
    }));
    addToast('Aluno removido', 'info');
  };

  // 5. Save attendance
  const handleSaveAttendance = (session: AttendanceSession) => {
    setData((prev) => {
      const existingIdx = prev.attendances.findIndex(
        (a) => a.classId === session.classId && a.date === session.date
      );
      if (existingIdx >= 0) {
        const copy = [...prev.attendances];
        copy[existingIdx] = session;
        return { ...prev, attendances: copy };
      }
      return { ...prev, attendances: [...prev.attendances, session] };
    });
    addToast('✓ Presença registrada', 'success');
  };

  // 6. Save evaluation
  const handleSaveEvaluation = (evaluation: EvaluationItem) => {
    setData((prev) => {
      const existingIdx = prev.evaluations.findIndex((e) => e.id === evaluation.id);
      if (existingIdx >= 0) {
        const copy = [...prev.evaluations];
        copy[existingIdx] = evaluation;
        return { ...prev, evaluations: copy };
      }
      return { ...prev, evaluations: [...prev.evaluations, evaluation] };
    });
    addToast('✓ Avaliação salva', 'success');
  };

  // 7. Add participation
  const handleAddParticipation = (record: ParticipationRecord) => {
    setData((prev) => ({
      ...prev,
      participations: [...prev.participations, record],
    }));
    addToast('✓ Participação registrada', 'success');
  };

  // 8. Add occurrence / discipline
  const handleAddOccurrence = (record: OccurrenceRecord) => {
    setData((prev) => ({
      ...prev,
      occurrences: [...prev.occurrences, record],
    }));
    addToast('✓ Ocorrência registrada', 'warning');
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
