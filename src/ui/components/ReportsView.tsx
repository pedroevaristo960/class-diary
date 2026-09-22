import React, { useState, useMemo } from 'react';
import type {
  Classroom,
  Student,
  AttendanceSession,
  EvaluationItem,
  ParticipationRecord,
  OccurrenceRecord,
} from '../types';

interface ReportsViewProps {
  currentClass: Classroom;
  students: Student[];
  attendances: AttendanceSession[];
  evaluations: EvaluationItem[];
  participations: ParticipationRecord[];
  occurrences: OccurrenceRecord[];
  onBack: () => void;
}

type ReportType = 'class_overview' | 'student_individual' | 'attendance_map' | 'evaluations_summary';

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentClass,
  students,
  attendances,
  evaluations,
  participations,
  occurrences,
  onBack,
}) => {
  const [reportType, setReportType] = useState<ReportType>('class_overview');

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
  }, [students]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    sortedStudents[0]?.id || ''
  );

  const selectedStudent = sortedStudents.find((s) => s.id === selectedStudentId);

  // Computations for Class Overview Table
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

  const handlePrint = () => {
    window.print();
  };

  const currentDateFormatted = new Date().toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="view-container animate-fade-in">
      <div className="top-navigation no-print">
        <button type="button" className="back-button" onClick={onBack}>
          ← {currentClass.name}
        </button>
      </div>

      <div className="view-header-action-row no-print">
        <div>
          <h1 className="view-page-title">Relatórios & PDF</h1>
          <p className="view-page-subtitle">
            Relatórios organizados e prontos para impressão oficial ou salvar em PDF
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-large btn-print"
          onClick={handlePrint}
        >
          🖨️ Gerar PDF / Imprimir
        </button>
      </div>

      {/* Tabs to select report type */}
      <div className="report-tabs-bar no-print">
        <button
          type="button"
          className={`report-tab-btn ${reportType === 'class_overview' ? 'active' : ''}`}
          onClick={() => setReportType('class_overview')}
        >
          📊 Relatório da turma
        </button>
        <button
          type="button"
          className={`report-tab-btn ${reportType === 'student_individual' ? 'active' : ''}`}
          onClick={() => setReportType('student_individual')}
        >
          👤 Relatório do aluno
        </button>
        <button
          type="button"
          className={`report-tab-btn ${reportType === 'attendance_map' ? 'active' : ''}`}
          onClick={() => setReportType('attendance_map')}
        >
          📋 Relatório de presenças
        </button>
        <button
          type="button"
          className={`report-tab-btn ${reportType === 'evaluations_summary' ? 'active' : ''}`}
          onClick={() => setReportType('evaluations_summary')}
        >
          📝 Relatório de avaliações
        </button>
      </div>

      {/* Individual Student Picker if in student mode */}
      {reportType === 'student_individual' && (
        <div className="student-report-picker-card no-print">
          <label htmlFor="select-report-student">Selecione o Aluno:</label>
          <select
            id="select-report-student"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="student-dropdown"
          >
            {sortedStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* PRINTABLE DOCUMENT CONTAINER */}
      <div className="printable-document-sheet">
        {/* Document Official Header */}
        <div className="doc-school-header">
          <div className="doc-header-main">
            <h2 className="doc-school-title">REPÚBLICA DE ANGOLA</h2>
            <h3 className="doc-subtitle">MINISTÉRIO DA EDUCAÇÃO</h3>
            <h4 className="doc-diario-label">DIÁRIO DE TURMA • RELATÓRIO OFICIAL</h4>
          </div>
          <div className="doc-date-badge">Data de Emissão: {currentDateFormatted}</div>
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
                      <span>Total de Presenças</span>
                      <strong>{studentRow?.presences || 0}</strong>
                    </div>
                    <div className="doc-card">
                      <span>Total de Faltas</span>
                      <strong>{studentRow?.absences || 0}</strong>
                    </div>
                    <div className="doc-card">
                      <span>Média das Avaliações</span>
                      <strong>{studentRow?.avg || '—'}</strong>
                    </div>
                    <div className="doc-card">
                      <span>Ocorrências</span>
                      <strong>{studentRow?.occurrences || 0}</strong>
                    </div>
                  </div>

                  <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Notas nas Avaliações</h4>
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
                      <h4 style={{ marginBottom: '0.5rem' }}>Registo de Ocorrências</h4>
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
                        <th key={session.id} style={{ textAlign: 'center', fontSize: '0.75rem' }}>
                          {session.date.split('-').slice(1).reverse().join('/')}
                        </th>
                      ))}
                    <th style={{ textAlign: 'center' }}>Tot. Pres.</th>
                    <th style={{ textAlign: 'center' }}>Tot. Faltas</th>
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

        {/* Signatures Footer for Official PDF Output */}
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
