import React, { useState } from 'react';
import type { Classroom, Student, OccurrenceRecord, OccurrenceReason } from '../types';
import { generateId } from '../utils';

interface DisciplineViewProps {
  currentClass: Classroom;
  students: Student[];
  occurrences: OccurrenceRecord[];
  onAddOccurrence: (record: OccurrenceRecord) => void;
  onBack: () => void;
}

export const DisciplineView: React.FC<DisciplineViewProps> = ({
  currentClass,
  students,
  occurrences,
  onAddOccurrence,
  onBack,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<OccurrenceReason>('Conversa');
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const reasons: OccurrenceReason[] = [
    'Conversa',
    'Atraso',
    'Uso indevido do telefone',
    'Perturbação',
    'Outro',
  ];

  const sortedStudents = [...students].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    const student = sortedStudents.find((s) => s.id === selectedStudentId);
    if (!student) return;

    const record: OccurrenceRecord = {
      id: generateId('occ'),
      classId: currentClass.id,
      studentId: student.id,
      date: new Date().toISOString().split('T')[0],
      reason: selectedReason,
      note: note.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    onAddOccurrence(record);

    setFeedback(`Ocorrência registrada para ${student.name} (${selectedReason})`);
    setNote('');
    setSelectedStudentId('');
    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  const classOccurrences = occurrences
    .filter((o) => o.classId === currentClass.id)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const getStudentName = (id: string) => {
    const s = students.find((st) => st.id === id);
    return s ? s.name : 'Aluno';
  };

  return (
    <div className="view-container animate-fade-in">
      <div className="top-navigation">
        <button type="button" className="back-button" onClick={onBack}>
          ← {currentClass.name}
        </button>
      </div>

      <div className="view-header-action-row">
        <div>
          <h1 className="view-page-title">Indisciplina</h1>
          <p className="view-page-subtitle">
            Registro ultra-rápido de ocorrências em sala
          </p>
        </div>
      </div>

      {feedback && (
        <div className="feedback-toast toast-warning animate-slide-down">
          ⚠️ {feedback}
        </div>
      )}

      {/* Direct fast-entry panel */}
      <form onSubmit={handleRegister} className="discipline-form-card">
        <h3>1. Escolha o Aluno:</h3>
        <div className="student-chips-container">
          {sortedStudents.map((student) => (
            <button
              key={student.id}
              type="button"
              className={`student-chip-btn ${selectedStudentId === student.id ? 'active' : ''}`}
              onClick={() => setSelectedStudentId(student.id)}
            >
              {student.name}
            </button>
          ))}
        </div>

        <h3 style={{ marginTop: '1.5rem' }}>2. Escolha o Motivo:</h3>
        <div className="reason-chips-container">
          {reasons.map((reason) => (
            <button
              key={reason}
              type="button"
              className={`reason-chip-btn ${selectedReason === reason ? 'active' : ''}`}
              onClick={() => setSelectedReason(reason)}
            >
              {reason === 'Conversa' && '🗣️ '}
              {reason === 'Atraso' && '⏰ '}
              {reason === 'Uso indevido do telefone' && '📱 '}
              {reason === 'Perturbação' && '⚡ '}
              {reason === 'Outro' && '📝 '}
              {reason}
            </button>
          ))}
        </div>

        {selectedReason === 'Outro' && (
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="discipline-note">Detalhes adicionais (opcional):</label>
            <input
              id="discipline-note"
              type="text"
              placeholder="Ex: Não trouxe o material, recusa a fazer atividade..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="note-input"
            />
          </div>
        )}

        <div className="discipline-submit-row">
          <button
            type="submit"
            className="btn btn-primary btn-large btn-danger-accent"
            disabled={!selectedStudentId}
          >
            Registar Ocorrência ✓
          </button>
        </div>
      </form>

      {/* Recent occurrences list */}
      <div className="past-occurrences-section">
        <h3 className="section-subtitle">Ocorrências Recentes desta Turma</h3>
        {classOccurrences.length === 0 ? (
          <p className="empty-inline-text">Nenhuma ocorrência registrada nesta turma. Excelente!</p>
        ) : (
          <div className="occurrences-history-list">
            {classOccurrences.map((occ) => (
              <div key={occ.id} className="occurrence-item-card">
                <div className="occ-header">
                  <strong className="occ-student">{getStudentName(occ.studentId)}</strong>
                  <span className="occ-badge">{occ.reason}</span>
                </div>
                <div className="occ-meta">
                  <span>📅 {occ.date}</span>
                  {occ.note && <span className="occ-note"> • {occ.note}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
