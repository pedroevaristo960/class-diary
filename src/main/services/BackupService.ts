import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DatabaseConnection, dbConnection } from '../database/connection.js';
import { logger } from '../logger.js';

export class BackupService {
  private conn: DatabaseConnection;
  constructor(conn: DatabaseConnection = dbConnection) {
    this.conn = conn;
  }

  getDatabasePath(): string {
    return this.conn.getDbPath();
  }

  exportBackup(targetFilePath: string): { success: boolean; filePath: string; sizeBytes: number } {
    const currentDbPath = this.conn.getDbPath();

    if (!fs.existsSync(currentDbPath)) {
      throw new Error('O ficheiro da base de dados não existe para exportação.');
    }

    const targetDir = path.dirname(targetFilePath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    try {
      // Force WAL checkpoint before backup so all WAL frames are flushed to main db file
      const db = this.conn.getDb();
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');

      fs.copyFileSync(currentDbPath, targetFilePath);
      const stats = fs.statSync(targetFilePath);

      logger.info('Database backup exported successfully', { targetFilePath, sizeBytes: stats.size });
      return {
        success: true,
        filePath: targetFilePath,
        sizeBytes: stats.size,
      };
    } catch (err) {
      logger.error('Failed to export database backup', { error: String(err) });
      throw new Error(`Falha ao exportar cópia de segurança: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  importBackup(sourceFilePath: string): { success: boolean; message: string } {
    if (!fs.existsSync(sourceFilePath)) {
      throw new Error(`Ficheiro de cópia de segurança '${sourceFilePath}' não encontrado.`);
    }

    // Validate that the source file is actually a valid SQLite database
    try {
      const testDb = new DatabaseSync(sourceFilePath);
      const integrity = testDb.prepare('PRAGMA integrity_check').get() as { integrity_check?: string } | undefined;
      testDb.close();

      if (!integrity || integrity.integrity_check !== 'ok') {
        throw new Error('O ficheiro selecionado não é uma base de dados SQLite válida ou está corrompido.');
      }
    } catch (err) {
      throw new Error(`Ficheiro de backup inválido: ${err instanceof Error ? err.message : String(err)}`);
    }

    const currentDbPath = this.conn.getDbPath();

    try {
      // 1. Close current connection
      this.conn.close();

      // 2. Backup the current db as a failsafe before overwriting
      const failsafePath = `${currentDbPath}.failsafe.${Date.now()}`;
      if (fs.existsSync(currentDbPath)) {
        fs.copyFileSync(currentDbPath, failsafePath);
      }

      // 3. Overwrite current DB with source backup
      fs.copyFileSync(sourceFilePath, currentDbPath);

      // Clean up WAL and SHM files if they exist
      const walPath = `${currentDbPath}-wal`;
      const shmPath = `${currentDbPath}-shm`;
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

      // 4. Re-open database connection
      this.conn.init(currentDbPath);

      logger.info('Database backup imported successfully', { sourceFilePath });
      return {
        success: true,
        message: 'Base de dados restaurada com sucesso a partir da cópia de segurança.',
      };
    } catch (err) {
      logger.error('Failed to import database backup', { error: String(err) });
      // Re-init connection anyway
      try {
        this.conn.init(currentDbPath);
      } catch {
        // ignore
      }
      throw new Error(`Falha ao restaurar cópia de segurança: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
