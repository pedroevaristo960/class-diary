import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../logger.js';
import { resolveDatabasePath } from '../config/appConfig.js';

export class DatabaseConnection {
  private db: DatabaseSync | null = null;
  private currentDbPath: string | null = null;

  init(dbPath?: string): DatabaseSync {
    if (this.db) {
      return this.db;
    }

    const resolvedPath = dbPath || resolveDatabasePath();
    const dbDir = path.dirname(resolvedPath);

    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        logger.info('Database directory created', { dbDir });
      }

      logger.info('Opening SQLite database connection', { path: resolvedPath });
      const db = new DatabaseSync(resolvedPath);

      // Enforce data integrity and WAL mode
      db.exec('PRAGMA foreign_keys = ON;');
      db.exec('PRAGMA journal_mode = WAL;');
      db.exec('PRAGMA synchronous = NORMAL;');
      db.exec('PRAGMA busy_timeout = 5000;');

      this.db = db;
      this.currentDbPath = resolvedPath;
      logger.info('SQLite database connected successfully', { path: resolvedPath });
      return db;
    } catch (err) {
      logger.error('Failed to initialize SQLite database', { error: String(err), path: resolvedPath });
      throw new Error(`Falha ao abrir a base de dados local: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  getDb(): DatabaseSync {
    if (!this.db) {
      throw new Error('A conexão à base de dados não foi inicializada.');
    }
    return this.db;
  }

  getDbPath(): string {
    if (!this.currentDbPath) {
      throw new Error('Caminho da base de dados não definido.');
    }
    return this.currentDbPath;
  }

  transaction<T>(action: () => T): T {
    const db = this.getDb();
    db.exec('BEGIN TRANSACTION;');
    try {
      const result = action();
      db.exec('COMMIT;');
      return result;
    } catch (err) {
      db.exec('ROLLBACK;');
      logger.error('Transaction rolled back due to error', { error: String(err) });
      throw err;
    }
  }

  close(): void {
    if (this.db) {
      try {
        this.db.close();
        logger.info('SQLite connection closed cleanly');
      } catch (err) {
        logger.error('Error closing SQLite database', { error: String(err) });
      } finally {
        this.db = null;
        this.currentDbPath = null;
      }
    }
  }
}

export const dbConnection = new DatabaseConnection();
