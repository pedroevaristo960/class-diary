import type { DatabaseSync } from 'node:sqlite';
import type { AppSettings } from '../../../shared/types.js';

interface SettingRow {
  key: string;
  value: string;
  updated_at: string;
}

export class SettingsRepository {
  private db: DatabaseSync;
  constructor(db: DatabaseSync) {
    this.db = db;
  }

  getAll(): AppSettings {
    const rows = this.db.prepare(
      'SELECT key, value, updated_at FROM settings'
    ).all() as unknown as SettingRow[];

    const settings: AppSettings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    return settings;
  }

  get(key: string): string | null {
    const row = this.db.prepare(
      'SELECT value FROM settings WHERE key = ?'
    ).get(key) as unknown as { value: string } | undefined;

    return row ? row.value : null;
  }

  set(key: string, value: string): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);
    stmt.run(key, value, now);
  }

  setMultiple(settings: Record<string, string>): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);

    for (const [k, v] of Object.entries(settings)) {
      stmt.run(k, v, now);
    }
  }
}
