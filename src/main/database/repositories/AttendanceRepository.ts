import type { DatabaseSync } from 'node:sqlite';
import type { AttendanceSession, AttendanceStatus, SaveAttendanceDTO } from '../../../shared/types.js';

interface SessionRow {
  id: string;
  class_id: string;
  date: string;
  completed_at: string | null;
  created_at: string;
}

interface RecordRow {
  session_id: string;
  student_id: string;
  status: string;
}

export class AttendanceRepository {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  findAll(): AttendanceSession[] {
    const sessionRows = this.db.prepare(
      'SELECT id, class_id, date, completed_at, created_at FROM attendance_sessions ORDER BY date DESC'
    ).all() as unknown as SessionRow[];

    if (sessionRows.length === 0) return [];

    const recordRows = this.db.prepare(
      'SELECT session_id, student_id, status FROM attendance_records'
    ).all() as unknown as RecordRow[];

    const recordsBySession = new Map<string, Record<string, AttendanceStatus>>();
    for (const r of recordRows) {
      if (!recordsBySession.has(r.session_id)) {
        recordsBySession.set(r.session_id, {});
      }
      recordsBySession.get(r.session_id)![r.student_id] = r.status as AttendanceStatus;
    }

    return sessionRows.map((s) => ({
      id: s.id,
      classId: s.class_id,
      date: s.date,
      records: recordsBySession.get(s.id) || {},
      completedAt: s.completed_at ?? undefined,
      createdAt: s.created_at,
    }));
  }

  findByClassId(classId: string): AttendanceSession[] {
    const sessionRows = this.db.prepare(
      'SELECT id, class_id, date, completed_at, created_at FROM attendance_sessions WHERE class_id = ? ORDER BY date DESC'
    ).all(classId) as unknown as SessionRow[];

    if (sessionRows.length === 0) return [];

    const sessionIds = sessionRows.map((s) => s.id);
    const placeholders = sessionIds.map(() => '?').join(',');

    const recordRows = this.db.prepare(
      `SELECT session_id, student_id, status FROM attendance_records WHERE session_id IN (${placeholders})`
    ).all(...sessionIds) as unknown as RecordRow[];

    const recordsBySession = new Map<string, Record<string, AttendanceStatus>>();
    for (const r of recordRows) {
      if (!recordsBySession.has(r.session_id)) {
        recordsBySession.set(r.session_id, {});
      }
      recordsBySession.get(r.session_id)![r.student_id] = r.status as AttendanceStatus;
    }

    return sessionRows.map((s) => ({
      id: s.id,
      classId: s.class_id,
      date: s.date,
      records: recordsBySession.get(s.id) || {},
      completedAt: s.completed_at ?? undefined,
      createdAt: s.created_at,
    }));
  }

  findByClassAndDate(classId: string, date: string): AttendanceSession | null {
    const sessionRow = this.db.prepare(
      'SELECT id, class_id, date, completed_at, created_at FROM attendance_sessions WHERE class_id = ? AND date = ?'
    ).get(classId, date) as unknown as SessionRow | undefined;

    if (!sessionRow) return null;

    const recordRows = this.db.prepare(
      'SELECT session_id, student_id, status FROM attendance_records WHERE session_id = ?'
    ).all(sessionRow.id) as unknown as RecordRow[];

    const records: Record<string, AttendanceStatus> = {};
    for (const r of recordRows) {
      records[r.student_id] = r.status as AttendanceStatus;
    }

    return {
      id: sessionRow.id,
      classId: sessionRow.class_id,
      date: sessionRow.date,
      records,
      completedAt: sessionRow.completed_at ?? undefined,
      createdAt: sessionRow.created_at,
    };
  }

  saveSession(id: string, data: SaveAttendanceDTO, now: string): AttendanceSession {
    // Check if session for classId and date already exists
    const existing = this.findByClassAndDate(data.classId, data.date);
    const sessionId = existing ? existing.id : id;

    if (existing) {
      const updateStmt = this.db.prepare(
        'UPDATE attendance_sessions SET completed_at = ? WHERE id = ?'
      );
      updateStmt.run(data.completedAt ?? existing.completedAt ?? null, sessionId);
    } else {
      const insertStmt = this.db.prepare(
        'INSERT INTO attendance_sessions (id, class_id, date, completed_at, created_at) VALUES (?, ?, ?, ?, ?)'
      );
      insertStmt.run(sessionId, data.classId, data.date, data.completedAt ?? null, now);
    }

    // Upsert individual records
    const upsertRecord = this.db.prepare(`
      INSERT INTO attendance_records (id, session_id, student_id, status, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(session_id, student_id) DO UPDATE SET
        status = excluded.status
    `);

    for (const [studentId, status] of Object.entries(data.records)) {
      upsertRecord.run(`rec_${sessionId}_${studentId}`, sessionId, studentId, status, now);
    }

    return {
      id: sessionId,
      classId: data.classId,
      date: data.date,
      records: data.records,
      completedAt: data.completedAt ?? (existing ? existing.completedAt : undefined),
      createdAt: existing ? existing.createdAt : now,
    };
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM attendance_sessions WHERE id = ?');
    stmt.run(id);
    return true;
  }
}
