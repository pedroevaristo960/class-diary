import type { DatabaseSync } from 'node:sqlite';
import type { OccurrenceRecord, CreateOccurrenceDTO, OccurrenceReason } from '../../../shared/types.js';

interface OccurrenceRow {
  id: string;
  class_id: string;
  student_id: string;
  date: string;
  reason: string;
  note: string | null;
  timestamp: string;
}

export class DisciplineRepository {
  private db: DatabaseSync;
  constructor(db: DatabaseSync) {
    this.db = db;
  }

  findAll(): OccurrenceRecord[] {
    const rows = this.db.prepare(
      'SELECT id, class_id, student_id, date, reason, note, timestamp FROM occurrences ORDER BY timestamp DESC'
    ).all() as unknown as OccurrenceRow[];

    return rows.map((r) => ({
      id: r.id,
      classId: r.class_id,
      studentId: r.student_id,
      date: r.date,
      reason: r.reason as OccurrenceReason,
      note: r.note ?? undefined,
      timestamp: r.timestamp,
    }));
  }

  findByClassId(classId: string): OccurrenceRecord[] {
    const rows = this.db.prepare(
      'SELECT id, class_id, student_id, date, reason, note, timestamp FROM occurrences WHERE class_id = ? ORDER BY timestamp DESC'
    ).all(classId) as unknown as OccurrenceRow[];

    return rows.map((r) => ({
      id: r.id,
      classId: r.class_id,
      studentId: r.student_id,
      date: r.date,
      reason: r.reason as OccurrenceReason,
      note: r.note ?? undefined,
      timestamp: r.timestamp,
    }));
  }

  findByStudentId(studentId: string): OccurrenceRecord[] {
    const rows = this.db.prepare(
      'SELECT id, class_id, student_id, date, reason, note, timestamp FROM occurrences WHERE student_id = ? ORDER BY timestamp DESC'
    ).all(studentId) as unknown as OccurrenceRow[];

    return rows.map((r) => ({
      id: r.id,
      classId: r.class_id,
      studentId: r.student_id,
      date: r.date,
      reason: r.reason as OccurrenceReason,
      note: r.note ?? undefined,
      timestamp: r.timestamp,
    }));
  }

  create(id: string, data: CreateOccurrenceDTO, timestamp: string): OccurrenceRecord {
    const stmt = this.db.prepare(
      'INSERT INTO occurrences (id, class_id, student_id, date, reason, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, data.classId, data.studentId, data.date, data.reason, data.note ?? null, timestamp);

    return {
      id,
      classId: data.classId,
      studentId: data.studentId,
      date: data.date,
      reason: data.reason,
      note: data.note,
      timestamp,
    };
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM occurrences WHERE id = ?');
    stmt.run(id);
    return true;
  }
}
