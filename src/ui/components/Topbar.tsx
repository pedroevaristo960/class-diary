import React from 'react';
import type { Classroom, Screen } from '../types';
import { Search, ChevronRight, School } from 'lucide-react';

interface TopbarProps {
  currentScreen: Screen;
  currentClass: Classroom | null;
  onNavigateClasses: () => void;
  onOpenCommandPalette: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentScreen,
  currentClass,
  onNavigateClasses,
  onOpenCommandPalette,
}) => {
  const screenTitles: Record<Screen, string> = {
    classes: 'Turmas',
    class_menu: 'Visão Geral',
    students: 'Alunos',
    attendance: 'Presença',
    evaluations: 'Avaliações',
    participation: 'Participação',
    discipline: 'Indisciplina',
    history: 'Histórico',
    reports: 'Relatórios & PDF',
  };

  return (
    <header className="app-topbar no-print">
      <div className="topbar-breadcrumb">
        <button
          type="button"
          className="breadcrumb-item breadcrumb-link"
          onClick={onNavigateClasses}
        >
          <School size={14} strokeWidth={2} />
          <span>Turmas</span>
        </button>

        {currentClass && currentScreen !== 'classes' && (
          <>
            <ChevronRight size={13} strokeWidth={2} className="breadcrumb-separator" />
            <span className="breadcrumb-item breadcrumb-class-tag">
              {currentClass.name}
            </span>
          </>
        )}

        {currentScreen !== 'classes' && currentScreen !== 'class_menu' && (
          <>
            <ChevronRight size={13} strokeWidth={2} className="breadcrumb-separator" />
            <span className="breadcrumb-item breadcrumb-current">
              {screenTitles[currentScreen]}
            </span>
          </>
        )}
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="topbar-search-trigger"
          onClick={onOpenCommandPalette}
          title="Abrir pesquisa global (Ctrl + K)"
        >
          <Search size={14} strokeWidth={2} />
          <span className="search-placeholder">Buscar aluno, turma...</span>
          <kbd className="search-kbd">⌘K</kbd>
        </button>
      </div>
    </header>
  );
};
