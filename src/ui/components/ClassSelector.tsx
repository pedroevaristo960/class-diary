import React, { useState } from 'react';
import type { Classroom, Student, Period } from '../types';
import { Plus, X, ArrowRight, Clock, Users, Trash2 } from 'lucide-react';

interface ClassSelectorProps {
  classes: Classroom[];
  students: Student[];
  onSelectClass: (c: Classroom) => void;
  onCreateClass: (data: { name: string; course: string; grade: string; period: Period }) => void;
  onDeleteClass: (classId: string) => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
  classes,
  students,
  onSelectClass,
  onCreateClass,
  onDeleteClass,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [grade, setGrade] = useState('');
  const [period, setPeriod] = useState<Period>('Manhã');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onCreateClass({
      name: trimmedName,
      course: course.trim() || 'Geral',
      grade: grade.trim() || '1ª',
      period,
    });

    setName('');
    setCourse('');
    setGrade('');
    setPeriod('Manhã');
    setIsModalOpen(false);
  };

  const getStudentCount = (classId: string) => {
    return students.filter((s) => s.classId === classId).length;
  };

  const classToDelete = deleteConfirmId
    ? classes.find((c) => c.id === deleteConfirmId)
    : null;

  return (
    <div className="view-content-wrapper animate-page-in">
      <div className="view-header-row">
        <div>
          <h1 className="page-heading">Turmas</h1>
          <p className="page-description">Selecione uma turma para continuar.</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={15} strokeWidth={2.2} />
          <span>Criar turma</span>
        </button>
      </div>

      <div className="class-cards-grid">
        {classes.map((cls) => {
          const count = getStudentCount(cls.id);
          return (
            <div
              key={cls.id}
              className="class-card-item"
              onClick={() => onSelectClass(cls)}
            >
              <div className="class-card-top-row">
                <span className="class-badge-pill">
                  <Clock size={11} strokeWidth={2} />
                  <span>{cls.period}</span>
                </span>
                <span className="class-student-count-badge">
                  <Users size={12} strokeWidth={2} />
                  <span>{count} {count === 1 ? 'aluno' : 'alunos'}</span>
                </span>
              </div>

              <h2 className="class-item-name">{cls.name}</h2>
              <div className="class-item-details">
                <span>{cls.course}</span>
                <span className="detail-dot">·</span>
                <span>{cls.grade} classe</span>
              </div>

              <div className="class-card-footer">
                <span className="open-class-text">Acessar diário</span>
                <div className="class-card-footer-actions">
                  <button
                    type="button"
                    className="card-delete-btn"
                    title={`Excluir ${cls.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(cls.id);
                    }}
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                  <ArrowRight size={14} strokeWidth={2} className="footer-arrow" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Create new class placeholder card */}
        <button
          type="button"
          className="class-card-add"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="add-icon-circle">
            <Plus size={18} strokeWidth={2} />
          </div>
          <span className="add-class-title">Nova turma</span>
          <span className="add-class-desc">Cadastre mais uma turma no diário</span>
        </button>
      </div>

      {/* Modal Criar Turma */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-box animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Criar turma</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                title="Fechar"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form-body">
              <div className="form-field">
                <label htmlFor="input-class-name">Nome da turma</label>
                <input
                  id="input-class-name"
                  type="text"
                  placeholder="Ex: 11ª Informática"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="input-class-course">Curso</label>
                <input
                  id="input-class-course"
                  type="text"
                  placeholder="Ex: Informática, Eletrónica, Ciências..."
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  required
                />
              </div>

              <div className="form-field-row">
                <div className="form-field flex-1">
                  <label htmlFor="input-class-grade">Classe</label>
                  <input
                    id="input-class-grade"
                    type="text"
                    placeholder="Ex: 11ª"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field flex-1">
                  <label htmlFor="input-class-period">Período</label>
                  <select
                    id="input-class-period"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as Period)}
                  >
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Criar turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão de Turma */}
      {deleteConfirmId && classToDelete && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
          <div
            className="modal-box animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Excluir turma</h3>
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
                Tem certeza que deseja excluir a turma <strong>{classToDelete.name}</strong>?
              </p>
              <p className="delete-warning-text">
                Esta ação é irreversível. Todos os dados relacionados (alunos, presenças, avaliações, participações e ocorrências) também serão removidos.
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
                  onDeleteClass(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
              >
                <Trash2 size={13} strokeWidth={2} />
                <span>Excluir turma</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
