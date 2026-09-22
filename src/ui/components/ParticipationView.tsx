import React, { useState } from 'react';
import type { Classroom, Student, ParticipationRecord, ParticipationType } from '../types';
import { generateId } from '../utils';

interface ParticipationViewProps {
  currentClass: Classroom;
  students: Student[];
  participations: ParticipationRecord[];
  onAddParticipation: (record: ParticipationRecord) => void;
  onBack: () => void;
}

export const ParticipationView: React.FC<ParticipationViewProps> = ({
  currentClass,
  students,
  participations,
  onAddParticipation,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  // Filter students based on search term
  const sortedStudents = [...students].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  const filteredStudents = sortedStudents.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const handleRegisterParticipation = (student: Student, type: ParticipationType) => {
    const record: ParticipationRecord = {
      id: generateId('part'),
      classId: currentClass.id,
      studentId: student.id,
      date: todayStr,
      type,
      timestamp: new Date().toISOString(),
    };

    onAddParticipation(record);

    // Subtle feedback flash
    const msg = type === 'positive' 
      ? `+ Participação registrada para ${student.name}` 
      : `− Não participou registrado para ${student.name}`;
    setLastFeedback(msg);
    setTimeout(() => {
      setLastFeedback(null);
    }, 2500);
  };

  // Student's participation counts for this class
  const getStudentStats = (studentId: string) => {
    const studentParts = participations.filter(
      (p) => p.classId === currentClass.id && p.studentId === studentId
    );
    const positive = studentParts.filter((p) => p.type === 'positive').length;
    const negative = studentParts.filter((p) => p.type === 'negative').length;
    return { positive, negative };
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
          <h1 className="view-page-title">Participação em Aula</h1>
          <p className="view-page-subtitle">
            Toque rápido para registrar a resposta do aluno sem interromper a aula
          </p>
        </div>
      </div>

      {lastFeedback && (
        <div className="feedback-toast animate-slide-down">
          {lastFeedback}
        </div>
      )}

      {/* Quick Search */}
      <div className="search-bar-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Buscar aluno por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearchTerm('')}
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick touch grid */}
      <div className="participation-grid">
        {filteredStudents.map((student) => {
          const stats = getStudentStats(student.id);
          return (
            <div key={student.id} className="participation-card">
              <div className="part-student-main">
                <span className="part-avatar">{student.name.charAt(0)}</span>
                <div className="part-name-block">
                  <span className="part-student-name">{student.name}</span>
                  <div className="part-mini-badges">
                    <span className="badge-pos">+{stats.positive}</span>
                    <span className="badge-neg">−{stats.negative}</span>
                  </div>
                </div>
              </div>

              <div className="part-actions-buttons">
                <button
                  type="button"
                  className="btn-part-pos"
                  onClick={() => handleRegisterParticipation(student, 'positive')}
                  title="Registrar participação positiva"
                >
                  <span className="part-btn-symbol">+</span>
                  <span>Participou</span>
                </button>

                <button
                  type="button"
                  className="btn-part-neg"
                  onClick={() => handleRegisterParticipation(student, 'negative')}
                  title="Registrar não participou"
                >
                  <span className="part-btn-symbol">−</span>
                  <span>Não participou</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
