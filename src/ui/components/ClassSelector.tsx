import React, { useState } from 'react';
import type { Classroom, Period } from '../types';

interface ClassSelectorProps {
  classes: Classroom[];
  onSelectClass: (c: Classroom) => void;
  onCreateClass: (data: { name: string; course: string; grade: string; period: Period }) => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
  classes,
  onSelectClass,
  onCreateClass,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  return (
    <div className="view-container animate-fade-in">
      <header className="main-header">
        <div>
          <h1 className="app-title">Diário de Turma</h1>
          <p className="app-subtitle">Selecione uma turma para começar a aula</p>
        </div>
      </header>

      <div className="class-grid">
        {classes.map((cls) => (
          <button
            key={cls.id}
            type="button"
            className="class-card"
            onClick={() => onSelectClass(cls)}
          >
            <div className="class-card-badge">{cls.period}</div>
            <h2 className="class-card-title">{cls.name}</h2>
            <div className="class-card-subtitle">
              {cls.grade && <span>{cls.grade}</span>}
              {cls.grade && cls.course && <span> • </span>}
              {cls.course && <span>{cls.course}</span>}
            </div>
            <div className="class-card-action">
              <span>Abrir turma</span>
              <span className="arrow-icon">→</span>
            </div>
          </button>
        ))}

        <button
          type="button"
          className="class-card class-card-new"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="plus-circle">+</div>
          <span className="new-class-text">Criar turma</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Criar nova turma</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="class-name">Nome da turma</label>
                <input
                  id="class-name"
                  type="text"
                  placeholder="Ex: 11ª Informática"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="class-course">Curso</label>
                <input
                  id="class-course"
                  type="text"
                  placeholder="Ex: Informática, Eletrónica, Ciências..."
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="class-grade">Classe</label>
                  <input
                    id="class-grade"
                    type="text"
                    placeholder="Ex: 10ª, 11ª, 12ª"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="class-period">Período</label>
                  <select
                    id="class-period"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as Period)}
                  >
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
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
    </div>
  );
};
