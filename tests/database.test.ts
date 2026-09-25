import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import { migrator } from '../src/main/database/migrations/migrator.ts';
import { migration001 } from '../src/main/database/migrations/001_initial_schema.ts';
import { migration002 } from '../src/main/database/migrations/002_initial_seed.ts';
import { ClassRepository } from '../src/main/database/repositories/ClassRepository.ts';
import { StudentRepository } from '../src/main/database/repositories/StudentRepository.ts';
import { AttendanceRepository } from '../src/main/database/repositories/AttendanceRepository.ts';
import { EvaluationRepository } from '../src/main/database/repositories/EvaluationRepository.ts';
import { ParticipationRepository } from '../src/main/database/repositories/ParticipationRepository.ts';
import { DisciplineRepository } from '../src/main/database/repositories/DisciplineRepository.ts';
import { SettingsRepository } from '../src/main/database/repositories/SettingsRepository.ts';

describe('SQLite Database & Migrations', () => {
  let db: DatabaseSync;
  let classRepo: ClassRepository;
  let studentRepo: StudentRepository;
  let attendanceRepo: AttendanceRepository;
  let evalRepo: EvaluationRepository;
  let partRepo: ParticipationRepository;
  let discRepo: DisciplineRepository;
  let settingsRepo: SettingsRepository;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    // Register migrations
    const testMigrator = new (migrator.constructor as typeof migrator.constructor)();
    (testMigrator as any).migrations = [];
    (testMigrator as any).register(migration001);
    (testMigrator as any).register(migration002);
    (testMigrator as any).run(db);

    classRepo = new ClassRepository(db);
    studentRepo = new StudentRepository(db);
    attendanceRepo = new AttendanceRepository(db);
    evalRepo = new EvaluationRepository(db);
    partRepo = new ParticipationRepository(db);
    discRepo = new DisciplineRepository(db);
    settingsRepo = new SettingsRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('deve aplicar as migrações e criar as tabelas com versionamento', () => {
    const migrations = db.prepare('SELECT version, name FROM schema_migrations').all() as any[];
    assert.strictEqual(migrations.length, 2);
    assert.strictEqual(migrations[0].version, 1);
    assert.strictEqual(migrations[1].version, 2);
  });

  it('deve criar, ler, atualizar e eliminar uma turma', () => {
    const created = classRepo.create(
      'c1',
      { name: '10ª Informática', course: 'Informática', grade: '10ª', period: 'Manhã' },
      '2026-09-01T08:00:00.000Z'
    );
    assert.strictEqual(created.id, 'c1');
    assert.strictEqual(created.name, '10ª Informática');

    const found = classRepo.findById('c1');
    assert.ok(found);
    assert.strictEqual(found.course, 'Informática');

    const updated = classRepo.update('c1', { name: '10ª TI A' });
    assert.ok(updated);
    assert.strictEqual(updated.name, '10ª TI A');

    const deleted = classRepo.delete('c1');
    assert.strictEqual(deleted, true);
    assert.strictEqual(classRepo.findById('c1'), null);
  });

  it('deve garantir integridade referencial com foreign keys', () => {
    // Tentar criar aluno para turma inexistente deve falhar
    assert.throws(() => {
      studentRepo.create(
        's1',
        { classId: 'non_existent_class', name: 'Aluno Fantasma', number: 1 },
        '2026-09-01T08:00:00.000Z'
      );
    });
  });

  it('deve eliminar dados dependentes em cascata ao remover turma', () => {
    classRepo.create(
      'c2',
      { name: '11ª Eletrónica', course: 'Eletrónica', grade: '11ª', period: 'Tarde' },
      '2026-09-01T08:00:00.000Z'
    );

    studentRepo.create(
      's2',
      { classId: 'c2', name: 'Manuel João', number: 1 },
      '2026-09-01T08:00:00.000Z'
    );

    assert.strictEqual(studentRepo.findByClassId('c2').length, 1);

    // Apaga a turma
    classRepo.delete('c2');

    // Aluno associado deve ter sido removido por ON DELETE CASCADE
    assert.strictEqual(studentRepo.findById('s2'), null);
    assert.strictEqual(studentRepo.findByClassId('c2').length, 0);
  });

  it('deve suportar transações e rollback em caso de erro', () => {
    classRepo.create(
      'c3',
      { name: '12ª Química', course: 'Química', grade: '12ª', period: 'Manhã' },
      '2026-09-01T08:00:00.000Z'
    );

    // Executa transação com rollback
    db.exec('BEGIN TRANSACTION;');
    studentRepo.create('s3', { classId: 'c3', name: 'Ana Silva', number: 1 }, '2026-09-01T08:00:00.000Z');
    db.exec('ROLLBACK;');

    assert.strictEqual(studentRepo.findById('s3'), null);

    // Executa transação com commit
    db.exec('BEGIN TRANSACTION;');
    studentRepo.create('s3', { classId: 'c3', name: 'Ana Silva', number: 1 }, '2026-09-01T08:00:00.000Z');
    db.exec('COMMIT;');

    assert.ok(studentRepo.findById('s3'));
  });

  it('deve salvar e carregar sessões de presença e registros individuais', () => {
    classRepo.create('c_att', { name: 'Turma A', course: 'Matemática', grade: '10ª', period: 'Manhã' }, '2026-09-01T08:00:00.000Z');
    studentRepo.create('std_1', { classId: 'c_att', name: 'Carlos', number: 1 }, '2026-09-01T08:00:00.000Z');
    studentRepo.create('std_2', { classId: 'c_att', name: 'Daniel', number: 2 }, '2026-09-01T08:00:00.000Z');

    const session = attendanceRepo.saveSession(
      'att_1',
      {
        classId: 'c_att',
        date: '2026-09-20',
        records: { std_1: 'present', std_2: 'absent' },
        completedAt: '2026-09-20T08:45:00.000Z',
      },
      '2026-09-20T08:00:00.000Z'
    );

    assert.strictEqual(session.records.std_1, 'present');
    assert.strictEqual(session.records.std_2, 'absent');

    const found = attendanceRepo.findByClassAndDate('c_att', '2026-09-20');
    assert.ok(found);
    assert.strictEqual(found.records.std_1, 'present');
    assert.strictEqual(found.records.std_2, 'absent');
  });

  it('deve gerir avaliações e notas dos estudantes', () => {
    classRepo.create('c_ev', { name: 'Turma B', course: 'Física', grade: '11ª', period: 'Manhã' }, '2026-09-01T08:00:00.000Z');
    studentRepo.create('std_3', { classId: 'c_ev', name: 'Eva', number: 1 }, '2026-09-01T08:00:00.000Z');

    const evaluation = evalRepo.saveEvaluation(
      'ev_1',
      {
        classId: 'c_ev',
        title: 'Teste 1',
        type: 'Teste',
        date: '2026-09-25',
        maxScore: 20,
        scores: { std_3: 18 },
      },
      '2026-09-25T10:00:00.000Z'
    );

    assert.strictEqual(evaluation.title, 'Teste 1');
    assert.strictEqual(evaluation.scores.std_3, 18);

    const found = evalRepo.findById('ev_1');
    assert.ok(found);
    assert.strictEqual(found.scores.std_3, 18);
  });

  it('deve armazenar e ler configurações do professor e da aplicação', () => {
    settingsRepo.set('teacher_name', 'Professor Pedro');
    settingsRepo.set('default_course', 'Informática');

    assert.strictEqual(settingsRepo.get('teacher_name'), 'Professor Pedro');
    assert.strictEqual(settingsRepo.get('default_course'), 'Informática');
  });
});
