import type { DatabaseSync } from 'node:sqlite';
import type { ParticipationRecord, CreateParticipationDTO, ParticipationType } from '../../../shared/types.js';

interface ParticipationRow {
  id: string;
  class_id: string;
  student_id: string;
  date: string;
  type: string;
  note: string | null;
  timestamp: string;
}

export class ParticipationRepository {
  private db: DatabaseSync;
  constructor(db: DatabaseSync) {
    this.db = db;
  }

  findAll(): ParticipationRecord[] {
    const rows = this.db.prepare(
      'SELECT id, class_id, student_id, date, type, note, timestamp FROM participations ORDER BY timestamp DESC'
    ).all() as unknown as ParticipationRow[];

    return rows.map((r) => ({
      id: r.id,
      classId: r.class_id,
      studentId: r.student_id,
      date: r.date,
      type: r.type as ParticipationType,
      note: r.note ?? undefined,
      timestamp: r.timestamp,
    }));
  }

  findByClassId(classId: string): ParticipationRecord[] {
    const rows = this.db.prepare(
      'SELECT id, class_id, student_id, date, type, note, timestamp FROM participations WHERE class_id = ? ORDER BY timestamp DESC'
    ).all(classId) as unknown as ParticipationRow[];

    return rows.map((r) => ({
      id: r.id,
      classId: r.class_id,
      studentId: r.student_id,
      date: r.date,
      type: r.type as ParticipationType,
      note: r.note ?? undefined,
      timestamp: r.timestamp,
    }));
  }

  findByStudentId(studentId: string): ParticipationRecord[] {
    const rows = this.db.prepare(
      'SELECT id, class_id, student_id, date, type, note, timestamp FROM participations WHERE student_id = ? ORDER BY timestamp DESC'
    ).all(studentId) as unknown as ParticipationRow[];

    return rows.map((r) => ({
      id: r.id,
      classId: r.class_id,
      studentId: r.student_id,
      date: r.date,
      type: r.type as ParticipationType,
      note: r.note ?? undefined,
      timestamp: r.timestamp,
    }));
  }

  create(id: string, data: CreateParticipationDTO, timestamp: string): ParticipationRecord {
    const stmt = this.db.prepare(
      'INSERT INTO participations (id, class_id, student_id, date, type, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, data.classId, data.studentId, data.date, data.type, data.note ?? null, timestamp);

    return {
      id,
      classId: data.classId,
      studentId: data.studentId,
      date: data.date,
      type: data.type,
      note: data.note,
      timestamp,
    };
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM participations WHERE id = ?');
    stmt.run(id);
    return true;
  }
}
