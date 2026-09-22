import React, { useState, useEffect, useRef } from 'react';
import type { Classroom, Student, Screen } from '../types';
import {
  Search,
  School,
  Users,
  CheckCheck,
  FileText,
  Sparkles,
  AlertTriangle,
  History,
  Printer,
  ArrowRight,
  User,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Classroom[];
  students: Student[];
  currentClass: Classroom | null;
  onSelectClass: (c: Classroom) => void;
  onNavigate: (screen: Screen) => void;
  onSelectStudent: (s: Student) => void;
}

interface CommandItem {
  id: string;
  category: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  classes,
  students,
  currentClass,
  onSelectClass,
  onNavigate,
  onSelectStudent,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Build items list
  const items: CommandItem[] = [];

  // 1. Navigation items
  items.push({
    id: 'nav-classes',
    category: 'Navegação',
    label: 'Todas as Turmas',
    sublabel: 'Ver lista geral de turmas',
    icon: <School size={16} strokeWidth={2} />,
    action: () => {
      onNavigate('classes');
      onClose();
    },
  });

  if (currentClass) {
    items.push(
      {
        id: 'nav-attendance',
        category: 'Ações da Turma',
        label: `Fazer Presença (${currentClass.name})`,
        icon: <CheckCheck size={16} strokeWidth={2} />,
        action: () => {
          onNavigate('attendance');
          onClose();
        },
      },
      {
        id: 'nav-students',
        category: 'Ações da Turma',
        label: `Lista de Alunos (${currentClass.name})`,
        icon: <Users size={16} strokeWidth={2} />,
        action: () => {
          onNavigate('students');
          onClose();
        },
      },
      {
        id: 'nav-evals',
        category: 'Ações da Turma',
        label: `Lançar Avaliações (${currentClass.name})`,
        icon: <FileText size={16} strokeWidth={2} />,
        action: () => {
          onNavigate('evaluations');
          onClose();
        },
      },
      {
        id: 'nav-parts',
        category: 'Ações da Turma',
        label: `Registrar Participação (${currentClass.name})`,
        icon: <Sparkles size={16} strokeWidth={2} />,
        action: () => {
          onNavigate('participation');
          onClose();
        },
      },
      {
        id: 'nav-disc',
        category: 'Ações da Turma',
        label: `Registrar Indisciplina (${currentClass.name})`,
        icon: <AlertTriangle size={16} strokeWidth={2} />,
        action: () => {
          onNavigate('discipline');
          onClose();
        },
      },
      {
        id: 'nav-history',
        category: 'Ações da Turma',
        label: `Histórico do Aluno (${currentClass.name})`,
        icon: <History size={16} strokeWidth={2} />,
        action: () => {
          onNavigate('history');
          onClose();
        },
      },
      {
        id: 'nav-reports',
        category: 'Ações da Turma',
        label: `Gerar Relatórios & PDF (${currentClass.name})`,
        icon: <Printer size={16} strokeWidth={2} />,
        action: () => {
          onNavigate('reports');
          onClose();
        },
      }
    );
  }

  // 2. Turmas
  classes.forEach((c) => {
    items.push({
      id: `class-${c.id}`,
      category: 'Turmas',
      label: c.name,
      sublabel: `${c.grade} · ${c.course} · ${c.period}`,
      icon: <School size={16} strokeWidth={2} />,
      action: () => {
        onSelectClass(c);
        onClose();
      },
    });
  });

  // 3. Alunos da turma ativa ou todos
  const relevantStudents = currentClass
    ? students.filter((s) => s.classId === currentClass.id)
    : students;

  relevantStudents.forEach((s) => {
    const parentClass = classes.find((c) => c.id === s.classId);
    items.push({
      id: `student-${s.id}`,
      category: 'Alunos',
      label: s.name,
      sublabel: parentClass ? parentClass.name : undefined,
      icon: <User size={16} strokeWidth={2} />,
      action: () => {
        if (parentClass && (!currentClass || currentClass.id !== parentClass.id)) {
          onSelectClass(parentClass);
        }
        onSelectStudent(s);
        onClose();
      },
    });
  });

  // Filter items based on query
  const filteredItems = items.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      (item.sublabel && item.sublabel.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(0, filteredItems.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) {
        current.action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div
        className="command-palette-modal animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="command-palette-header">
          <Search size={16} strokeWidth={2} className="command-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-search-input"
            placeholder="Pesquisar turma, aluno ou comando..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <kbd className="command-esc-badge">ESC</kbd>
        </div>

        <div className="command-results-list">
          {filteredItems.length === 0 ? (
            <div className="command-empty">
              Nenhum resultado encontrado para &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`command-item ${idx === selectedIndex ? 'selected' : ''}`}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="command-item-icon">{item.icon}</div>
                <div className="command-item-content">
                  <span className="command-item-label">{item.label}</span>
                  {item.sublabel && (
                    <span className="command-item-sublabel">{item.sublabel}</span>
                  )}
                </div>
                <div className="command-item-category-tag">
                  {item.category}
                </div>
                <ArrowRight size={14} strokeWidth={2} className="command-item-arrow" />
              </button>
            ))
          )}
        </div>

        <div className="command-palette-footer">
          <span>Use <strong>↑</strong> <strong>↓</strong> para navegar e <strong>ENTER</strong> para selecionar</span>
        </div>
      </div>
    </div>
  );
};
