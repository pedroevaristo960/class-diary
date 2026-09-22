import React from 'react';
import type { Classroom, Screen } from '../types';

interface ClassMenuProps {
  currentClass: Classroom;
  studentsCount: number;
  onNavigate: (screen: Screen) => void;
  onBackToClasses: () => void;
}

export const ClassMenu: React.FC<ClassMenuProps> = ({
  currentClass,
  studentsCount,
  onNavigate,
  onBackToClasses,
}) => {
  const menuButtons: Array<{
    screen: Screen;
    title: string;
    description: string;
    icon: string;
    accentColor: string;
  }> = [
    {
      screen: 'students',
      title: 'Alunos',
      description: `${studentsCount} alunos cadastrados`,
      icon: '👤',
      accentColor: 'blue',
    },
    {
      screen: 'attendance',
      title: 'Presença',
      description: 'Chamada rápida e sequencial',
      icon: '📋',
      accentColor: 'emerald',
    },
    {
      screen: 'evaluations',
      title: 'Avaliações',
      description: 'Testes, provas e trabalhos',
      icon: '📝',
      accentColor: 'indigo',
    },
    {
      screen: 'participation',
      title: 'Participação',
      description: 'Registro de aula em 1 toque',
      icon: '✋',
      accentColor: 'cyan',
    },
    {
      screen: 'discipline',
      title: 'Indisciplina',
      description: 'Ocorrências e comportamento',
      icon: '⚠️',
      accentColor: 'amber',
    },
    {
      screen: 'history',
      title: 'Histórico',
      description: 'Ficha e linha do tempo do aluno',
      icon: '📜',
      accentColor: 'purple',
    },
    {
      screen: 'reports',
      title: 'Relatórios',
      description: 'Gerar PDF e impressão A4',
      icon: '🖨️',
      accentColor: 'teal',
    },
  ];

  return (
    <div className="view-container animate-fade-in">
      <div className="top-navigation">
        <button
          type="button"
          className="back-button"
          onClick={onBackToClasses}
        >
          ← Turmas
        </button>
      </div>

      <header className="class-header">
        <div className="class-title-row">
          <h1 className="class-page-title">{currentClass.name}</h1>
          <span className="class-pill">{currentClass.period}</span>
        </div>
        <p className="class-page-desc">
          {currentClass.grade} • {currentClass.course}
        </p>
      </header>

      {/* Grid de botões grandes para tocar e avançar */}
      <div className="big-menu-grid">
        {menuButtons.map((btn) => (
          <button
            key={btn.screen}
            type="button"
            className={`big-menu-btn accent-${btn.accentColor}`}
            onClick={() => onNavigate(btn.screen)}
          >
            <div className="big-menu-icon-wrap">
              <span className="big-menu-icon">{btn.icon}</span>
            </div>
            <div className="big-menu-content">
              <span className="big-menu-title">{btn.title}</span>
              <span className="big-menu-desc">{btn.description}</span>
            </div>
            <span className="big-menu-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
};
