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
  Printer,
  Users,
  CheckCheck,
  FileText,
  User,
  Check,
  Loader2,
} from 'lucide-react';

interface ReportsViewProps {
  currentClass: Classroom;
  students: Student[];
  attendances: AttendanceSession[];
  evaluations: EvaluationItem[];
  participations: ParticipationRecord[];
  occurrences: OccurrenceRecord[];
  onBack: () => void;
  onToast: (msg: string, type: 'success' | 'info') => void;
}

type ReportType = 'class_overview' | 'student_individual' | 'attendance_map' | 'evaluations_summary';

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentClass,
  students,
  attendances,
  evaluations,
  participations,
  occurrences,
  onToast,
}) => {
  const [reportType, setReportType] = useState<ReportType>('class_overview');
  const [isGenerating, setIsGenerating] = useState(false);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
  }, [students]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    sortedStudents[0]?.id || ''
  );
  const selectedStudent = sortedStudents.find((s) => s.id === selectedStudentId);

  // Table computations
  const tableData = useMemo(() => {
    const classSessions = attendances.filter((a) => a.classId === currentClass.id);
    const classEvals = evaluations.filter((e) => e.classId === currentClass.id);

    return sortedStudents.map((student) => {
      let presences = 0;
      let absences = 0;

      classSessions.forEach((s) => {
        const st = s.records[student.id];
        if (st === 'present') presences++;
        else if (st === 'absent') absences++;
      });

      const scores: number[] = [];
      classEvals.forEach((ev) => {
        const sc = ev.scores[student.id];
        if (sc !== undefined) scores.push(sc);
      });

      const avg =
        scores.length > 0
          ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
          : '—';

      const totalParts = participations.filter(
        (p) => p.classId === currentClass.id && p.studentId === student.id && p.type === 'positive'
      ).length;

      const totalOccs = occurrences.filter(
        (o) => o.classId === currentClass.id && o.studentId === student.id
      ).length;

      return {
        id: student.id,
        name: student.name,
        presences,
        absences,
        avg,
        participations: totalParts,
        occurrences: totalOccs,
      };
    });
  }, [sortedStudents, attendances, evaluations, participations, occurrences, currentClass.id]);

  const handleGeneratePdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      window.print();
      onToast('✓ PDF gerado com sucesso', 'success');
    }, 450);
  };

  const currentDateFormatted = new Date().toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const reportOptions: Array<{ type: ReportType; title: string; desc: string; icon: React.ReactNode }> = [
    {
      type: 'class_overview',
      title: 'Relatório da turma',
      desc: 'Quadro geral com presenças, faltas e média de notas',
      icon: <Users size={16} strokeWidth={2} />,
    },
    {
      type: 'attendance_map',
      title: 'Relatório de presenças',
      desc: 'Mapa detalhado de frequência de cada aula',
      icon: <CheckCheck size={16} strokeWidth={2} />,
    },
    {
      type: 'evaluations_summary',
      title: 'Relatório de avaliações',
      desc: 'Pauta oficial de notas de testes e trabalhos',
      icon: <FileText size={16} strokeWidth={2} />,
    },
    {
      type: 'student_individual',
      title: 'Relatório do aluno',
      desc: 'Dossiê individual consolidado para reuniões',
      icon: <User size={16} strokeWidth={2} />,
    },
  ];

  return (
    <div className="view-content-wrapper animate-page-in">
      <div className="view-header-row no-print">
        <div>
          <h1 className="page-heading">Relatórios & PDF</h1>
          <p className="page-description">
            Exportação e impressão oficial em alta resolução para folha A4 · {currentClass.name}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-large"
          onClick={handleGeneratePdf}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 size={15} strokeWidth={2.2} className="spin-animate" />
              <span>Preparando relatório…</span>
            </>
          ) : (
            <>
              <Printer size={15} strokeWidth={2.2} />
              <span>Gerar PDF / Imprimir</span>
            </>
          )}
        </button>
      </div>

      {/* 4 Report Selector Cards */}
      <div className="reports-selection-grid no-print">
        {reportOptions.map((opt) => (
          <button
            key={opt.type}
            type="button"
            className={`report-option-card ${reportType === opt.type ? 'active' : ''}`}
            onClick={() => setReportType(opt.type)}
          >
            <div className="report-option-icon-box">{opt.icon}</div>
            <div className="report-option-content">
              <span className="report-option-title">{opt.title}</span>
              <p className="report-option-desc">{opt.desc}</p>
            </div>
            {reportType === opt.type && (
              <span className="report-check-badge">
                <Check size={13} strokeWidth={2.5} />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Student dropdown if individual report is active */}
      {reportType === 'student_individual' && (
        <div className="report-student-picker-strip no-print">
          <label htmlFor="report-student-select">Aluno selecionado:</label>
          <select
            id="report-student-select"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="report-student-select"
          >
            {sortedStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* PRINTABLE DOCUMENT SHEET (High contrast black & white on paper) */}
      <div className="printable-document-sheet">
        <div className="doc-school-header">
          <h2 className="doc-school-title">REPÚBLICA DE ANGOLA</h2>
          <h3 className="doc-subtitle">MINISTÉRIO DA EDUCAÇÃO</h3>
          <h4 className="doc-diario-label">DIÁRIO DE TURMA • RELATÓRIO OFICIAL</h4>
          <span className="doc-date-badge">Data de Emissão: {currentDateFormatted}</span>
        </div>

        <div className="doc-meta-box">
          <div className="meta-item">
            <strong>Turma:</strong> {currentClass.name}
          </div>
          <div className="meta-item">
            <strong>Curso:</strong> {currentClass.course}
          </div>
          <div className="meta-item">
            <strong>Classe:</strong> {currentClass.grade}
          </div>
          <div className="meta-item">
            <strong>Período:</strong> {currentClass.period}
          </div>
        </div>

        {/* 1. RELATÓRIO DA TURMA */}
        {reportType === 'class_overview' && (
          <div className="doc-content-section">
            <h3 className="doc-section-title">Quadro Geral de Rendimento e Frequência</h3>
            <table className="doc-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Nº</th>
                  <th>Aluno</th>
                  <th style={{ textAlign: 'center', width: '90px' }}>Presenças</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>Faltas</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>Média</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Participações</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Ocorrências</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{row.name}</strong></td>
                    <td style={{ textAlign: 'center' }}>{row.presences}</td>
                    <td style={{ textAlign: 'center', color: row.absences > 0 ? '#b91c1c' : 'inherit' }}>
                      {row.absences}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <strong>{row.avg}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>+{row.participations}</td>
                    <td style={{ textAlign: 'center' }}>{row.occurrences}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. RELATÓRIO INDIVIDUAL DO ALUNO */}
        {reportType === 'student_individual' && selectedStudent && (
          <div className="doc-content-section">
            <h3 className="doc-section-title">Ficha Individual do Aluno: {selectedStudent.name}</h3>

            {(() => {
              const studentRow = tableData.find((t) => t.id === selectedStudent.id);
              const studentOccs = occurrences.filter(
                (o) => o.classId === currentClass.id && o.studentId === selectedStudent.id
              );
              const studentEvals = evaluations.filter(
                (e) => e.classId === currentClass.id && e.scores[selectedStudent.id] !== undefined
              );

              return (
                <div>
                  <div className="doc-summary-cards">
                    <div className="doc-card">
                      <span>Presenças</span>
                      <strong>{studentRow?.presences || 0}</strong>
                    </div>
                    <div className="doc-card">
                      <span>Faltas</span>
                      <strong>{studentRow?.absences || 0}</strong>
                    </div>
                    <div className="doc-card">
                      <span>Média Notas</span>
                      <strong>{studentRow?.avg || '—'}</strong>
                    </div>
                    <div className="doc-card">
                      <span>Ocorrências</span>
                      <strong>{studentRow?.occurrences || 0}</strong>
                    </div>
                  </div>

                  <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '13px' }}>
                    Notas nas Avaliações
                  </h4>
                  <table className="doc-table">
                    <thead>
                      <tr>
                        <th>Avaliação</th>
                        <th>Tipo</th>
                        <th>Data</th>
                        <th style={{ textAlign: 'center' }}>Nota Obtida</th>
                        <th style={{ textAlign: 'center' }}>Nota Máxima</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentEvals.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center' }}>Nenhuma avaliação lançada</td>
                        </tr>
                      ) : (
                        studentEvals.map((ev) => (
                          <tr key={ev.id}>
                            <td><strong>{ev.title}</strong></td>
                            <td>{ev.type}</td>
                            <td>{ev.date}</td>
                            <td style={{ textAlign: 'center' }}><strong>{ev.scores[selectedStudent.id]}</strong></td>
                            <td style={{ textAlign: 'center' }}>{ev.maxScore}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {studentOccs.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h4 style={{ marginBottom: '0.5rem', fontSize: '13px' }}>Registo de Ocorrências</h4>
                      <table className="doc-table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Motivo</th>
                            <th>Observações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentOccs.map((occ) => (
                            <tr key={occ.id}>
                              <td>{occ.date}</td>
                              <td><strong>{occ.reason}</strong></td>
                              <td>{occ.note || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* 3. RELATÓRIO DE PRESENÇAS */}
        {reportType === 'attendance_map' && (
          <div className="doc-content-section">
            <h3 className="doc-section-title">Mapa de Frequência das Aulas</h3>
            {attendances.filter((a) => a.classId === currentClass.id).length === 0 ? (
              <p>Nenhuma sessão de chamada registrada.</p>
            ) : (
              <table className="doc-table doc-attendance-table">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Aluno</th>
                    {attendances
                      .filter((a) => a.classId === currentClass.id)
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((session) => (
                        <th key={session.id} style={{ textAlign: 'center', fontSize: '11px' }}>
                          {session.date.split('-').slice(1).reverse().join('/')}
                        </th>
                      ))}
                    <th style={{ textAlign: 'center' }}>Pres.</th>
                    <th style={{ textAlign: 'center' }}>Faltas</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr key={row.id}>
                      <td>{idx + 1}</td>
                      <td>{row.name}</td>
                      {attendances
                        .filter((a) => a.classId === currentClass.id)
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((session) => {
                          const st = session.records[row.id];
                          return (
                            <td key={session.id} style={{ textAlign: 'center' }}>
                              {st === 'present' ? 'P' : st === 'absent' ? 'F' : '—'}
                            </td>
                          );
                        })}
                      <td style={{ textAlign: 'center' }}>{row.presences}</td>
                      <td style={{ textAlign: 'center' }}>{row.absences}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 4. RELATÓRIO DE AVALIAÇÕES */}
        {reportType === 'evaluations_summary' && (
          <div className="doc-content-section">
            <h3 className="doc-section-title">Pauta das Avaliações Contínuas</h3>
            {evaluations.filter((e) => e.classId === currentClass.id).length === 0 ? (
              <p>Nenhuma avaliação cadastrada para esta turma.</p>
            ) : (
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Aluno</th>
                    {evaluations
                      .filter((e) => e.classId === currentClass.id)
                      .map((ev) => (
                        <th key={ev.id} style={{ textAlign: 'center' }}>
                          {ev.title}
                        </th>
                      ))}
                    <th style={{ textAlign: 'center' }}>Média Final</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr key={row.id}>
                      <td>{idx + 1}</td>
                      <td><strong>{row.name}</strong></td>
                      {evaluations
                        .filter((e) => e.classId === currentClass.id)
                        .map((ev) => {
                          const sc = ev.scores[row.id];
                          return (
                            <td key={ev.id} style={{ textAlign: 'center' }}>
                              {sc !== undefined ? sc : '—'}
                            </td>
                          );
                        })}
                      <td style={{ textAlign: 'center' }}>
                        <strong>{row.avg}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Signatures */}
        <div className="doc-signatures-row">
          <div className="doc-signature-line">
            <div className="line" />
            <span>O(A) Professor(a)</span>
          </div>
          <div className="doc-signature-line">
            <div className="line" />
            <span>A Direção Pedagógica</span>
          </div>
        </div>
      </div>
    </div>
  );
};
