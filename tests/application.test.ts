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
import { ClassService } from '../src/main/services/ClassService.ts';
import { StudentService } from '../src/main/services/StudentService.ts';
import { AttendanceService } from '../src/main/services/AttendanceService.ts';
import { EvaluationService } from '../src/main/services/EvaluationService.ts';
import { ParticipationService } from '../src/main/services/ParticipationService.ts';
import { DisciplineService } from '../src/main/services/DisciplineService.ts';
import { SettingsService } from '../src/main/services/SettingsService.ts';

describe('Application Services & Business Logic', () => {
  let db: DatabaseSync;
  let classService: ClassService;
  let studentService: StudentService;
  let attendanceService: AttendanceService;
  let evalService: EvaluationService;
  let partService: ParticipationService;
  let discService: DisciplineService;
  let settingsService: SettingsService;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const testMigrator = new (migrator.constructor as typeof migrator.constructor)();
    (testMigrator as any).migrations = [];
    (testMigrator as any).register(migration001);
    (testMigrator as any).register(migration002);
    (testMigrator as any).run(db);

    const classRepo = new ClassRepository(db);
    const studentRepo = new StudentRepository(db);
    const attendanceRepo = new AttendanceRepository(db);
    const evalRepo = new EvaluationRepository(db);
    const partRepo = new ParticipationRepository(db);
    const discRepo = new DisciplineRepository(db);
    const settingsRepo = new SettingsRepository(db);

    classService = new ClassService(classRepo);
    studentService = new StudentService(studentRepo);
    attendanceService = new AttendanceService(attendanceRepo);
    evalService = new EvaluationService(evalRepo);
    partService = new ParticipationService(partRepo);
    discService = new DisciplineService(discRepo);
    settingsService = new SettingsService(settingsRepo);
  });

  afterEach(() => {
    db.close();
  });

  it('deve criar uma turma com validação de dados obrigatórios', () => {
    const cls = classService.createClass({
      name: '12ª Informática',
      course: 'Informática de Gestão',
      grade: '12ª',
      period: 'Manhã',
    });

    assert.ok(cls.id);
    assert.strictEqual(cls.name, '12ª Informática');
    assert.strictEqual(cls.period, 'Manhã');

    // Validação de campos vazios
    assert.throws(() => {
      classService.createClass({
        name: '',
        course: 'Informática',
        grade: '12ª',
        period: 'Manhã',
      });
    });
  });

  it('deve criar alunos individualmente e em lote atribuindo números automaticamente', () => {
    const cls = classService.createClass({
      name: '10ª Mecânica',
      course: 'Mecânica',
      grade: '10ª',
      period: 'Tarde',
    });

    // Aluno individual
    const std1 = studentService.addStudent({
      classId: cls.id,
      name: 'Bernardo Costa',
    });
    assert.strictEqual(std1.number, 1);

    // Lote de alunos
    const batch = studentService.addMultipleStudents({
      classId: cls.id,
      names: ['Carlos Damião', 'Eduardo Ferreira', 'Gerson Lima'],
    });

    assert.strictEqual(batch.length, 3);
    assert.strictEqual(batch[0].number, 2);
    assert.strictEqual(batch[1].number, 3);
    assert.strictEqual(batch[2].number, 4);

    const allStudents = studentService.getStudentsByClass(cls.id);
    assert.strictEqual(allStudents.length, 4);
  });

  it('deve registar presença e atualizar histórico de chamadas', () => {
    const cls = classService.createClass({
      name: '11ª Bioquímica',
      course: 'Química',
      grade: '11ª',
      period: 'Noite',
    });

    const std = studentService.addStudent({
      classId: cls.id,
      name: 'Helena Santos',
    });

    const session = attendanceService.saveAttendance({
      classId: cls.id,
      date: '2026-09-25',
      records: { [std.id]: 'present' },
      completedAt: '2026-09-25T20:15:00.000Z',
    });

    assert.strictEqual(session.records[std.id], 'present');

    const history = attendanceService.getAttendancesByClass(cls.id);
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].date, '2026-09-25');
  });

  it('deve registar e consultar participações e ocorrências disciplinares', () => {
    const cls = classService.createClass({
      name: '10ª Construção',
      course: 'Construção Civil',
      grade: '10ª',
      period: 'Manhã',
    });

    const std = studentService.addStudent({
      classId: cls.id,
      name: 'Igor Viana',
    });

    // Participação
    const part = partService.addParticipation({
      classId: cls.id,
      studentId: std.id,
      date: '2026-09-24',
      type: 'positive',
      note: 'Respondeu corretamente ao exercício',
    });
    assert.strictEqual(part.type, 'positive');

    const studentParts = partService.getParticipationsByStudent(std.id);
    assert.strictEqual(studentParts.length, 1);

    // Ocorrência disciplinar
    const occ = discService.addOccurrence({
      classId: cls.id,
      studentId: std.id,
      date: '2026-09-24',
      reason: 'Atraso',
      note: 'Chegou 15 minutos atrasado',
    });
    assert.strictEqual(occ.reason, 'Atraso');

    const studentOccs = discService.getOccurrencesByStudent(std.id);
    assert.strictEqual(studentOccs.length, 1);
  });
});
