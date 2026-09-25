import type { Migration } from './migrator.js';

export const migration001: Migration = {
  version: 1,
  name: '001_initial_schema',
  up: (db) => {
    // 1. Settings Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 2. Classes (Turmas) Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        course TEXT NOT NULL,
        grade TEXT NOT NULL,
        period TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_classes_created_at ON classes(created_at);
    `);

    // 3. Students (Alunos) Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        number INTEGER,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
      CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
    `);

    // 4. Attendance Sessions (Sessões de Presença / Chamadas)
    db.exec(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(class_id, date)
      );
      CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_date ON attendance_sessions(class_id, date);
    `);

    // 5. Attendance Records (Presenças individuais dos alunos)
    db.exec(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(session_id, student_id)
      );
      CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
    `);

    // 6. Evaluations (Avaliações / Testes / Trabalhos)
    db.exec(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        max_score REAL NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_evaluations_class ON evaluations(class_id);
      CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(date);
    `);

    // 7. Evaluation Scores (Notas dos alunos)
    db.exec(`
      CREATE TABLE IF NOT EXISTS evaluation_scores (
        id TEXT PRIMARY KEY,
        evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        score REAL NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(evaluation_id, student_id)
      );
      CREATE INDEX IF NOT EXISTS idx_evaluation_scores_eval ON evaluation_scores(evaluation_id);
      CREATE INDEX IF NOT EXISTS idx_evaluation_scores_student ON evaluation_scores(student_id);
    `);

    // 8. Participations (Participações em aula: positivas/negativas)
    db.exec(`
      CREATE TABLE IF NOT EXISTS participations (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        note TEXT,
        timestamp TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_participations_class_student ON participations(class_id, student_id);
      CREATE INDEX IF NOT EXISTS idx_participations_date ON participations(date);
    `);

    // 9. Occurrences / Discipline (Ocorrências disciplinares)
    db.exec(`
      CREATE TABLE IF NOT EXISTS occurrences (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        reason TEXT NOT NULL,
        note TEXT,
        timestamp TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_occurrences_class_student ON occurrences(class_id, student_id);
      CREATE INDEX IF NOT EXISTS idx_occurrences_date ON occurrences(date);
    `);
  },
};
