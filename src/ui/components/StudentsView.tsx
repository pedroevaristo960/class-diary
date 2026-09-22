import React, { useState } from 'react';
import type { Classroom, Student } from '../types';

interface StudentsViewProps {
  currentClass: Classroom;
  students: Student[];
  onAddStudent: (name: string) => void;
  onAddMultipleStudents: (names: string[]) => void;
  onDeleteStudent: (id: string) => void;
  onBack: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  currentClass,
  students,
  onAddStudent,
  onAddMultipleStudents,
  onDeleteStudent,
  onBack,
}) => {
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [singleName, setSingleName] = useState('');

  // Batch addition state
  const [batchTargetCount, setBatchTargetCount] = useState<number>(10);
  const [isBatchTypingPhase, setIsBatchTypingPhase] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [currentBatchInput, setCurrentBatchInput] = useState('');
  const [collectedNames, setCollectedNames] = useState<string[]>([]);

  // Sort students alphabetically
  const sortedStudents = [...students].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  // Group by first letter
  const groupedStudents: Record<string, Student[]> = {};
  for (const student of sortedStudents) {
    const firstLetter = (student.name.trim()[0] || '#').toUpperCase();
    if (!groupedStudents[firstLetter]) {
      groupedStudents[firstLetter] = [];
    }
    groupedStudents[firstLetter].push(student);
  }

  const sortedLetters = Object.keys(groupedStudents).sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = singleName.trim();
    if (!trimmed) return;
    onAddStudent(trimmed);
    setSingleName('');
    setIsSingleModalOpen(false);
  };

  const startBatchFlow = () => {
    if (batchTargetCount <= 0) return;
    setCollectedNames([]);
    setCurrentBatchIndex(0);
    setCurrentBatchInput('');
    setIsBatchTypingPhase(true);
  };

  const handleBatchNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = currentBatchInput.trim();
    if (!trimmed) return;

    const nextList = [...collectedNames, trimmed];
    setCollectedNames(nextList);
    setCurrentBatchInput('');

    if (currentBatchIndex + 1 >= batchTargetCount) {
      // Completed all target count!
      onAddMultipleStudents(nextList);
      setIsBatchModalOpen(false);
      setIsBatchTypingPhase(false);
    } else {
      setCurrentBatchIndex(currentBatchIndex + 1);
    }
  };

  const finishBatchEarly = () => {
    const trimmed = currentBatchInput.trim();
    const finalList = trimmed ? [...collectedNames, trimmed] : collectedNames;
    if (finalList.length > 0) {
      onAddMultipleStudents(finalList);
    }
    setIsBatchModalOpen(false);
    setIsBatchTypingPhase(false);
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
          <h1 className="view-page-title">Alunos</h1>
          <p className="view-page-subtitle">
            {students.length} {students.length === 1 ? 'aluno' : 'alunos'} matriculados
          </p>
        </div>

        <div className="header-action-buttons">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsSingleModalOpen(true)}
          >
            + Adicionar aluno
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setIsBatchModalOpen(true);
              setIsBatchTypingPhase(false);
              setBatchTargetCount(15);
            }}
          >
            Adicionar vários
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">👥</div>
          <h3>Nenhum aluno cadastrado nesta turma</h3>
          <p>Adicione alunos individualmente ou use o modo rápido para cadastrar vários seguidos.</p>
          <div className="empty-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsSingleModalOpen(true)}
            >
              + Adicionar primeiro aluno
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsBatchModalOpen(true);
                setIsBatchTypingPhase(false);
              }}
            >
              Adicionar vários
            </button>
          </div>
        </div>
      ) : (
        <div className="alphabetical-student-list">
          {sortedLetters.map((letter) => (
            <div key={letter} className="letter-group">
              <div className="letter-header">
                <span className="letter-badge">{letter}</span>
                <div className="letter-line" />
              </div>

              <div className="students-group-cards">
                {groupedStudents[letter].map((student) => (
                  <div key={student.id} className="student-card-item">
                    <div className="student-avatar">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="student-info">
                      <span className="student-name">{student.name}</span>
                    </div>
                    <button
                      type="button"
                      className="delete-icon-btn"
                      title="Remover aluno"
                      onClick={() => {
                        if (window.confirm(`Remover ${student.name} desta turma?`)) {
                          onDeleteStudent(student.id);
                        }
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Adicionar 1 aluno */}
      {isSingleModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsSingleModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adicionar aluno</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsSingleModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSingleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="student-name-input">Nome completo do aluno</label>
                <input
                  id="student-name-input"
                  type="text"
                  placeholder="Ex: Alberto Manuel"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSingleModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar vários sequencial */}
      {isBatchModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsBatchModalOpen(false)}>
          <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
            {!isBatchTypingPhase ? (
              <>
                <div className="modal-header">
                  <h2>Adicionar vários alunos</h2>
                  <button
                    type="button"
                    className="close-btn"
                    onClick={() => setIsBatchModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="modal-body-pad">
                  <p className="modal-hint-text">
                    Quantos alunos deseja cadastrar nesta sequência? Você digitará um a um com avanço rápido pelo botão <strong>Próximo →</strong> ou pressionando <strong>Enter</strong>.
                  </p>
                  <div className="batch-counter-selection">
                    {[5, 10, 15, 20, 25, 30].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`batch-pill-btn ${batchTargetCount === num ? 'active' : ''}`}
                        onClick={() => setBatchTargetCount(num)}
                      >
                        {num} alunos
                      </button>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label htmlFor="custom-count-input">Ou digite uma quantidade:</label>
                    <input
                      id="custom-count-input"
                      type="number"
                      min={1}
                      max={100}
                      value={batchTargetCount}
                      onChange={(e) => setBatchTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsBatchModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={startBatchFlow}
                  >
                    Iniciar cadastro rápido ({batchTargetCount}) →
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleBatchNext} className="batch-fast-form">
                <div className="batch-progress-bar">
                  <div
                    className="batch-progress-fill"
                    style={{
                      width: `${((currentBatchIndex) / batchTargetCount) * 100}%`,
                    }}
                  />
                </div>

                <div className="batch-step-header">
                  <span className="batch-step-indicator">
                    Aluno {currentBatchIndex + 1} de {batchTargetCount}
                  </span>
                  {collectedNames.length > 0 && (
                    <button
                      type="button"
                      className="text-link-btn"
                      onClick={finishBatchEarly}
                    >
                      Concluir com os {collectedNames.length} adicionados
                    </button>
                  )}
                </div>

                <div className="form-group focus-big-group">
                  <label htmlFor="batch-name-input">Nome do aluno</label>
                  <input
                    id="batch-name-input"
                    type="text"
                    className="big-name-input"
                    placeholder="Digite o nome..."
                    value={currentBatchInput}
                    onChange={(e) => setCurrentBatchInput(e.target.value)}
                    autoFocus
                    required
                  />
                  <span className="input-tip">Pressione <strong>Enter</strong> ou clique em Próximo</span>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (collectedNames.length > 0) {
                        finishBatchEarly();
                      } else {
                        setIsBatchModalOpen(false);
                        setIsBatchTypingPhase(false);
                      }
                    }}
                  >
                    {collectedNames.length > 0 ? 'Salvar anteriores e sair' : 'Cancelar'}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-large"
                    disabled={!currentBatchInput.trim()}
                  >
                    {currentBatchIndex + 1 >= batchTargetCount ? 'Concluir cadastro ✓' : 'Próximo →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
