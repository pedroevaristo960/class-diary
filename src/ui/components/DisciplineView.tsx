import React, { useState } from 'react';
import type { Classroom, Student, OccurrenceRecord, OccurrenceReason } from '../types';
import { generateId } from '../utils';
import {
  AlertTriangle,
  MessageSquare,
  Clock,
  Smartphone,
  Zap,
  FileEdit,
  Calendar,
  Check,
} from 'lucide-react';

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
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<OccurrenceReason>('Conversa');
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const reasonList: Array<{ reason: OccurrenceReason; icon: React.ReactNode }> = [
    { reason: 'Conversa', icon: <MessageSquare size={13} strokeWidth={2} /> },
    { reason: 'Atraso', icon: <Clock size={13} strokeWidth={2} /> },
    { reason: 'Uso indevido do telefone', icon: <Smartphone size={13} strokeWidth={2} /> },
    { reason: 'Perturbação', icon: <Zap size={13} strokeWidth={2} /> },
    { reason: 'Outro', icon: <FileEdit size={13} strokeWidth={2} /> },
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
      date: dateVal,
      reason: selectedReason,
      note: note.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    onAddOccurrence(record);
    setNote('');
    setSelectedStudentId('');
  };

  const classOccurrences = occurrences
    .filter((o) => o.classId === currentClass.id)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const getStudentName = (id: string) => {
    const s = students.find((st) => st.id === id);
    return s ? s.name : 'Aluno';
  };

  return (
    <div className="view-content-wrapper animate-page-in">
      <div className="view-header-row">
        <div>
          <h1 className="page-heading">Indisciplina</h1>
          <p className="page-description">
            Registro rápido de ocorrências em sala de aula · {currentClass.name}
          </p>
        </div>
      </div>

      <div className="discipline-two-col-layout">
        {/* Form Card */}
        <form onSubmit={handleRegister} className="discipline-clean-card">
          <div className="discipline-step-block">
            <span className="discipline-step-title">1. Selecione o Aluno</span>
            <div className="student-chips-flow">
              {sortedStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  className={`discipline-chip ${selectedStudentId === student.id ? 'active' : ''}`}
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  {student.name}
                </button>
              ))}
            </div>
          </div>

          <div className="discipline-step-block">
            <span className="discipline-step-title">2. Selecione o Motivo</span>
            <div className="reason-chips-flow">
              {reasonList.map(({ reason, icon }) => (
                <button
                  key={reason}
                  type="button"
                  className={`reason-chip ${selectedReason === reason ? 'active' : ''}`}
                  onClick={() => setSelectedReason(reason)}
                >
                  {icon}
                  <span>{reason}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="discipline-step-block">
            <div className="form-field-row">
              <div className="form-field" style={{ width: '180px' }}>
                <label htmlFor="occ-date-input">Data</label>
                <input
                  id="occ-date-input"
                  type="date"
                  value={dateVal}
                  onChange={(e) => setDateVal(e.target.value)}
                  required
                />
              </div>

              <div className="form-field flex-1">
                <label htmlFor="discipline-note-input">Observação (opcional)</label>
                <input
                  id="discipline-note-input"
                  type="text"
                  placeholder="Ex: Não realizou a tarefa, distraiu a turma..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="discipline-actions-row">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedStudentId}
            >
              <Check size={14} strokeWidth={2.2} />
              <span>Registrar ocorrência</span>
            </button>
          </div>
        </form>

        {/* Recent occurrences list */}
        <div className="discipline-recent-panel">
          <h3 className="section-title">Ocorrências da turma</h3>
          {classOccurrences.length === 0 ? (
            <div className="clean-empty-state-compact">
              <p>Nenhuma ocorrência registrada nesta turma.</p>
            </div>
          ) : (
            <div className="occurrences-linear-list">
              {classOccurrences.map((occ) => (
                <div key={occ.id} className="occ-linear-row">
                  <div className="occ-row-main">
                    <span className="occ-row-student">{getStudentName(occ.studentId)}</span>
                    <span className="occ-row-badge">
                      <AlertTriangle size={11} strokeWidth={2} />
                      <span>{occ.reason}</span>
                    </span>
                  </div>
                  <div className="occ-row-sub">
                    <span className="occ-date-text">
                      <Calendar size={11} strokeWidth={2} style={{ display: 'inline', marginRight: '3px' }} />
                      {occ.date}
                    </span>
                    {occ.note && <span className="occ-note-text">· {occ.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
