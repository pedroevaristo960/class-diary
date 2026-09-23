import React, { useState, useRef, useEffect } from 'react';
import type { Classroom, Student, EvaluationItem, EvaluationType } from '../types';
import { generateId } from '../utils';
import {
  Plus,
  FileText,
  Briefcase,
  Award,
  PenTool,
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  X,
  Trash2,
} from 'lucide-react';

interface EvaluationViewProps {
  currentClass: Classroom;
  students: Student[];
  evaluations: EvaluationItem[];
  onSaveEvaluation: (evaluation: EvaluationItem) => void;
  onDeleteEvaluation: (evalId: string) => void;
  onBack: () => void;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({
  currentClass,
  students,
  evaluations,
  onSaveEvaluation,
  onDeleteEvaluation,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedType, setSelectedType] = useState<EvaluationType>('Teste');
  const [evalTitle, setEvalTitle] = useState('');
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxScore] = useState(20);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Scores state: studentId -> score
  const [scores, setScores] = useState<Record<string, number>>({});
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);
  const [currentScoreInput, setCurrentScoreInput] = useState('');
  const scoreInputRef = useRef<HTMLInputElement>(null);

  // Sorted list of students
  const sortedStudents = [...students].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  const evaluationTypes: Array<{ type: EvaluationType; icon: React.ReactNode }> = [
    { type: 'Teste', icon: <FileText size={14} strokeWidth={2} /> },
    { type: 'Trabalho', icon: <Briefcase size={14} strokeWidth={2} /> },
    { type: 'Prova', icon: <Award size={14} strokeWidth={2} /> },
    { type: 'Exercício', icon: <PenTool size={14} strokeWidth={2} /> },
  ];

  useEffect(() => {
    if (isCreating) {
      setTimeout(() => scoreInputRef.current?.focus(), 60);
    }
  }, [isCreating, activeStudentIndex]);

  const startNewEvaluation = () => {
    setIsCreating(true);
    setEvalTitle(`${selectedType} ${evaluations.filter((e) => e.classId === currentClass.id && e.type === selectedType).length + 1}`);
    setScores({});
    setActiveStudentIndex(0);
    setCurrentScoreInput('');
  };

  const handleScoreAdvance = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const student = sortedStudents[activeStudentIndex];
    if (!student) return;

    const parsed = parseFloat(currentScoreInput.replace(',', '.'));
    const validScore = isNaN(parsed) ? 0 : Math.min(maxScore, Math.max(0, parsed));

    const updated = {
      ...scores,
      [student.id]: validScore,
    };
    setScores(updated);

    if (activeStudentIndex + 1 < sortedStudents.length) {
      const nextIndex = activeStudentIndex + 1;
      setActiveStudentIndex(nextIndex);
      const nextStudent = sortedStudents[nextIndex];
      setCurrentScoreInput(updated[nextStudent.id] !== undefined ? String(updated[nextStudent.id]) : '');
    }
  };

  const saveCurrentEvaluation = () => {
    const finalScores = { ...scores };
    const currentStudent = sortedStudents[activeStudentIndex];
    if (currentStudent && currentScoreInput.trim()) {
      const parsed = parseFloat(currentScoreInput.replace(',', '.'));
      const validScore = isNaN(parsed) ? 0 : Math.min(maxScore, Math.max(0, parsed));
      finalScores[currentStudent.id] = validScore;
    }

    const newItem: EvaluationItem = {
      id: generateId('eval'),
      classId: currentClass.id,
      title: evalTitle.trim() || `${selectedType} (${evalDate})`,
      type: selectedType,
      date: evalDate,
      maxScore,
      scores: finalScores,
    };

    onSaveEvaluation(newItem);
    setIsCreating(false);
  };

  const currentStudent = sortedStudents[activeStudentIndex];

  return (
    <div className="view-content-wrapper animate-page-in">
      {!isCreating ? (
        <div className="evaluations-landing">
          <div className="view-header-row">
            <div>
              <h1 className="page-heading">Avaliações</h1>
              <p className="page-description">
                Lançamento rápido e contínuo de notas · {currentClass.name}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={startNewEvaluation}
              disabled={sortedStudents.length === 0}
            >
              <Plus size={15} strokeWidth={2.2} />
              <span>Nova avaliação</span>
            </button>
          </div>

          {/* Quick Select Type */}
          <div className="eval-type-bar">
            <span className="eval-type-bar-label">Selecione o tipo de avaliação:</span>
            <div className="eval-type-chips">
              {evaluationTypes.map(({ type, icon }) => (
                <button
                  key={type}
                  type="button"
                  className={`type-chip-btn ${selectedType === type ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedType(type);
                    setEvalTitle(`${type} ${evaluations.filter((e) => e.classId === currentClass.id && e.type === type).length + 1}`);
                  }}
                >
                  {icon}
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Past evaluations list */}
          <div className="evaluations-list-section">
            <h3 className="section-title">Avaliações registradas</h3>
            {evaluations.filter((e) => e.classId === currentClass.id).length === 0 ? (
              <div className="clean-empty-state">
                <div className="clean-empty-icon">
                  <FileText size={32} strokeWidth={1.5} />
                </div>
                <h4>Nenhuma avaliação registrada ainda</h4>
                <p>Clique no botão &quot;Nova avaliação&quot; acima para registrar notas de testes ou trabalhos.</p>
              </div>
            ) : (
              <div className="evaluations-grid-layout">
                {evaluations
                  .filter((e) => e.classId === currentClass.id)
                  .map((ev) => {
                    const scoredCount = Object.keys(ev.scores).length;
                    const scoresArray = Object.values(ev.scores);
                    const avg =
                      scoresArray.length > 0
                        ? (scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length).toFixed(1)
                        : '—';

                    return (
                      <div key={ev.id} className="evaluation-card-clean">
                        <div className="eval-card-header">
                          <span className="eval-card-badge">{ev.type}</span>
                          <div className="eval-card-header-right">
                            <span className="eval-card-date">
                              <Calendar size={12} strokeWidth={2} />
                              <span>{ev.date}</span>
                            </span>
                            <button
                              type="button"
                              className="card-delete-btn-sm"
                              title={`Excluir ${ev.title}`}
                              onClick={() => setDeleteConfirmId(ev.id)}
                            >
                              <Trash2 size={12} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                        <h4 className="eval-card-name">{ev.title}</h4>
                        <div className="eval-card-stats-row">
                          <span className="eval-stat-text">
                            Lançadas: <strong>{scoredCount}/{sortedStudents.length}</strong>
                          </span>
                          <span className="eval-stat-text">
                            Média: <strong className="eval-avg-value">{avg} val</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* FAST EVALUATION ENTRY SCREEN */
        <div className="evaluation-entry-wrapper animate-page-in">
          <div className="eval-entry-topbar">
            <div>
              <div className="eval-entry-breadcrumbs">
                <span>{selectedType}</span>
                <span>·</span>
                <span>Data: {evalDate}</span>
              </div>
              <h2 className="eval-entry-active-title">{evalTitle}</h2>
            </div>

            <div className="eval-entry-controls">
              <span className="eval-student-indicator">
                Aluno {activeStudentIndex + 1} de {sortedStudents.length}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsCreating(false)}
                title="Fechar"
              >
                <X size={14} strokeWidth={2} />
                <span>Cancelar</span>
              </button>
            </div>
          </div>

          <div className="evaluation-entry-two-col">
            {/* Sequential Input Card */}
            {currentStudent && (
              <form onSubmit={handleScoreAdvance} className="eval-sequential-card">
                <div className="eval-student-avatar">
                  {currentStudent.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="eval-student-title">{currentStudent.name}</h3>

                <div className="eval-input-group-center">
                  <label htmlFor="score-input-main">Nota (0 a {maxScore}):</label>
                  <div className="eval-input-wrapper">
                    <input
                      ref={scoreInputRef}
                      id="score-input-main"
                      type="number"
                      step="0.5"
                      min="0"
                      max={maxScore}
                      placeholder="15"
                      className="eval-score-input"
                      value={currentScoreInput}
                      onChange={(e) => setCurrentScoreInput(e.target.value)}
                    />
                    <span className="eval-max-label">/ {maxScore}</span>
                  </div>
                  <span className="eval-enter-hint">
                    Pressione <strong>Enter</strong> para ir ao próximo aluno
                  </span>
                </div>

                <div className="eval-shortcuts-row">
                  {[10, 12, 14, 15, 16, 18, 20].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      className="quick-score-btn"
                      onClick={() => {
                        setCurrentScoreInput(String(quick));
                      }}
                    >
                      {quick}
                    </button>
                  ))}
                </div>

                <div className="eval-footer-nav-row">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={activeStudentIndex === 0}
                    onClick={() => {
                      const prevIdx = activeStudentIndex - 1;
                      setActiveStudentIndex(prevIdx);
                      const prevStudent = sortedStudents[prevIdx];
                      setCurrentScoreInput(scores[prevStudent.id] !== undefined ? String(scores[prevStudent.id]) : '');
                    }}
                  >
                    <ArrowLeft size={14} strokeWidth={2} />
                    <span>Anterior</span>
                  </button>

                  <button type="submit" className="btn btn-primary">
                    <span>{activeStudentIndex + 1 >= sortedStudents.length ? 'Avançar' : 'Próximo'}</span>
                    <ArrowRight size={14} strokeWidth={2} />
                  </button>
                </div>
              </form>
            )}

            {/* Quick table of all entered scores */}
            <div className="eval-scores-preview-panel">
              <div className="eval-preview-header">
                <h4>Quadro de Notas</h4>
                <div className="eval-date-input-mini">
                  <label htmlFor="eval-date-input">Data:</label>
                  <input
                    id="eval-date-input"
                    type="date"
                    value={evalDate}
                    onChange={(e) => setEvalDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="eval-preview-rows-list">
                {sortedStudents.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`eval-preview-row ${idx === activeStudentIndex ? 'current-active' : ''}`}
                    onClick={() => {
                      setActiveStudentIndex(idx);
                      setCurrentScoreInput(scores[s.id] !== undefined ? String(scores[s.id]) : '');
                    }}
                  >
                    <span className="preview-row-name">{s.name}</span>
                    <span className="preview-row-val">
                      {scores[s.id] !== undefined ? (
                        <strong>{scores[s.id]} val</strong>
                      ) : (
                        <span className="not-set-val">—</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="eval-save-footer">
                <button
                  type="button"
                  className="btn btn-primary btn-full-width"
                  onClick={saveCurrentEvaluation}
                >
                  <Check size={14} strokeWidth={2.2} />
                  <span>Concluir e Salvar Avaliação</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar exclusão de avaliação */}
      {deleteConfirmId && (() => {
        const evalToDelete = evaluations.find((e) => e.id === deleteConfirmId);
        if (!evalToDelete) return null;
        return (
          <div className="modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
            <div className="modal-box animate-modal-in" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Excluir avaliação</h3>
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
                  Excluir <strong>{evalToDelete.title}</strong>?
                </p>
                <p className="delete-warning-text">
                  As notas lançadas nesta avaliação serão removidas permanentemente.
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
                    onDeleteEvaluation(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                >
                  <Trash2 size={13} strokeWidth={2} />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
