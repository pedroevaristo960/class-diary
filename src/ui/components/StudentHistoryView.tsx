import React, { useState, useMemo } from 'react';
import type {
  Classroom,
  Student,
  AttendanceSession,
  EvaluationItem,
  ParticipationRecord,
  OccurrenceRecord,
} from '../types';

interface StudentHistoryViewProps {
  currentClass: Classroom;
  students: Student[];
  attendances: AttendanceSession[];
  evaluations: EvaluationItem[];
  participations: ParticipationRecord[];
  occurrences: OccurrenceRecord[];
  onBack: () => void;
}

interface TimelineEvent {
  id: string;
  date: string;
  type: 'attendance_present' | 'attendance_absent' | 'evaluation' | 'participation_pos' | 'participation_neg' | 'occurrence';
  title: string;
  detail?: string;
  badge: string;
  badgeClass: string;
}

export const StudentHistoryView: React.FC<StudentHistoryViewProps> = ({
  currentClass,
  students,
  attendances,
  evaluations,
  participations,
  occurrences,
  onBack,
}) => {
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
  }, [students]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    sortedStudents[0]?.id || ''
  );
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  const activeStudent = sortedStudents.find((s) => s.id === selectedStudentId);

  // Format date helper: YYYY-MM-DD -> DD/MM
  const formatShortDate = (iso: string) => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
    return iso;
  };

  // Build stats and chronological timeline for active student
  const { stats, timeline } = useMemo(() => {
    if (!activeStudent) {
      return {
        stats: { presences: 0, absences: 0, avgScore: '-', participations: 0, occurrences: 0 },
        timeline: [] as TimelineEvent[],
      };
    }

    let presences = 0;
    let absences = 0;
    const studentEvents: TimelineEvent[] = [];

    // Attendances
    attendances
      .filter((a) => a.classId === currentClass.id)
      .forEach((session) => {
        const status = session.records[activeStudent.id];
        if (status === 'present') {
          presences++;
          studentEvents.push({
            id: `att-${session.id}`,
            date: session.date,
            type: 'attendance_present',
            title: `${formatShortDate(session.date)} — Presente`,
            badge: 'Presente',
            badgeClass: 'badge-present',
          });
        } else if (status === 'absent') {
          absences++;
          studentEvents.push({
            id: `att-${session.id}`,
            date: session.date,
            type: 'attendance_absent',
            title: `${formatShortDate(session.date)} — Faltou`,
            badge: 'Falta',
            badgeClass: 'badge-absent',
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
          studentEvents.push({
            id: `ev-${ev.id}`,
            date: ev.date,
            type: 'evaluation',
            title: `${formatShortDate(ev.date)} — Avaliação: ${ev.title}`,
            detail: `Nota obtida: ${score} / ${ev.maxScore} valores`,
            badge: `${score} val`,
            badgeClass: 'badge-eval',
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
          studentEvents.push({
            id: `part-${p.id}`,
            date: p.date,
            type: 'participation_pos',
            title: `${formatShortDate(p.date)} — Participou na aula`,
            badge: '+ Participou',
            badgeClass: 'badge-pos',
          });
        } else {
          studentEvents.push({
            id: `part-${p.id}`,
            date: p.date,
            type: 'participation_neg',
            title: `${formatShortDate(p.date)} — Não participou`,
            badge: '− Não participou',
            badgeClass: 'badge-neg',
          });
        }
      });

    // Occurrences
    let occCount = 0;
    occurrences
      .filter((o) => o.classId === currentClass.id && o.studentId === activeStudent.id)
      .forEach((o) => {
        occCount++;
        studentEvents.push({
          id: `occ-${o.id}`,
          date: o.date,
          type: 'occurrence',
          title: `${formatShortDate(o.date)} — Indisciplina: ${o.reason.toLowerCase()}${o.note ? ` (${o.note})` : ''}`,
          badge: o.reason,
          badgeClass: 'badge-occurrence',
        });
      });

    // Sort timeline chronologically (most recent first)
    studentEvents.sort((a, b) => b.date.localeCompare(a.date));

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
      timeline: studentEvents,
    };
  }, [activeStudent, attendances, evaluations, participations, occurrences, currentClass.id]);

  // Filter timeline based on search
  const filteredTimeline = useMemo(() => {
    if (!historySearchQuery.trim()) return timeline;
    const q = historySearchQuery.toLowerCase();
    return timeline.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.detail && item.detail.toLowerCase().includes(q)) ||
        item.badge.toLowerCase().includes(q)
    );
  }, [timeline, historySearchQuery]);

  return (
    <div className="view-container animate-fade-in">
      <div className="top-navigation">
        <button type="button" className="back-button" onClick={onBack}>
          ← {currentClass.name}
        </button>
      </div>

      <div className="view-header-action-row">
        <div>
          <h1 className="view-page-title">Histórico do Aluno</h1>
          <p className="view-page-subtitle">
            Dossiê completo e linha do tempo de acontecimentos
          </p>
        </div>
      </div>

      {/* Student selector pills */}
      <div className="student-select-strip">
        {sortedStudents.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`student-strip-pill ${s.id === selectedStudentId ? 'active' : ''}`}
            onClick={() => {
              setSelectedStudentId(s.id);
              setHistorySearchQuery('');
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {activeStudent ? (
        <div className="student-profile-container animate-fade-in">
          <div className="profile-header-card">
            <div className="profile-avatar">
              {activeStudent.name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{activeStudent.name}</h2>
              <span className="profile-class">{currentClass.name} • {currentClass.period}</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="profile-stats-grid">
            <div className="metric-box present-box">
              <span className="metric-value">{stats.presences}</span>
              <span className="metric-label">Presenças</span>
            </div>
            <div className="metric-box absent-box">
              <span className="metric-value">{stats.absences}</span>
              <span className="metric-label">Faltas</span>
            </div>
            <div className="metric-box eval-box">
              <span className="metric-value">{stats.avgScore}</span>
              <span className="metric-label">Média Notas</span>
            </div>
            <div className="metric-box part-box">
              <span className="metric-value">{stats.participations}</span>
              <span className="metric-label">Participações</span>
            </div>
            <div className="metric-box occ-box">
              <span className="metric-value">{stats.occurrences}</span>
              <span className="metric-label">Ocorrências</span>
            </div>
          </div>

          {/* Timeline Search */}
          <div className="history-search-card">
            <div className="search-bar-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Pesquisar histórico (ex: conversa, falta, prova, data...)"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="search-input"
              />
              {historySearchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setHistorySearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Chronological Timeline */}
          <div className="timeline-container">
            <h3 className="section-subtitle">Linha do Tempo Cronológica</h3>

            {filteredTimeline.length === 0 ? (
              <div className="empty-state-card">
                <p>Nenhum registro encontrado no histórico para a pesquisa atual.</p>
              </div>
            ) : (
              <div className="timeline-list">
                {filteredTimeline.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content-card">
                      <div className="timeline-main-row">
                        <span className="timeline-title">{item.title}</span>
                        <span className={`timeline-badge ${item.badgeClass}`}>
                          {item.badge}
                        </span>
                      </div>
                      {item.detail && (
                        <p className="timeline-detail">{item.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state-card">
          <h3>Nenhum aluno selecionado</h3>
        </div>
      )}
    </div>
  );
};
