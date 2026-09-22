import React, { useState } from 'react';
import type { Classroom, Student, EvaluationItem, EvaluationType } from '../types';
import { generateId } from '../utils';

interface EvaluationViewProps {
  currentClass: Classroom;
  students: Student[];
  evaluations: EvaluationItem[];
  onSaveEvaluation: (evaluation: EvaluationItem) => void;
  onBack: () => void;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({
  currentClass,
  students,
  evaluations,
  onSaveEvaluation,
  onBack,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedType, setSelectedType] = useState<EvaluationType>('Teste');
  const [evalTitle, setEvalTitle] = useState('');
  const [evalDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxScore] = useState(20);

  // Scores state: studentId -> score
  const [scores, setScores] = useState<Record<string, number>>({});
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);
  const [currentScoreInput, setCurrentScoreInput] = useState('');

  // Sorted list of students
  const sortedStudents = [...students].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  const evaluationTypes: EvaluationType[] = ['Teste', 'Trabalho', 'Prova', 'Exercício'];

  const startNewEvaluation = () => {
    setIsCreating(true);
    setEvalTitle(`${selectedType} ${evaluations.filter(e => e.classId === currentClass.id).length + 1}`);
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
      setActiveStudentIndex(activeStudentIndex + 1);
      const nextStudent = sortedStudents[activeStudentIndex + 1];
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
    <div className="view-container animate-fade-in">
      <div className="top-navigation">
        <button type="button" className="back-button" onClick={onBack}>
          ← {currentClass.name}
        </button>
      </div>

      {!isCreating ? (
        <div className="eval-landing">
          <div className="view-header-action-row">
            <div>
              <h1 className="view-page-title">Avaliações</h1>
              <p className="view-page-subtitle">
                Lance notas com avanço rápido aluno por aluno
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-large"
              onClick={startNewEvaluation}
              disabled={sortedStudents.length === 0}
            >
              + Nova Avaliação
            </button>
          </div>

          {/* Quick Start Type Selectors */}
          <div className="eval-type-selector-card">
            <h3>Escolha o tipo para lançar:</h3>
            <div className="type-buttons-row">
              {evaluationTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`type-pill-btn ${selectedType === type ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedType(type);
                    setEvalTitle(`${type} ${evaluations.filter(e => e.classId === currentClass.id && e.type === type).length + 1}`);
                  }}
                >
                  {type === 'Teste' && '📝 '}
                  {type === 'Trabalho' && '📁 '}
                  {type === 'Prova' && '🎯 '}
                  {type === 'Exercício' && '✏️ '}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Past evaluations list */}
          <div className="evaluations-history-section">
            <h3 className="section-subtitle">Avaliações já registradas</h3>
            {evaluations.filter((e) => e.classId === currentClass.id).length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon">📊</div>
                <h3>Nenhuma avaliação registrada ainda</h3>
                <p>Clique em "+ Nova Avaliação" acima para lançar notas.</p>
              </div>
            ) : (
              <div className="eval-cards-grid">
                {evaluations
                  .filter((e) => e.classId === currentClass.id)
                  .map((ev) => {
                    const scoredCount = Object.keys(ev.scores).length;
                    const scoresArray = Object.values(ev.scores);
                    const avg =
                      scoresArray.length > 0
                        ? (scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length).toFixed(1)
                        : '-';

                    return (
                      <div key={ev.id} className="eval-card">
                        <div className="eval-card-top">
                          <span className="eval-type-badge">{ev.type}</span>
                          <span className="eval-date">{ev.date}</span>
                        </div>
                        <h4 className="eval-card-title">{ev.title}</h4>
                        <div className="eval-card-stats">
                          <div>
                            <span className="stat-label">Lançadas:</span>
                            <strong> {scoredCount}/{sortedStudents.length}</strong>
                          </div>
                          <div>
                            <span className="stat-label">Média da turma:</span>
                            <strong className="stat-highlight"> {avg} val.</strong>
                          </div>
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
        <div className="evaluation-entry-screen animate-fade-in">
          <div className="eval-entry-header">
            <div>
              <span className="eval-type-badge">{selectedType}</span>
              <h2 className="eval-active-title">{evalTitle}</h2>
            </div>
            <div className="eval-step-indicator">
              Aluno {activeStudentIndex + 1} de {sortedStudents.length}
            </div>
          </div>

          {/* Sequential input form */}
          {currentStudent && (
            <form onSubmit={handleScoreAdvance} className="sequential-score-card">
              <div className="student-big-avatar">
                {currentStudent.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="eval-student-name">{currentStudent.name}</h3>

              <div className="score-input-container">
                <label htmlFor="score-val">Nota (0 a {maxScore}):</label>
                <div className="score-input-wrap">
                  <input
                    id="score-val"
                    type="number"
                    step="0.5"
                    min="0"
                    max={maxScore}
                    autoFocus
                    placeholder="Ex: 15"
                    className="big-score-input"
                    value={currentScoreInput}
                    onChange={(e) => setCurrentScoreInput(e.target.value)}
                  />
                  <span className="score-max">/ {maxScore}</span>
                </div>
                <span className="input-tip">Pressione <strong>Enter</strong> para ir ao próximo aluno</span>
              </div>

              <div className="score-quick-buttons">
                {[10, 12, 14, 15, 16, 18, 20].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    className="quick-val-btn"
                    onClick={() => {
                      setCurrentScoreInput(String(quick));
                    }}
                  >
                    {quick}
                  </button>
                ))}
              </div>

              <div className="eval-card-footer-nav">
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
                  ← Anterior
                </button>

                <button
                  type="submit"
                  className="btn btn-primary btn-large"
                >
                  {activeStudentIndex + 1 >= sortedStudents.length ? 'Avançar' : 'Próximo →'}
                </button>
              </div>
            </form>
          )}

          {/* Quick list review of all students */}
          <div className="eval-review-table-card">
            <h4>Visão Geral dos Lançamentos</h4>
            <div className="eval-review-list">
              {sortedStudents.map((s, idx) => (
                <div
                  key={s.id}
                  className={`eval-review-item ${idx === activeStudentIndex ? 'active' : ''}`}
                  onClick={() => {
                    setActiveStudentIndex(idx);
                    setCurrentScoreInput(scores[s.id] !== undefined ? String(scores[s.id]) : '');
                  }}
                >
                  <span className="review-name">{s.name}</span>
                  <span className="review-score">
                    {scores[s.id] !== undefined ? (
                      <strong>{scores[s.id]} val</strong>
                    ) : (
                      <span className="not-set">—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="eval-finish-bar">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCreating(false)}
              >
                Descartar
              </button>
              <button
                type="button"
                className="btn btn-primary btn-large"
                onClick={saveCurrentEvaluation}
              >
                Concluir e Salvar Avaliação ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
