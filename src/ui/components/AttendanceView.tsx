import React, { useState } from 'react';
import type { Classroom, Student, AttendanceSession, AttendanceStatus } from '../types';
import { generateId } from '../utils';

interface AttendanceViewProps {
  currentClass: Classroom;
  students: Student[];
  attendances: AttendanceSession[];
  onSaveAttendance: (session: AttendanceSession) => void;
  onBack: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  currentClass,
  students,
  attendances,
  onSaveAttendance,
  onBack,
}) => {
  // Default to today's date formatted
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const [sessionDate, setSessionDate] = useState<string>(getTodayISO());

  // Active call mode
  const [isCalling, setIsCalling] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentRecords, setCurrentRecords] = useState<Record<string, AttendanceStatus>>({});
  const [mode, setMode] = useState<'sequential' | 'list'>('sequential');

  // Sorted list of students
  const sortedStudents = [...students].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  // Format date for UI (DD/MM/AAAA)
  const formatDateBR = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  // Start new attendance call
  const startAttendance = (initialMode: 'sequential' | 'list', markAllPresent = false) => {
    const existing = attendances.find(
      (a) => a.classId === currentClass.id && a.date === sessionDate
    );

    const initialMap: Record<string, AttendanceStatus> = {};
    for (const student of sortedStudents) {
      if (existing && existing.records[student.id]) {
        initialMap[student.id] = existing.records[student.id];
      } else if (markAllPresent) {
        initialMap[student.id] = 'present';
      } else {
        initialMap[student.id] = 'present'; // default present if quick
      }
    }

    setCurrentRecords(initialMap);
    setCurrentStepIndex(0);
    setMode(initialMode);
    setIsCalling(true);
  };

  // Handle single student response in sequential mode
  const handleSequentialAnswer = (status: AttendanceStatus) => {
    const student = sortedStudents[currentStepIndex];
    if (!student) return;

    const updated = {
      ...currentRecords,
      [student.id]: status,
    };
    setCurrentRecords(updated);

    if (currentStepIndex + 1 < sortedStudents.length) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Reached the last student!
      finishAttendance(updated);
    }
  };

  // Toggle student status in list mode
  const toggleStudentStatus = (studentId: string) => {
    const current = currentRecords[studentId] || 'present';
    const next: AttendanceStatus = current === 'present' ? 'absent' : 'present';
    setCurrentRecords({
      ...currentRecords,
      [studentId]: next,
    });
  };

  // Save attendance
  const finishAttendance = (recordsToSave = currentRecords) => {
    const newSession: AttendanceSession = {
      id: generateId('att'),
      classId: currentClass.id,
      date: sessionDate,
      records: recordsToSave,
      completedAt: new Date().toISOString(),
    };
    onSaveAttendance(newSession);
    setIsCalling(false);
  };

  const currentStudent = sortedStudents[currentStepIndex];

  // Stats for the current records
  const presentCount = Object.values(currentRecords).filter((s) => s === 'present').length;
  const absentCount = Object.values(currentRecords).filter((s) => s === 'absent').length;

  return (
    <div className="view-container animate-fade-in">
      <div className="top-navigation">
        <button type="button" className="back-button" onClick={onBack}>
          ← {currentClass.name}
        </button>
      </div>

      {!isCalling ? (
        <div className="attendance-landing animate-fade-in">
          <div className="view-header-action-row">
            <div>
              <h1 className="view-page-title">Presença</h1>
              <p className="view-page-subtitle">
                Chamada simplificada: apenas toque e avance
              </p>
            </div>

            <div className="date-picker-wrap">
              <label htmlFor="att-date">Data da chamada:</label>
              <input
                id="att-date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
          </div>

          {sortedStudents.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon">⚠️</div>
              <h3>Nenhum aluno nesta turma</h3>
              <p>Cadastre alunos antes de iniciar a lista de chamada.</p>
            </div>
          ) : (
            <div className="attendance-modes-container">
              {/* Option 1: Sequential Calling */}
              <div className="call-card-hero">
                <div className="call-card-badge">Opção 1 — Mais Dinâmica</div>
                <h2>Chamada Sequencial</h2>
                <p>
                  Mostra um aluno por vez na tela com botões grandes <strong>Presente</strong> e <strong>Falta</strong>. Tocou, passa automaticamente para o próximo.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-xl"
                  onClick={() => startAttendance('sequential', false)}
                >
                  ▶ Iniciar Chamada ({formatDateBR(sessionDate)})
                </button>
              </div>

              {/* Option 2: Mark all present and toggle absents */}
              <div className="call-card-secondary">
                <div className="call-card-badge">Opção 2 — Ultra Rápida</div>
                <h2>Marcar Todos Presentes</h2>
                <p>
                  Ideal quando quase todos vieram. Todos iniciam como presentes e você só toca nos que faltaram.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-lg"
                  onClick={() => startAttendance('list', true)}
                >
                  ⚡ Marcar todos e revisar faltas
                </button>
              </div>
            </div>
          )}

          {/* Past attendance history for this class */}
          {attendances.length > 0 && (
            <div className="past-sessions-section">
              <h3 className="section-subtitle">Chamadas anteriores registradas</h3>
              <div className="past-sessions-grid">
                {attendances
                  .filter((a) => a.classId === currentClass.id)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((session) => {
                    const presents = Object.values(session.records).filter(
                      (s) => s === 'present'
                    ).length;
                    const absents = Object.values(session.records).filter(
                      (s) => s === 'absent'
                    ).length;
                    return (
                      <div key={session.id} className="past-session-card">
                        <div className="session-date-tag">
                          📅 {formatDateBR(session.date)}
                        </div>
                        <div className="session-stats-pills">
                          <span className="stat-pill present">
                            🟢 {presents} presentes
                          </span>
                          <span className="stat-pill absent">
                            🔴 {absents} faltas
                          </span>
                        </div>
                        <button
                          type="button"
                          className="text-link-btn"
                          onClick={() => {
                            setSessionDate(session.date);
                            setCurrentRecords(session.records);
                            setCurrentStepIndex(0);
                            setMode('list');
                            setIsCalling(true);
                          }}
                        >
                          Revisar chamada →
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      ) : mode === 'sequential' && currentStudent ? (
        /* SEQUENTIAL CALL SCREEN */
        <div className="sequential-call-screen animate-fade-in">
          <div className="call-progress-header">
            <span className="call-session-title">
              Presença — {formatDateBR(sessionDate)}
            </span>
            <span className="call-counter-badge">
              {currentStepIndex + 1} de {sortedStudents.length}
            </span>
          </div>

          <div className="call-progress-track">
            <div
              className="call-progress-bar"
              style={{
                width: `${((currentStepIndex + 1) / sortedStudents.length) * 100}%`,
              }}
            />
          </div>

          <div className="sequential-student-card">
            <div className="student-big-avatar">
              {currentStudent.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="sequential-student-name">{currentStudent.name}</h2>
            <p className="sequential-hint">Toque para registrar e avançar</p>

            <div className="sequential-actions-row">
              <button
                type="button"
                className="big-action-btn present-btn"
                onClick={() => handleSequentialAnswer('present')}
              >
                <span className="action-circle">🟢</span>
                <span className="action-label">Presente</span>
              </button>

              <button
                type="button"
                className="big-action-btn absent-btn"
                onClick={() => handleSequentialAnswer('absent')}
              >
                <span className="action-circle">🔴</span>
                <span className="action-label">Falta</span>
              </button>
            </div>
          </div>

          <div className="call-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
            >
              ← Aluno anterior
            </button>

            <button
              type="button"
              className="text-link-btn"
              onClick={() => setMode('list')}
            >
              Alternar para visão em lista
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => finishAttendance()}
            >
              Concluir presença ({presentCount}P / {absentCount}F)
            </button>
          </div>
        </div>
      ) : (
        /* LIST / TOGGLE MODE SCREEN */
        <div className="list-call-screen animate-fade-in">
          <div className="view-header-action-row">
            <div>
              <h1 className="view-page-title">
                Presença — {formatDateBR(sessionDate)}
              </h1>
              <p className="view-page-subtitle">
                Toque no aluno para alternar entre <strong>Presente</strong> e <strong>Falta</strong>
              </p>
            </div>

            <div className="summary-pills-row">
              <span className="stat-pill present">
                🟢 {presentCount} Presentes
              </span>
              <span className="stat-pill absent">
                🔴 {absentCount} Faltas
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => finishAttendance()}
              >
                Concluir presença ✓
              </button>
            </div>
          </div>

          <div className="toggle-students-grid">
            {sortedStudents.map((student) => {
              const isPresent = (currentRecords[student.id] || 'present') === 'present';
              return (
                <button
                  key={student.id}
                  type="button"
                  className={`student-toggle-card ${isPresent ? 'is-present' : 'is-absent'}`}
                  onClick={() => toggleStudentStatus(student.id)}
                >
                  <div className="toggle-indicator">
                    {isPresent ? '🟢' : '🔴'}
                  </div>
                  <div className="toggle-name">{student.name}</div>
                  <div className="toggle-badge">
                    {isPresent ? 'Presente' : 'Falta'}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="list-call-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCalling(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-large"
              onClick={() => finishAttendance()}
            >
              Concluir presença ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
