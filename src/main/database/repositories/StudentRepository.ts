import type { DatabaseSync } from 'node:sqlite';
import type { Student, CreateStudentDTO } from '../../../shared/types.js';

interface StudentRow {
  id: string;
  class_id: string;
  name: string;
  number: number | null;
  active: number;
  created_at: string;
}

export class StudentRepository {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  findAll(): Student[] {
    const rows = this.db.prepare(
      'SELECT id, class_id, name, number, active, created_at FROM students ORDER BY number ASC, name ASC'
    ).all() as unknown as StudentRow[];

    return rows.map((row) => ({
      id: row.id,
      classId: row.class_id,
      name: row.name,
      number: row.number ?? undefined,
      active: row.active === 1,
      createdAt: row.created_at,
    }));
  }

  findByClassId(classId: string): Student[] {
    const rows = this.db.prepare(
      'SELECT id, class_id, name, number, active, created_at FROM students WHERE class_id = ? ORDER BY number ASC, name ASC'
    ).all(classId) as unknown as StudentRow[];

    return rows.map((row) => ({
      id: row.id,
      classId: row.class_id,
      name: row.name,
      number: row.number ?? undefined,
      active: row.active === 1,
      createdAt: row.created_at,
    }));
  }

  findById(id: string): Student | null {
    const row = this.db.prepare(
      'SELECT id, class_id, name, number, active, created_at FROM students WHERE id = ?'
    ).get(id) as unknown as StudentRow | undefined;

    if (!row) return null;

    return {
      id: row.id,
      classId: row.class_id,
      name: row.name,
      number: row.number ?? undefined,
      active: row.active === 1,
      createdAt: row.created_at,
    };
  }

  create(id: string, data: CreateStudentDTO, createdAt: string): Student {
    const stmt = this.db.prepare(
      'INSERT INTO students (id, class_id, name, number, active, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const activeInt = data.active !== false ? 1 : 0;
    stmt.run(id, data.classId, data.name, data.number ?? null, activeInt, createdAt);

    return {
      id,
      classId: data.classId,
      name: data.name,
      number: data.number,
      active: activeInt === 1,
      createdAt,
    };
  }

  createBatch(students: Array<{ id: string; classId: string; name: string; number?: number; active: boolean; createdAt: string }>): Student[] {
    const stmt = this.db.prepare(
      'INSERT INTO students (id, class_id, name, number, active, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );

    for (const s of students) {
      stmt.run(s.id, s.classId, s.name, s.number ?? null, s.active ? 1 : 0, s.createdAt);
    }

    return students;
  }

  update(id: string, data: Partial<CreateStudentDTO>): Student | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updated: Student = {
      ...existing,
      name: data.name ?? existing.name,
      number: data.number !== undefined ? data.number : existing.number,
      active: data.active !== undefined ? data.active : existing.active,
    };

    const stmt = this.db.prepare(
      'UPDATE students SET name = ?, number = ?, active = ? WHERE id = ?'
    );
    stmt.run(updated.name, updated.number ?? null, updated.active ? 1 : 0, id);

    return updated;
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM students WHERE id = ?');
    stmt.run(id);
    return true;
  }
}
