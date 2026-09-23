import React, { useState, useEffect, useCallback } from 'react';
import type { Classroom, Student, AttendanceSession, AttendanceStatus } from '../types';
import { generateId } from '../utils';
import {
  Calendar,
  Play,
  Zap,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Users,
  Trash2,
} from 'lucide-react';

interface AttendanceViewProps {
  currentClass: Classroom;
  students: Student[];
  attendances: AttendanceSession[];
  onSaveAttendance: (session: AttendanceSession) => void;
  onDeleteAttendance: (attId: string) => void;
  onBack: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  currentClass,
  students,
  attendances,
  onSaveAttendance,
  onDeleteAttendance,
}) => {
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const [sessionDate, setSessionDate] = useState<string>(getTodayISO());

  const [isCalling, setIsCalling] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentRecords, setCurrentRecords] = useState<Record<string, AttendanceStatus>>({});
  const [mode, setMode] = useState<'sequential' | 'list'>('sequential');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [justAnsweredFeedback, setJustAnsweredFeedback] = useState<'present' | 'absent' | null>(null);

  // Sorted list of students
  const sortedStudents = [...students].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  // Format date: e.g. "22 de Setembro de 2026"
  const formatDateFormal = (iso: string) => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length < 3) return iso;
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

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
        initialMap[student.id] = 'present';
      }
    }

    setCurrentRecords(initialMap);
    setCurrentStepIndex(0);
    setMode(initialMode);
    setIsCalling(true);
  };

  const finishAttendance = useCallback((recordsToSave = currentRecords) => {
    const newSession: AttendanceSession = {
      id: generateId('att'),
      classId: currentClass.id,
      date: sessionDate,
      records: recordsToSave,
      completedAt: new Date().toISOString(),
    };
    onSaveAttendance(newSession);
    setIsCalling(false);
  }, [currentClass.id, sessionDate, currentRecords, onSaveAttendance]);

  const handleSequentialAnswer = useCallback((status: AttendanceStatus) => {
    const student = sortedStudents[currentStepIndex];
    if (!student) return;

    const updated = {
      ...currentRecords,
      [student.id]: status,
    };
    setCurrentRecords(updated);

    // Microinteraction feedback
    setJustAnsweredFeedback(status);
    setTimeout(() => setJustAnsweredFeedback(null), 180);

    if (currentStepIndex + 1 < sortedStudents.length) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      finishAttendance(updated);
    }
  }, [currentStepIndex, sortedStudents, currentRecords, finishAttendance]);

  // Keyboard navigation during sequential call
  useEffect(() => {
    if (!isCalling || mode !== 'sequential') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when focused in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'p' || e.key === 'P' || e.key === '1') {
        e.preventDefault();
        handleSequentialAnswer('present');
      } else if (e.key === 'f' || e.key === 'F' || e.key === '2') {
        e.preventDefault();
        handleSequentialAnswer('absent');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentStepIndex((prev) => Math.min(sortedStudents.length - 1, prev + 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsCalling(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCalling, mode, handleSequentialAnswer, sortedStudents.length]);

  const toggleStudentStatus = (studentId: string) => {
    const current = currentRecords[studentId] || 'present';
    const next: AttendanceStatus = current === 'present' ? 'absent' : 'present';
    setCurrentRecords({
      ...currentRecords,
      [studentId]: next,
    });
  };

  const currentStudent = sortedStudents[currentStepIndex];
  const presentCount = Object.values(currentRecords).filter((s) => s === 'present').length;
  const absentCount = Object.values(currentRecords).filter((s) => s === 'absent').length;

  return (
    <div className="view-content-wrapper animate-page-in">
      {!isCalling ? (
        <div className="attendance-landing-layout">
          <div className="view-header-row">
            <div>
              <h1 className="page-heading">Presença</h1>
              <p className="page-description">
                Chamada ágil e precisa · {currentClass.name}
              </p>
            </div>

            <div className="attendance-date-picker-box">
              <Calendar size={14} strokeWidth={2} />
              <input
                id="att-date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
          </div>

          {sortedStudents.length === 0 ? (
            <div className="clean-empty-state">
              <div className="clean-empty-icon">
                <Users size={32} strokeWidth={1.5} />
              </div>
              <h4>Nenhum aluno cadastrado para chamada</h4>
              <p>Cadastre alunos nesta turma antes de iniciar o registro de frequência.</p>
            </div>
          ) : (
            <div className="attendance-entry-modes">
              {/* Opção 1: Sequencial com foco */}
              <div className="attendance-mode-card featured">
                <div className="mode-badge-pill">Modo Principal</div>
                <h3 className="mode-card-title">Chamada Sequencial</h3>
                <p className="mode-card-desc">
                  Apresenta um aluno por vez na tela com botões rápidos <strong>Presente</strong> e <strong>Falta</strong>. Pressione <strong>P</strong> ou <strong>F</strong> no teclado para avançar instantaneamente.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-large"
                  onClick={() => startAttendance('sequential', false)}
                >
                  <Play size={14} strokeWidth={2.2} fill="currentColor" />
                  <span>Iniciar chamada ({formatDateFormal(sessionDate)})</span>
                </button>
              </div>

              {/* Opção 2: Marcar todos presentes */}
              <div className="attendance-mode-card">
                <div className="mode-badge-pill">Ultra Rápido</div>
                <h3 className="mode-card-title">Marcar todos como presentes</h3>
                <p className="mode-card-desc">
                  Ideal quando quase todos vieram. Todos começam como presentes e você só toca nos que faltaram.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-large"
                  onClick={() => startAttendance('list', true)}
                >
                  <Zap size={14} strokeWidth={2} />
                  <span>Marcar todos e revisar</span>
                </button>
              </div>
            </div>
          )}

          {/* Chamadas anteriores */}
          {attendances.filter((a) => a.classId === currentClass.id).length > 0 && (
            <div className="past-attendance-section">
              <h3 className="section-title">Chamadas anteriores</h3>
              <div className="past-attendance-list">
                {attendances
                  .filter((a) => a.classId === currentClass.id)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((session) => {
                    const presents = Object.values(session.records).filter((s) => s === 'present').length;
                    const absents = Object.values(session.records).filter((s) => s === 'absent').length;
                    return (
                      <div key={session.id} className="past-attendance-row">
                        <div className="past-date-cell">
                          <Calendar size={13} strokeWidth={2} />
                          <span>{formatDateFormal(session.date)}</span>
                        </div>
                        <div className="past-stats-cell">
                          <span className="mini-tag tag-present">
                            {presents} presentes
                          </span>
                          <span className="mini-tag tag-absent">
                            {absents} faltas
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn-text-action"
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
                        <button
                          type="button"
                          className="inline-delete-btn"
                          title="Excluir esta chamada"
                          onClick={() => setDeleteConfirmId(session.id)}
                        >
                          <Trash2 size={12} strokeWidth={2} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      ) : mode === 'sequential' && currentStudent ? (
        /* SEQUENTIAL CALL INTERFACE (PRECISION INSTRUMENT) */
        <div className="sequential-attendance-screen animate-page-in">
          <div className="sequential-top-bar">
            <div>
              <span className="seq-date-label">{formatDateFormal(sessionDate)}</span>
              <h2 className="seq-progress-counter">
                {currentStepIndex + 1} de {sortedStudents.length}
              </h2>
            </div>

            <div className="seq-controls-right">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setMode('list')}
              >
                <RotateCcw size={13} strokeWidth={2} />
                <span>Ver em lista</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsCalling(false)}
              >
                Pausar
              </button>
            </div>
          </div>

          <div className="seq-progress-track">
            <div
              className="seq-progress-fill"
              style={{
                width: `${((currentStepIndex + 1) / sortedStudents.length) * 100}%`,
              }}
            />
          </div>

          <div className={`sequential-card-focus ${justAnsweredFeedback ? `flash-${justAnsweredFeedback}` : ''}`}>
            <div className="sequential-avatar-circle">
              {currentStudent.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="sequential-target-name">{currentStudent.name}</h1>
            <p className="sequential-helper-tip">
              Toque ou use o teclado: <strong>[P]</strong> Presente · <strong>[F]</strong> Falta
            </p>

            <div className="sequential-dual-actions">
              <button
                type="button"
                className="seq-btn seq-btn-present"
                onClick={() => handleSequentialAnswer('present')}
              >
                <Check size={28} strokeWidth={2.5} />
                <span className="seq-btn-title">Presente</span>
                <span className="seq-btn-kbd">P</span>
              </button>

              <button
                type="button"
                className="seq-btn seq-btn-absent"
                onClick={() => handleSequentialAnswer('absent')}
              >
                <X size={28} strokeWidth={2.5} />
                <span className="seq-btn-title">Falta</span>
                <span className="seq-btn-kbd">F</span>
              </button>
            </div>
          </div>

          <div className="sequential-bottom-nav">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            >
              <ArrowLeft size={14} strokeWidth={2} />
              <span>Anterior</span>
            </button>

            <div className="seq-mini-summary">
              <span className="summary-pill green">
                <Check size={12} strokeWidth={2} />
                <span>{presentCount} presentes</span>
              </span>
              <span className="summary-pill red">
                <X size={12} strokeWidth={2} />
                <span>{absentCount} faltas</span>
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => finishAttendance()}
            >
              <span>Concluir presença</span>
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : (
        /* LIST / TOGGLE MODE SCREEN */
        <div className="list-attendance-screen animate-page-in">
          <div className="view-header-row">
            <div>
              <h1 className="page-heading">Presença — {formatDateFormal(sessionDate)}</h1>
              <p className="page-description">
                Toque no aluno para alternar entre <strong>Presente</strong> e <strong>Falta</strong>
              </p>
            </div>

            <div className="list-top-action-group">
              <div className="summary-badges-group">
                <span className="summary-pill green">
                  <Check size={12} strokeWidth={2} />
                  <span>{presentCount} presentes</span>
                </span>
                <span className="summary-pill red">
                  <X size={12} strokeWidth={2} />
                  <span>{absentCount} faltas</span>
                </span>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => finishAttendance()}
              >
                <Check size={14} strokeWidth={2.2} />
                <span>Concluir chamada</span>
              </button>
            </div>
          </div>

          <div className="toggle-students-grid-clean">
            {sortedStudents.map((student) => {
              const isPresent = (currentRecords[student.id] || 'present') === 'present';
              return (
                <button
                  key={student.id}
                  type="button"
                  className={`toggle-student-card ${isPresent ? 'is-present' : 'is-absent'}`}
                  onClick={() => toggleStudentStatus(student.id)}
                >
                  <div className="toggle-card-status-icon">
                    {isPresent ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      <X size={14} strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="toggle-card-body">
                    <span className="toggle-student-name">{student.name}</span>
                    <span className="toggle-status-label">
                      {isPresent ? 'Presente' : 'Falta'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="list-call-bottom-bar">
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
              <Check size={15} strokeWidth={2.2} />
              <span>Concluir e Salvar Chamada</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Confirmar exclusão de chamada */}
      {deleteConfirmId && (() => {
        const attToDelete = attendances.find((a) => a.id === deleteConfirmId);
        if (!attToDelete) return null;
        return (
          <div className="modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
            <div className="modal-box animate-modal-in" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Excluir chamada</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setDeleteConfirmId(null)}
                  title="Fechar"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
              <div className="modal-body-content">
                <p className="modal-helper-text">
                  Excluir a chamada do dia <strong>{formatDateFormal(attToDelete.date)}</strong>?
                </p>
                <p className="delete-warning-text">
                  Todos os registros de presença e faltas desta data serão removidos permanentemente.
                </p>
              </div>
              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    onDeleteAttendance(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                >
                  <Trash2 size={13} strokeWidth={2} />
                  <span>Excluir chamada</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
