import React, { useState } from 'react';
import type { Classroom, Student, ParticipationRecord, ParticipationType } from '../types';
import { generateId } from '../utils';
import {
  Search,
  Plus,
  Minus,
  X,
  Users,
  Trash2,
} from 'lucide-react';

interface ParticipationViewProps {
  currentClass: Classroom;
  students: Student[];
  participations: ParticipationRecord[];
  onAddParticipation: (record: ParticipationRecord) => void;
  onDeleteParticipation: (partId: string) => void;
  onBack: () => void;
}

export const ParticipationView: React.FC<ParticipationViewProps> = ({
  currentClass,
  students,
  participations,
  onAddParticipation,
  onDeleteParticipation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const sortedStudents = [...students].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  const filteredStudents = sortedStudents.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const handleRegister = (student: Student, type: ParticipationType) => {
    const record: ParticipationRecord = {
      id: generateId('part'),
      classId: currentClass.id,
      studentId: student.id,
      date: todayStr,
      type,
      timestamp: new Date().toISOString(),
    };
    onAddParticipation(record);
  };

  const getStudentStats = (studentId: string) => {
    const studentParts = participations.filter(
      (p) => p.classId === currentClass.id && p.studentId === studentId
    );
    const pos = studentParts.filter((p) => p.type === 'positive').length;
    const neg = studentParts.filter((p) => p.type === 'negative').length;
    return { pos, neg };
  };

  // Get the latest participation record for a student (to allow undo)
  const getLastParticipation = (studentId: string) => {
    const studentParts = participations
      .filter((p) => p.classId === currentClass.id && p.studentId === studentId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return studentParts[0] || null;
  };

  return (
    <div className="view-content-wrapper animate-page-in">
      <div className="view-header-row">
        <div>
          <h1 className="page-heading">Participação</h1>
          <p className="page-description">
            Registro rápido em 1 toque durante a aula · {currentClass.name}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="notion-search-bar">
        <Search size={15} strokeWidth={2} className="notion-search-icon" />
        <input
          type="text"
          placeholder="Pesquisar aluno por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="notion-search-input"
        />
        {searchTerm && (
          <button
            type="button"
            className="notion-search-clear"
            onClick={() => setSearchTerm('')}
            title="Limpar pesquisa"
          >
            <X size={13} strokeWidth={2} />
          </button>
        )}
      </div>

      {sortedStudents.length === 0 ? (
        <div className="clean-empty-state">
          <div className="clean-empty-icon">
            <Users size={32} strokeWidth={1.5} />
          </div>
          <h4>Nenhum aluno nesta turma</h4>
          <p>Cadastre alunos antes de registrar participações.</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="clean-empty-state">
          <p>Nenhum aluno encontrado para &quot;{searchTerm}&quot;</p>
        </div>
      ) : (
        <div className="participation-cards-grid-clean">
          {filteredStudents.map((student) => {
            const { pos, neg } = getStudentStats(student.id);
            const lastPart = getLastParticipation(student.id);
            return (
              <div key={student.id} className="participation-item-card">
                <div className="part-card-left">
                  <div className="part-avatar-badge">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="part-card-info">
                    <span className="part-name-title">{student.name}</span>
                    <div className="part-score-badges">
                      <span className="tag-part-pos">+{pos}</span>
                      <span className="tag-part-neg">−{neg}</span>
                    </div>
                  </div>
                </div>

                <div className="part-card-buttons">
                  <button
                    type="button"
                    className="part-btn-positive"
                    onClick={() => handleRegister(student, 'positive')}
                    title="Registrar participação positiva (+)"
                  > <br />
                    <Plus size={13} strokeWidth={2.5} />
                    <span>Participou</span>
                  </button>

                  <button
                    type="button"
                    className="part-btn-negative"
                    onClick={() => handleRegister(student, 'negative')}
                    title="Registrar não participou (-)"
                  >
                    <Minus size={13} strokeWidth={2.5} />
                    <br />
                    <span>Não participou</span>
                  </button>

                  {lastPart && (
                    <button
                      type="button"
                      className="part-btn-undo"
                      onClick={() => onDeleteParticipation(lastPart.id)}
                      title="Desfazer último registro"
                    >
                      <Trash2 size={11} strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
