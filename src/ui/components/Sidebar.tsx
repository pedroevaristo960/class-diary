import React from 'react';
import type { Classroom, Screen } from '../types';
import {
  School,
  Users,
  CheckCheck,
  FileText,
  Sparkles,
  AlertTriangle,
  History,
  Printer,
  ChevronDown,
  BookOpen,
  Keyboard,
} from 'lucide-react';

interface SidebarProps {
  currentScreen: Screen;
  currentClass: Classroom | null;
  classes: Classroom[];
  onSelectScreen: (screen: Screen) => void;
  onSelectClass: (c: Classroom) => void;
  onOpenCommandPalette: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  currentClass,
  classes,
  onSelectScreen,
  onSelectClass,
  onOpenCommandPalette,
}) => {
  const [isClassDropdownOpen, setIsClassDropdownOpen] = React.useState(false);

  const navItems: Array<{ screen: Screen; label: string; icon: React.ReactNode }> = [
    { screen: 'classes', label: 'Turmas', icon: <School size={17} strokeWidth={2} /> },
    { screen: 'students', label: 'Alunos', icon: <Users size={17} strokeWidth={2} /> },
    { screen: 'attendance', label: 'Presença', icon: <CheckCheck size={17} strokeWidth={2} /> },
    { screen: 'evaluations', label: 'Avaliações', icon: <FileText size={17} strokeWidth={2} /> },
    { screen: 'participation', label: 'Participação', icon: <Sparkles size={17} strokeWidth={2} /> },
    { screen: 'discipline', label: 'Indisciplina', icon: <AlertTriangle size={17} strokeWidth={2} /> },
    { screen: 'history', label: 'Histórico', icon: <History size={17} strokeWidth={2} /> },
    { screen: 'reports', label: 'Relatórios', icon: <Printer size={17} strokeWidth={2} /> },
  ];

  return (
    <aside className="app-sidebar no-print">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-mark">
          <BookOpen size={17} strokeWidth={2.2} />
        </div>
        <div className="brand-text">
          <span className="brand-title">Diário de Turma</span>
          <span className="brand-badge">Desktop</span>
        </div>
      </div>

      {/* Active Class Switcher */}
      <div className="sidebar-class-switcher">
        <button
          type="button"
          className="class-switcher-btn"
          onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
        >
          <div className="switcher-info">
            <span className="switcher-label">Turma ativa</span>
            <span className="switcher-value">
              {currentClass ? currentClass.name : 'Nenhuma selecionada'}
            </span>
          </div>
          <ChevronDown
            size={14}
            strokeWidth={2}
            className={`switcher-chevron ${isClassDropdownOpen ? 'rotated' : ''}`}
          />
        </button>

        {isClassDropdownOpen && (
          <div className="switcher-dropdown animate-fade-in">
            <div className="switcher-dropdown-header">Selecione uma turma:</div>
            {classes.map((cls) => (
              <button
                key={cls.id}
                type="button"
                className={`switcher-item ${currentClass?.id === cls.id ? 'active' : ''}`}
                onClick={() => {
                  onSelectClass(cls);
                  setIsClassDropdownOpen(false);
                }}
              >
                <span className="switcher-item-name">{cls.name}</span>
                <span className="switcher-item-period">{cls.period}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Principal</div>
        {navItems.map((item) => {
          const isActive =
            currentScreen === item.screen ||
            (currentScreen === 'class_menu' && item.screen === 'classes');
          const isClassSpecific = item.screen !== 'classes';
          const isDisabled = isClassSpecific && !currentClass;

          return (
            <button
              key={item.screen}
              type="button"
              className={`sidebar-nav-item ${isActive ? 'active' : ''} ${
                isDisabled ? 'disabled' : ''
              }`}
              onClick={() => {
                if (isDisabled) {
                  onSelectScreen('classes');
                } else {
                  onSelectScreen(item.screen);
                }
              }}
              title={isDisabled ? 'Selecione uma turma primeiro' : item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer info & keyboard shortcut trigger */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-shortcut-btn"
          onClick={onOpenCommandPalette}
          title="Abrir busca rápida (Ctrl+K)"
        >
          <div className="shortcut-label-row">
            <Keyboard size={14} strokeWidth={2} />
            <span>Busca Rápida</span>
          </div>
          <kbd className="sidebar-kbd">⌘K</kbd>
        </button>
      </div>
    </aside>
  );
};
