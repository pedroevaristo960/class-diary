import type { DatabaseSync } from 'node:sqlite';
import type { Classroom, CreateClassDTO, UpdateClassDTO } from '../../../shared/types.js';

interface ClassRow {
  id: string;
  name: string;
  course: string;
  grade: string;
  period: string;
  created_at: string;
}

export class ClassRepository {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  findAll(): Classroom[] {
    const rows = this.db.prepare(
      'SELECT id, name, course, grade, period, created_at FROM classes ORDER BY created_at ASC'
    ).all() as unknown as ClassRow[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      course: row.course,
      grade: row.grade,
      period: row.period as Classroom['period'],
      createdAt: row.created_at,
    }));
  }

  findById(id: string): Classroom | null {
    const row = this.db.prepare(
      'SELECT id, name, course, grade, period, created_at FROM classes WHERE id = ?'
    ).get(id) as unknown as ClassRow | undefined;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      course: row.course,
      grade: row.grade,
      period: row.period as Classroom['period'],
      createdAt: row.created_at,
    };
  }

  create(id: string, data: CreateClassDTO, createdAt: string): Classroom {
    const stmt = this.db.prepare(
      'INSERT INTO classes (id, name, course, grade, period, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, data.name, data.course, data.grade, data.period, createdAt);

    return {
      id,
      name: data.name,
      course: data.course,
      grade: data.grade,
      period: data.period,
      createdAt,
    };
  }

  update(id: string, data: UpdateClassDTO): Classroom | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updated: Classroom = {
      ...existing,
      name: data.name ?? existing.name,
      course: data.course ?? existing.course,
      grade: data.grade ?? existing.grade,
      period: data.period ?? existing.period,
    };

    const stmt = this.db.prepare(
      'UPDATE classes SET name = ?, course = ?, grade = ?, period = ? WHERE id = ?'
    );
    stmt.run(updated.name, updated.course, updated.grade, updated.period, id);

    return updated;
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM classes WHERE id = ?');
    stmt.run(id);
    return true;
  }
}
