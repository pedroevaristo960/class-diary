import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DatabaseConnection } from '../src/main/database/connection.ts';
import { BackupService } from '../src/main/services/BackupService.ts';
import { resolveDatabasePath, APP_CONFIG } from '../src/main/config/appConfig.ts';
import { setupMigrations, migrator } from '../src/main/database/migrations/index.ts';
import { ClassRepository } from '../src/main/database/repositories/ClassRepository.ts';
import { ClassService } from '../src/main/services/ClassService.ts';

describe('Desktop & Database Lifecycle', () => {
  let tempDir: string;
  let dbConnection: DatabaseConnection;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'class-diary-test-'));
    dbConnection = new DatabaseConnection();
  });

  afterEach(() => {
    dbConnection.close();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('deve resolver o caminho do banco no diretório de dados persistentes do usuário', () => {
    const dbPath = resolveDatabasePath(tempDir);
    assert.ok(dbPath.includes('database'));
    assert.ok(dbPath.endsWith(APP_CONFIG.DATABASE_FILENAME));
  });

  it('deve inicializar o diretório e o banco SQLite na primeira execução', () => {
    const dbPath = resolveDatabasePath(tempDir);
    assert.strictEqual(fs.existsSync(dbPath), false);

    const db = dbConnection.init(dbPath);
    assert.ok(db);
    assert.strictEqual(fs.existsSync(dbPath), true);
    assert.strictEqual(dbConnection.getDbPath(), dbPath);
  });

  it('deve exportar e importar cópias de segurança (backup) com integridade verificada', () => {
    const dbPath = resolveDatabasePath(tempDir);
    const db = dbConnection.init(dbPath);

    setupMigrations();
    migrator.run(db);

    const classRepo = new ClassRepository(db);
    const classService = new ClassService(classRepo);

    const countBefore = classService.getAllClasses().length;
    const testClass = classService.createClass({
      name: 'Turma de Teste Backup',
      course: 'Informática',
      grade: '10ª',
      period: 'Manhã',
    });

    const backupService = new BackupService(dbConnection);

    const backupFilePath = path.join(tempDir, 'backups', 'test-backup.sqlite');
    const exportResult = backupService.exportBackup(backupFilePath);

    assert.strictEqual(exportResult.success, true);
    assert.strictEqual(fs.existsSync(backupFilePath), true);
    assert.ok(exportResult.sizeBytes > 0);

    // Agora apaga a turma criada
    classService.deleteClass(testClass.id);
    assert.strictEqual(classService.getAllClasses().length, countBefore);

    // Importa o backup de volta
    const importResult = backupService.importBackup(backupFilePath);
    assert.strictEqual(importResult.success, true);

    const restoredRepo = new ClassRepository(dbConnection.getDb());
    const restoredClasses = restoredRepo.findAll();
    assert.strictEqual(restoredClasses.length, countBefore + 1);
    assert.ok(restoredClasses.some((c) => c.name === 'Turma de Teste Backup'));
  });
});
