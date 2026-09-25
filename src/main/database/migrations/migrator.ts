import type { DatabaseSync } from 'node:sqlite';
import { logger } from '../../logger.js';

export interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseSync) => void;
}

export class Migrator {
  private migrations: Migration[] = [];

  register(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  run(db: DatabaseSync): void {
    logger.info('Checking database migrations...');

    // Ensure schema_migrations table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);

    const appliedRows = db.prepare('SELECT version FROM schema_migrations').all() as Array<{ version: number }>;
    const appliedVersions = new Set(appliedRows.map((r) => r.version));

    for (const migration of this.migrations) {
      if (!appliedVersions.has(migration.version)) {
        logger.info(`Applying migration ${migration.version}: ${migration.name}`);
        
        db.exec('BEGIN TRANSACTION;');
        try {
          migration.up(db);
          
          const insertStmt = db.prepare(
            'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)'
          );
          insertStmt.run(migration.version, migration.name, new Date().toISOString());
          
          db.exec('COMMIT;');
          logger.info(`Migration ${migration.version} applied successfully`);
        } catch (err) {
          db.exec('ROLLBACK;');
          logger.error(`Migration ${migration.version} failed`, { error: String(err) });
          throw new Error(`Erro ao aplicar migration ${migration.version} (${migration.name}): ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    logger.info('Database migrations completed successfully');
  }

  getAppliedVersions(db: DatabaseSync): number[] {
    try {
      const rows = db.prepare('SELECT version FROM schema_migrations ORDER BY version ASC').all() as Array<{ version: number }>;
      return rows.map((r) => r.version);
    } catch {
      return [];
    }
  }
}

export const migrator = new Migrator();
