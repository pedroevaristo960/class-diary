import { useState, useEffect } from 'react';
import type {
  AppData,
  Classroom,
  Screen,
  AttendanceSession,
  EvaluationItem,
  ParticipationRecord,
  OccurrenceRecord,
  Period,
} from './types';
import { loadAppData, saveAppData } from './storage';
import { generateId } from './utils';
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

  // Auto-save whenever data state updates
  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const currentClass = data.classes.find((c) => c.id === currentClassId);

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
  };

  // 2. Add single student
  const handleAddStudent = (name: string) => {
    if (!currentClassId) return;
    const newStudent = {
      id: generateId('std'),
      classId: currentClassId,
      name,
      active: true,
    };
    setData((prev) => ({
      ...prev,
      students: [...prev.students, newStudent],
    }));
  };

  // 3. Add multiple students (batch fast entry)
  const handleAddMultipleStudents = (names: string[]) => {
    if (!currentClassId || names.length === 0) return;
    const newStudents = names.map((name) => ({
      id: generateId('std'),
      classId: currentClassId,
      name,
      active: true,
    }));
    setData((prev) => ({
      ...prev,
      students: [...prev.students, ...newStudents],
    }));
  };

  // 4. Delete student
  const handleDeleteStudent = (studentId: string) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== studentId),
    }));
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
  };

  // 7. Add participation
  const handleAddParticipation = (record: ParticipationRecord) => {
    setData((prev) => ({
      ...prev,
      participations: [...prev.participations, record],
    }));
  };

  // 8. Add occurrence / discipline
  const handleAddOccurrence = (record: OccurrenceRecord) => {
    setData((prev) => ({
      ...prev,
      occurrences: [...prev.occurrences, record],
    }));
  };

  // Students for currently selected class
  const classStudents = currentClassId
    ? data.students.filter((s) => s.classId === currentClassId)
    : [];

  return (
    <div className="app-layout">
      {/* SCREEN 1: CLASSES */}
      {currentScreen === 'classes' && (
        <ClassSelector
          classes={data.classes}
          onSelectClass={(cls) => {
            setCurrentClassId(cls.id);
            setCurrentScreen('class_menu');
          }}
          onCreateClass={handleCreateClass}
        />
      )}

      {/* SCREEN 2: CLASS MENU */}
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
        />
      )}
    </div>
  );
}

export default App;
