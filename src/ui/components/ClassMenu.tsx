import React from 'react';
import type { Classroom, Screen } from '../types';
import {
  Users,
  CheckCheck,
  FileText,
  Sparkles,
  AlertTriangle,
  History,
  Printer,
  ChevronRight,
  ArrowLeft,
  Clock,
} from 'lucide-react';

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
  const actions: Array<{
    screen: Screen;
    title: string;
    description: string;
    icon: React.ReactNode;
    tag?: string;
  }> = [
    {
      screen: 'presence_quick' as unknown as Screen, // special action or attendance
      title: 'Iniciar Chamada de Hoje',
      description: 'Presença sequencial ultra-rápida aluno a aluno',
      icon: <CheckCheck size={20} strokeWidth={2} />,
      tag: 'Principal',
    },
    {
      screen: 'students',
      title: 'Alunos da Turma',
      description: `${studentsCount} alunos cadastrados em ordem alfabética`,
      icon: <Users size={20} strokeWidth={2} />,
    },
    {
      screen: 'evaluations',
      title: 'Avaliações',
      description: 'Testes, trabalhos, provas e exercícios com notas',
      icon: <FileText size={20} strokeWidth={2} />,
    },
    {
      screen: 'participation',
      title: 'Participação',
      description: 'Registro de interação durante a aula em 1 clique',
      icon: <Sparkles size={20} strokeWidth={2} />,
    },
    {
      screen: 'discipline',
      title: 'Indisciplina',
      description: 'Registro rápido de ocorrências e advertências',
      icon: <AlertTriangle size={20} strokeWidth={2} />,
    },
    {
      screen: 'history',
      title: 'Histórico do Aluno',
      description: 'Linha do tempo e dossiê individual do aluno',
      icon: <History size={20} strokeWidth={2} />,
    },
    {
      screen: 'reports',
      title: 'Relatórios & PDF',
      description: 'Geração e impressão oficial para folha A4',
      icon: <Printer size={20} strokeWidth={2} />,
    },
  ];

  return (
    <div className="view-content-wrapper animate-page-in">
      <div className="top-back-row">
        <button type="button" className="text-back-btn" onClick={onBackToClasses}>
          <ArrowLeft size={14} strokeWidth={2} />
          <span>Voltar para Turmas</span>
        </button>
      </div>

      <header className="class-hub-header">
        <div className="class-hub-title-row">
          <h1 className="class-hub-title">{currentClass.name}</h1>
          <span className="class-hub-period-badge">
            <Clock size={12} strokeWidth={2} />
            <span>{currentClass.period}</span>
          </span>
        </div>
        <p className="class-hub-meta">
          {currentClass.course} · {currentClass.grade} classe · {studentsCount} alunos
        </p>
      </header>

      {/* Grid de Ações Principais (Action Hub Linear Style) */}
      <div className="action-hub-grid">
        {actions.map((act) => {
          const targetScreen = act.screen === ('presence_quick' as unknown as Screen) ? 'attendance' : act.screen;
          const isFeatured = act.tag === 'Principal';

          return (
            <button
              key={act.title}
              type="button"
              className={`action-hub-card ${isFeatured ? 'featured' : ''}`}
              onClick={() => onNavigate(targetScreen)}
            >
              <div className="action-card-icon-wrap">{act.icon}</div>
              <div className="action-card-body">
                <div className="action-card-header">
                  <span className="action-card-title">{act.title}</span>
                  {act.tag && <span className="action-card-tag">{act.tag}</span>}
                </div>
                <p className="action-card-desc">{act.description}</p>
              </div>
              <ChevronRight size={16} strokeWidth={2} className="action-card-arrow" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
