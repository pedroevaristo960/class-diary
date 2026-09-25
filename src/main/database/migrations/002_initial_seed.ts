import type { Migration } from './migrator.js';
import fs from 'node:fs';
import path from 'node:path';
import { getAppDataDir } from '../../config/appConfig.js';
import { logger } from '../../logger.js';
import type { AppData } from '../../../shared/types.js';

export const migration002: Migration = {
  version: 2,
  name: '002_initial_seed_and_legacy_migration',
  up: (db) => {
    const now = new Date().toISOString();

    // 1. Ensure standard system settings exist
    const insertSetting = db.prepare(
      'INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)'
    );
    insertSetting.run('teacher_name', '', now);
    insertSetting.run('default_course', '', now);
    insertSetting.run('school_year', '2026/2027', now);
    insertSetting.run('theme', 'dark', now);

    // 2. Check for legacy class_diary_data.json file to migrate existing user data
    const legacyPath = path.join(getAppDataDir(), 'class_diary_data.json');
    if (fs.existsSync(legacyPath)) {
      try {
        logger.info('Found legacy class_diary_data.json. Migrating to SQLite...', { legacyPath });
        const raw = fs.readFileSync(legacyPath, 'utf-8');
        const legacyData: Partial<AppData> = JSON.parse(raw);

        // Migrate classes
        if (Array.isArray(legacyData.classes)) {
          const insertClass = db.prepare(
            'INSERT OR IGNORE INTO classes (id, name, course, grade, period, created_at) VALUES (?, ?, ?, ?, ?, ?)'
          );
          for (const cls of legacyData.classes) {
            insertClass.run(cls.id, cls.name, cls.course, cls.grade, cls.period, cls.createdAt || now);
          }
        }

        // Migrate students
        if (Array.isArray(legacyData.students)) {
          const insertStudent = db.prepare(
            'INSERT OR IGNORE INTO students (id, class_id, name, number, active, created_at) VALUES (?, ?, ?, ?, ?, ?)'
          );
          for (const std of legacyData.students) {
            insertStudent.run(std.id, std.classId, std.name, std.number ?? null, std.active ? 1 : 0, std.createdAt || now);
          }
        }

        // Migrate attendances
        if (Array.isArray(legacyData.attendances)) {
          const insertSession = db.prepare(
            'INSERT OR IGNORE INTO attendance_sessions (id, class_id, date, completed_at, created_at) VALUES (?, ?, ?, ?, ?)'
          );
          const insertRecord = db.prepare(
            'INSERT OR IGNORE INTO attendance_records (id, session_id, student_id, status, created_at) VALUES (?, ?, ?, ?, ?)'
          );
          for (const att of legacyData.attendances) {
            insertSession.run(att.id, att.classId, att.date, att.completedAt ?? null, att.createdAt || now);
            if (att.records) {
              for (const [studentId, status] of Object.entries(att.records)) {
                insertRecord.run(`rec_${att.id}_${studentId}`, att.id, studentId, status, now);
              }
            }
          }
        }

        // Migrate evaluations
        if (Array.isArray(legacyData.evaluations)) {
          const insertEval = db.prepare(
            'INSERT OR IGNORE INTO evaluations (id, class_id, title, type, date, max_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          );
          const insertScore = db.prepare(
            'INSERT OR IGNORE INTO evaluation_scores (id, evaluation_id, student_id, score, created_at) VALUES (?, ?, ?, ?, ?)'
          );
          for (const ev of legacyData.evaluations) {
            insertEval.run(ev.id, ev.classId, ev.title, ev.type, ev.date, ev.maxScore, ev.createdAt || now);
            if (ev.scores) {
              for (const [studentId, score] of Object.entries(ev.scores)) {
                insertScore.run(`scr_${ev.id}_${studentId}`, ev.id, studentId, score, now);
              }
            }
          }
        }

        // Migrate participations
        if (Array.isArray(legacyData.participations)) {
          const insertPart = db.prepare(
            'INSERT OR IGNORE INTO participations (id, class_id, student_id, date, type, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)'
          );
          for (const pt of legacyData.participations) {
            insertPart.run(pt.id, pt.classId, pt.studentId, pt.date, pt.type, pt.note ?? null, pt.timestamp || now);
          }
        }

        // Migrate occurrences
        if (Array.isArray(legacyData.occurrences)) {
          const insertOcc = db.prepare(
            'INSERT OR IGNORE INTO occurrences (id, class_id, student_id, date, reason, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)'
          );
          for (const oc of legacyData.occurrences) {
            insertOcc.run(oc.id, oc.classId, oc.studentId, oc.date, oc.reason, oc.note ?? null, oc.timestamp || now);
          }
        }

        logger.info('Legacy migration completed successfully');
      } catch (err) {
        logger.error('Error migrating legacy data:', { error: String(err) });
      }
    }
  },
};
