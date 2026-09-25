import type { DatabaseSync } from 'node:sqlite';
import type { EvaluationItem, EvaluationType, SaveEvaluationDTO } from '../../../shared/types.js';

interface EvaluationRow {
  id: string;
  class_id: string;
  title: string;
  type: string;
  date: string;
  max_score: number;
  created_at: string;
}

interface ScoreRow {
  evaluation_id: string;
  student_id: string;
  score: number;
}

export class EvaluationRepository {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  findAll(): EvaluationItem[] {
    const evalRows = this.db.prepare(
      'SELECT id, class_id, title, type, date, max_score, created_at FROM evaluations ORDER BY date DESC'
    ).all() as unknown as EvaluationRow[];

    if (evalRows.length === 0) return [];

    const scoreRows = this.db.prepare(
      'SELECT evaluation_id, student_id, score FROM evaluation_scores'
    ).all() as unknown as ScoreRow[];

    const scoresByEval = new Map<string, Record<string, number>>();
    for (const r of scoreRows) {
      if (!scoresByEval.has(r.evaluation_id)) {
        scoresByEval.set(r.evaluation_id, {});
      }
      scoresByEval.get(r.evaluation_id)![r.student_id] = r.score;
    }

    return evalRows.map((e) => ({
      id: e.id,
      classId: e.class_id,
      title: e.title,
      type: e.type as EvaluationType,
      date: e.date,
      maxScore: e.max_score,
      scores: scoresByEval.get(e.id) || {},
      createdAt: e.created_at,
    }));
  }

  findByClassId(classId: string): EvaluationItem[] {
    const evalRows = this.db.prepare(
      'SELECT id, class_id, title, type, date, max_score, created_at FROM evaluations WHERE class_id = ? ORDER BY date DESC'
    ).all(classId) as unknown as EvaluationRow[];

    if (evalRows.length === 0) return [];

    const evalIds = evalRows.map((e) => e.id);
    const placeholders = evalIds.map(() => '?').join(',');

    const scoreRows = this.db.prepare(
      `SELECT evaluation_id, student_id, score FROM evaluation_scores WHERE evaluation_id IN (${placeholders})`
    ).all(...evalIds) as unknown as ScoreRow[];

    const scoresByEval = new Map<string, Record<string, number>>();
    for (const r of scoreRows) {
      if (!scoresByEval.has(r.evaluation_id)) {
        scoresByEval.set(r.evaluation_id, {});
      }
      scoresByEval.get(r.evaluation_id)![r.student_id] = r.score;
    }

    return evalRows.map((e) => ({
      id: e.id,
      classId: e.class_id,
      title: e.title,
      type: e.type as EvaluationType,
      date: e.date,
      maxScore: e.max_score,
      scores: scoresByEval.get(e.id) || {},
      createdAt: e.created_at,
    }));
  }

  findById(id: string): EvaluationItem | null {
    const evalRow = this.db.prepare(
      'SELECT id, class_id, title, type, date, max_score, created_at FROM evaluations WHERE id = ?'
    ).get(id) as unknown as EvaluationRow | undefined;

    if (!evalRow) return null;

    const scoreRows = this.db.prepare(
      'SELECT evaluation_id, student_id, score FROM evaluation_scores WHERE evaluation_id = ?'
    ).all(id) as unknown as ScoreRow[];

    const scores: Record<string, number> = {};
    for (const s of scoreRows) {
      scores[s.student_id] = s.score;
    }

    return {
      id: evalRow.id,
      classId: evalRow.class_id,
      title: evalRow.title,
      type: evalRow.type as EvaluationType,
      date: evalRow.date,
      maxScore: evalRow.max_score,
      scores,
      createdAt: evalRow.created_at,
    };
  }

  saveEvaluation(id: string, data: SaveEvaluationDTO, now: string): EvaluationItem {
    const existing = data.id ? this.findById(data.id) : null;
    const evalId = existing ? existing.id : id;

    if (existing) {
      const updateStmt = this.db.prepare(
        'UPDATE evaluations SET title = ?, type = ?, date = ?, max_score = ? WHERE id = ?'
      );
      updateStmt.run(data.title, data.type, data.date, data.maxScore, evalId);
    } else {
      const insertStmt = this.db.prepare(
        'INSERT INTO evaluations (id, class_id, title, type, date, max_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      insertStmt.run(evalId, data.classId, data.title, data.type, data.date, data.maxScore, now);
    }

    // Upsert individual student scores
    const upsertScore = this.db.prepare(`
      INSERT INTO evaluation_scores (id, evaluation_id, student_id, score, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(evaluation_id, student_id) DO UPDATE SET
        score = excluded.score
    `);

    for (const [studentId, score] of Object.entries(data.scores)) {
      upsertScore.run(`scr_${evalId}_${studentId}`, evalId, studentId, score, now);
    }

    return {
      id: evalId,
      classId: data.classId,
      title: data.title,
      type: data.type,
      date: data.date,
      maxScore: data.maxScore,
      scores: data.scores,
      createdAt: existing ? existing.createdAt : now,
    };
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM evaluations WHERE id = ?');
    stmt.run(id);
    return true;
  }
}
