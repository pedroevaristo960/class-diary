import React, { useState, useMemo } from 'react';
import type {
  Classroom,
  Student,
  AttendanceSession,
  EvaluationItem,
  ParticipationRecord,
  OccurrenceRecord,
} from '../types';
import {
  Search,
  X,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  AlertTriangle,
  MinusCircle,
} from 'lucide-react';

interface StudentHistoryViewProps {
  currentClass: Classroom;
  students: Student[];
  attendances: AttendanceSession[];
  evaluations: EvaluationItem[];
  participations: ParticipationRecord[];
  occurrences: OccurrenceRecord[];
  initialStudentId?: string;
  onBack: () => void;
}

type TimelineFilter = 'all' | 'present' | 'absent' | 'evaluation' | 'participation' | 'occurrence';

interface TimelineEvent {
  id: string;
  date: string;
  filterType: TimelineFilter;
  badgeLabel: string;
  description: string;
  icon: React.ReactNode;
  tagClass: string;
}

export const StudentHistoryView: React.FC<StudentHistoryViewProps> = ({
  currentClass,
  students,
  attendances,
  evaluations,
  participations,
  occurrences,
  initialStudentId,
}) => {
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
  }, [students]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || sortedStudents[0]?.id || ''
  );
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeStudent = sortedStudents.find((s) => s.id === selectedStudentId);

  // Format date helper: "22 SET" or "22 Setembro"
  const formatDateDayMonth = (iso: string) => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length < 3) return iso;
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
  };

  const { stats, timeline } = useMemo(() => {
    if (!activeStudent) {
      return {
        stats: { presences: 0, absences: 0, avgScore: '—', participations: 0, occurrences: 0 },
        timeline: [] as TimelineEvent[],
      };
    }

    let presences = 0;
    let absences = 0;
    const events: TimelineEvent[] = [];

    // Attendances
    attendances
      .filter((a) => a.classId === currentClass.id)
      .forEach((session) => {
        const status = session.records[activeStudent.id];
        if (status === 'present') {
          presences++;
          events.push({
            id: `att-${session.id}`,
            date: session.date,
            filterType: 'present',
            badgeLabel: 'Presente',
            description: 'Presença confirmada na aula',
            icon: <CheckCircle2 size={15} strokeWidth={2.2} />,
            tagClass: 'timeline-tag-present',
          });
        } else if (status === 'absent') {
          absences++;
          events.push({
            id: `att-${session.id}`,
            date: session.date,
            filterType: 'absent',
            badgeLabel: 'Faltou',
            description: 'Ausência registrada na chamada',
            icon: <XCircle size={15} strokeWidth={2.2} />,
            tagClass: 'timeline-tag-absent',
          });
        }
      });

    // Evaluations
    const scoresList: number[] = [];
    evaluations
      .filter((e) => e.classId === currentClass.id)
      .forEach((ev) => {
        const score = ev.scores[activeStudent.id];
        if (score !== undefined) {
          scoresList.push(score);
          events.push({
            id: `ev-${ev.id}`,
            date: ev.date,
            filterType: 'evaluation',
            badgeLabel: `${score} val`,
            description: `${ev.type}: ${ev.title} (nota máxima ${ev.maxScore})`,
            icon: <Award size={15} strokeWidth={2.2} />,
            tagClass: 'timeline-tag-eval',
          });
        }
      });

    // Participations
    let totalParts = 0;
    participations
      .filter((p) => p.classId === currentClass.id && p.studentId === activeStudent.id)
      .forEach((p) => {
        totalParts++;
        if (p.type === 'positive') {
          events.push({
            id: `part-${p.id}`,
            date: p.date,
            filterType: 'participation',
            badgeLabel: '+ Participou',
            description: 'Participação ativa e positiva durante a explicação',
            icon: <Sparkles size={15} strokeWidth={2.2} />,
            tagClass: 'timeline-tag-part-pos',
          });
        } else {
          events.push({
            id: `part-${p.id}`,
            date: p.date,
            filterType: 'participation',
            badgeLabel: '− Não participou',
            description: 'Não respondeu ou recusou participação solicitada',
            icon: <MinusCircle size={15} strokeWidth={2.2} />,
            tagClass: 'timeline-tag-part-neg',
          });
        }
      });

    // Occurrences
    let occCount = 0;
    occurrences
      .filter((o) => o.classId === currentClass.id && o.studentId === activeStudent.id)
      .forEach((o) => {
        occCount++;
        events.push({
          id: `occ-${o.id}`,
          date: o.date,
          filterType: 'occurrence',
          badgeLabel: o.reason,
          description: `Indisciplina: ${o.reason}${o.note ? ` (${o.note})` : ''}`,
          icon: <AlertTriangle size={15} strokeWidth={2.2} />,
          tagClass: 'timeline-tag-occ',
        });
      });

    // Sort most recent first
    events.sort((a, b) => b.date.localeCompare(a.date));

    const avgScore =
      scoresList.length > 0
        ? (scoresList.reduce((a, b) => a + b, 0) / scoresList.length).toFixed(1)
        : '—';

    return {
      stats: {
        presences,
        absences,
        avgScore,
        participations: totalParts,
        occurrences: occCount,
      },
      timeline: events,
    };
  }, [activeStudent, attendances, evaluations, participations, occurrences, currentClass.id]);

  // Apply filters and search
  const filteredEvents = useMemo(() => {
    return timeline.filter((item) => {
      // Category filter
      if (filter !== 'all' && item.filterType !== filter) {
        return false;
      }
      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.description.toLowerCase().includes(q) ||
          item.badgeLabel.toLowerCase().includes(q) ||
          item.date.includes(q)
        );
      }
      return true;
    });
  }, [timeline, filter, searchQuery]);

  return (
    <div className="view-content-wrapper animate-page-in">
      <div className="view-header-row">
        <div>
          <h1 className="page-heading">Histórico do Aluno</h1>
          <p className="page-description">
            Linha do tempo e registro consolidado · {currentClass.name}
          </p>
        </div>
      </div>

      {/* Horizontal Student Picker Strip (Notion tabs style) */}
      <div className="student-selector-tabs-strip">
        {sortedStudents.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`student-tab-pill ${s.id === selectedStudentId ? 'active' : ''}`}
            onClick={() => {
              setSelectedStudentId(s.id);
              setSearchQuery('');
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {activeStudent ? (
        <div className="history-profile-layout">
          {/* Header Card */}
          <div className="history-student-card">
            <div className="history-student-avatar">
              {activeStudent.name.charAt(0).toUpperCase()}
            </div>
            <div className="history-student-info">
              <h2 className="history-student-name">{activeStudent.name}</h2>
              <span className="history-student-class">
                {currentClass.name} · {currentClass.period}
              </span>
            </div>

            {/* Quick summary stats */}
            <div className="history-stats-compact-row">
              <div className="stat-compact-item">
                <span className="stat-compact-val green">{stats.presences}</span>
                <span className="stat-compact-lbl">Presenças</span>
              </div>
              <div className="stat-compact-item">
                <span className="stat-compact-val red">{stats.absences}</span>
                <span className="stat-compact-lbl">Faltas</span>
              </div>
              <div className="stat-compact-item">
                <span className="stat-compact-val blue">{stats.avgScore}</span>
                <span className="stat-compact-lbl">Média</span>
              </div>
              <div className="stat-compact-item">
                <span className="stat-compact-val amber">{stats.occurrences}</span>
                <span className="stat-compact-lbl">Ocorrências</span>
              </div>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="timeline-toolbar">
            <div className="timeline-filter-buttons">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'present', label: 'Presenças' },
                { key: 'absent', label: 'Faltas' },
                { key: 'evaluation', label: 'Avaliações' },
                { key: 'participation', label: 'Participação' },
                { key: 'occurrence', label: 'Indisciplina' },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`timeline-filter-btn ${filter === f.key ? 'active' : ''}`}
                  onClick={() => setFilter(f.key as TimelineFilter)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="timeline-search-box">
              <Search size={14} strokeWidth={2} />
              <input
                type="text"
                placeholder="Filtrar histórico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="timeline-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          {/* Vertical Modern Timeline (Notion Inspired) */}
          <div className="notion-timeline-card">
            {filteredEvents.length === 0 ? (
              <div className="clean-empty-state-compact">
                <p>Nenhum acontecimento registrado com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="notion-timeline-list">
                {filteredEvents.map((evt) => (
                  <div key={evt.id} className="notion-timeline-row">
                    <div className="timeline-date-col">
                      <span className="timeline-date-badge">{formatDateDayMonth(evt.date)}</span>
                    </div>

                    <div className="timeline-node-col">
                      <div className={`timeline-node-dot ${evt.tagClass}`}>
                        {evt.icon}
                      </div>
                      <div className="timeline-stem-line" />
                    </div>

                    <div className="timeline-content-col">
                      <div className="timeline-desc-line">
                        <span className="timeline-main-desc">{evt.description}</span>
                        <span className={`timeline-mini-badge ${evt.tagClass}`}>
                          {evt.badgeLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="clean-empty-state">
          <p>Selecione um aluno para visualizar o histórico detalhado.</p>
        </div>
      )}
    </div>
  );
};
