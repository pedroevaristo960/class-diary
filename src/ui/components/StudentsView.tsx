import React, { useState, useRef, useEffect } from 'react';
import type { Classroom, Student } from '../types';
import {
  Search,
  UserPlus,
  Users,
  Trash2,
  X,
  ArrowRight,
  Check,
  ChevronRight,
} from 'lucide-react';

interface StudentsViewProps {
  currentClass: Classroom;
  students: Student[];
  onAddStudent: (name: string) => void;
  onAddMultipleStudents: (names: string[]) => void;
  onDeleteStudent: (id: string) => void;
  onSelectStudentForHistory: (student: Student) => void;
  onBack: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  currentClass,
  students,
  onAddStudent,
  onAddMultipleStudents,
  onDeleteStudent,
  onSelectStudentForHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [singleName, setSingleName] = useState('');

  // Batch states
  const [batchTargetCount, setBatchTargetCount] = useState<number>(10);
  const [isBatchTypingPhase, setIsBatchTypingPhase] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [currentBatchInput, setCurrentBatchInput] = useState('');
  const [collectedNames, setCollectedNames] = useState<string[]>([]);
  const batchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isBatchTypingPhase) {
      setTimeout(() => batchInputRef.current?.focus(), 60);
    }
  }, [isBatchTypingPhase, currentBatchIndex]);

  // Filter & sort students alphabetically
  const filteredStudents = students
    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase().trim()))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

  // Group by letter
  const grouped: Record<string, Student[]> = {};
  filteredStudents.forEach((student) => {
    const letter = (student.name.trim()[0] || '#').toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(student);
  });
  const letters = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'pt-BR'));

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
    <div className="view-content-wrapper animate-page-in">
      <div className="view-header-row">
        <div>
          <h1 className="page-heading">Alunos</h1>
          <p className="page-description">
            {currentClass.name} · {students.length} {students.length === 1 ? 'aluno matriculado' : 'alunos matriculados'}
          </p>
        </div>

        <div className="header-action-group">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setIsBatchModalOpen(true);
              setIsBatchTypingPhase(false);
              setBatchTargetCount(10);
            }}
          >
            <Users size={14} strokeWidth={2} />
            <span>Adicionar vários</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsSingleModalOpen(true)}
          >
            <UserPlus size={14} strokeWidth={2.2} />
            <span>Adicionar aluno</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
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

      {students.length === 0 ? (
        <div className="clean-empty-state">
          <div className="clean-empty-icon">
            <Users size={32} strokeWidth={1.5} />
          </div>
          <h4>Esta turma ainda não possui alunos</h4>
          <p>Adicione um a um ou utilize a opção rápida para cadastrar vários alunos sequencialmente.</p>
          <div className="empty-btn-group">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsSingleModalOpen(true)}
            >
              <UserPlus size={14} strokeWidth={2} />
              <span>Adicionar aluno</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsBatchModalOpen(true);
                setIsBatchTypingPhase(false);
                setBatchTargetCount(10);
              }}
            >
              <Users size={14} strokeWidth={2} />
              <span>Adicionar vários</span>
            </button>
          </div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="clean-empty-state">
          <p>Nenhum aluno encontrado com o termo &quot;{searchTerm}&quot;</p>
        </div>
      ) : (
        <div className="alphabetical-student-container">
          {letters.map((letter) => (
            <div key={letter} className="student-letter-section">
              <div className="student-letter-heading">
                <span className="letter-char">{letter}</span>
                <div className="letter-divider" />
              </div>

              <div className="student-rows-list">
                {grouped[letter].map((student) => (
                  <div
                    key={student.id}
                    className="student-table-row"
                    onClick={() => onSelectStudentForHistory(student)}
                  >
                    <div className="student-avatar-badge">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="student-row-info">
                      <span className="student-row-name">{student.name}</span>
                    </div>
                    <div className="student-row-action">
                      <span className="view-history-hint">Ver histórico</span>
                      <ChevronRight size={14} strokeWidth={2} className="row-chevron" />
                    </div>
                    <button
                      type="button"
                      className="student-delete-btn"
                      title={`Remover ${student.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Remover ${student.name} desta turma?`)) {
                          onDeleteStudent(student.id);
                        }
                      }}
                    >
                      <Trash2 size={13} strokeWidth={2} />
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
          <div className="modal-box animate-modal-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adicionar aluno</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsSingleModalOpen(false)}
                title="Fechar"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={handleSingleSubmit} className="modal-form-body">
              <div className="form-field">
                <label htmlFor="name-input">Nome completo do aluno</label>
                <input
                  id="name-input"
                  type="text"
                  placeholder="Ex: Alberto Manuel"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions-bar">
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
          <div className="modal-box modal-box-wide animate-modal-in" onClick={(e) => e.stopPropagation()}>
            {!isBatchTypingPhase ? (
              <>
                <div className="modal-header">
                  <h3>Adicionar vários alunos</h3>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => setIsBatchModalOpen(false)}
                    title="Fechar"
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>
                <div className="modal-body-content">
                  <p className="modal-helper-text">
                    Escolha a quantidade de alunos para cadastrar nesta sequência. Você digitará o nome e avançará instantaneamente ao pressionar <strong>Enter</strong>.
                  </p>
                  <div className="batch-chips-selector">
                    {[5, 10, 15, 20, 25, 30].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`batch-chip ${batchTargetCount === num ? 'selected' : ''}`}
                        onClick={() => setBatchTargetCount(num)}
                      >
                        {num} alunos
                      </button>
                    ))}
                  </div>

                  <div className="form-field" style={{ marginTop: '1rem' }}>
                    <label htmlFor="custom-count-input">Ou especifique outra quantidade:</label>
                    <input
                      id="custom-count-input"
                      type="number"
                      min={1}
                      max={80}
                      value={batchTargetCount}
                      onChange={(e) => setBatchTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </div>

                <div className="modal-actions-bar">
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
                    <span>Iniciar ({batchTargetCount} alunos)</span>
                    <ArrowRight size={14} strokeWidth={2} />
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleBatchNext} className="batch-fast-flow">
                <div className="batch-progress-line">
                  <div
                    className="batch-progress-fill"
                    style={{
                      width: `${((currentBatchIndex) / batchTargetCount) * 100}%`,
                    }}
                  />
                </div>

                <div className="batch-flow-header">
                  <span className="batch-step-counter">
                    Aluno {currentBatchIndex + 1} de {batchTargetCount}
                  </span>
                  {collectedNames.length > 0 && (
                    <button
                      type="button"
                      className="text-link-btn"
                      onClick={finishBatchEarly}
                    >
                      Salvar os {collectedNames.length} já digitados
                    </button>
                  )}
                </div>

                <div className="form-field focus-flow-field">
                  <label htmlFor="batch-name-input">Nome do aluno</label>
                  <input
                    ref={batchInputRef}
                    id="batch-name-input"
                    type="text"
                    className="input-large-flow"
                    placeholder="Digite o nome..."
                    value={currentBatchInput}
                    onChange={(e) => setCurrentBatchInput(e.target.value)}
                    autoFocus
                    required
                  />
                  <span className="field-hint">
                    Pressione <strong>Enter</strong> para salvar e ir para o próximo
                  </span>
                </div>

                <div className="modal-actions-bar">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (collectedNames.length > 0) finishBatchEarly();
                      else setIsBatchModalOpen(false);
                    }}
                  >
                    {collectedNames.length > 0 ? 'Concluir anteriores' : 'Cancelar'}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!currentBatchInput.trim()}
                  >
                    {currentBatchIndex + 1 >= batchTargetCount ? (
                      <>
                        <Check size={14} strokeWidth={2.2} />
                        <span>Concluir cadastro</span>
                      </>
                    ) : (
                      <>
                        <span>Próximo</span>
                        <ArrowRight size={14} strokeWidth={2} />
                      </>
                    )}
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
