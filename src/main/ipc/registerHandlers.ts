import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels.js';
import { logger } from '../logger.js';
import type {
  CreateClassDTO,
  UpdateClassDTO,
  CreateStudentDTO,
  CreateStudentBatchDTO,
  SaveAttendanceDTO,
  SaveEvaluationDTO,
  CreateParticipationDTO,
  CreateOccurrenceDTO,
  AppData,
} from '../../shared/types.js';
import type { ClassService } from '../services/ClassService.js';
import type { StudentService } from '../services/StudentService.js';
import type { AttendanceService } from '../services/AttendanceService.js';
import type { EvaluationService } from '../services/EvaluationService.js';
import type { ParticipationService } from '../services/ParticipationService.js';
import type { DisciplineService } from '../services/DisciplineService.js';
import type { SettingsService } from '../services/SettingsService.js';
import type { BackupService } from '../services/BackupService.js';

export interface ServicesContainer {
  classService: ClassService;
  studentService: StudentService;
  attendanceService: AttendanceService;
  evaluationService: EvaluationService;
  participationService: ParticipationService;
  disciplineService: DisciplineService;
  settingsService: SettingsService;
  backupService: BackupService;
}

export function registerIpcHandlers(services: ServicesContainer): void {
  const {
    classService,
    studentService,
    attendanceService,
    evaluationService,
    participationService,
    disciplineService,
    settingsService,
    backupService,
  } = services;

  // Helper for safe IPC handler invocation
  function handleSafe<TArgs extends unknown[], TResult>(
    channel: string,
    handler: (...args: TArgs) => TResult | Promise<TResult>
  ) {
    ipcMain.handle(channel, async (_event, ...args: unknown[]) => {
      try {
        const result = await handler(...(args as TArgs));
        return { success: true, data: result };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro interno ao processar operação.';
        logger.error(`IPC error on ${channel}`, { error: String(err), args });
        return { success: false, error: errorMessage };
      }
    });
  }

  // Aggregate AppData loader
  handleSafe(IPC_CHANNELS.APP_GET_ALL, (): AppData => {
    return {
      classes: classService.getAllClasses(),
      students: studentService.getAllStudents(),
      attendances: attendanceService.getAllAttendances(),
      evaluations: evaluationService.getAllEvaluations(),
      participations: participationService.getAllParticipations(),
      occurrences: disciplineService.getAllOccurrences(),
      settings: settingsService.getAllSettings(),
    };
  });

  // Classes
  handleSafe(IPC_CHANNELS.CLASSES_LIST, () => classService.getAllClasses());
  handleSafe(IPC_CHANNELS.CLASSES_GET, (id: string) => classService.getClassById(id));
  handleSafe(IPC_CHANNELS.CLASSES_CREATE, (data: CreateClassDTO) => classService.createClass(data));
  handleSafe(IPC_CHANNELS.CLASSES_UPDATE, (id: string, data: UpdateClassDTO) => classService.updateClass(id, data));
  handleSafe(IPC_CHANNELS.CLASSES_DELETE, (id: string) => classService.deleteClass(id));

  // Students
  handleSafe(IPC_CHANNELS.STUDENTS_LIST_BY_CLASS, (classId: string) => studentService.getStudentsByClass(classId));
  handleSafe(IPC_CHANNELS.STUDENTS_GET_ALL, () => studentService.getAllStudents());
  handleSafe(IPC_CHANNELS.STUDENTS_CREATE, (data: CreateStudentDTO) => studentService.addStudent(data));
  handleSafe(IPC_CHANNELS.STUDENTS_CREATE_BATCH, (data: CreateStudentBatchDTO) => studentService.addMultipleStudents(data));
  handleSafe(IPC_CHANNELS.STUDENTS_UPDATE, (id: string, data: Partial<CreateStudentDTO>) => studentService.updateStudent(id, data));
  handleSafe(IPC_CHANNELS.STUDENTS_DELETE, (id: string) => studentService.deleteStudent(id));

  // Attendance
  handleSafe(IPC_CHANNELS.ATTENDANCE_LIST_BY_CLASS, (classId: string) => attendanceService.getAttendancesByClass(classId));
  handleSafe(IPC_CHANNELS.ATTENDANCE_GET_ALL, () => attendanceService.getAllAttendances());
  handleSafe(IPC_CHANNELS.ATTENDANCE_SAVE, (data: SaveAttendanceDTO) => attendanceService.saveAttendance(data));
  handleSafe(IPC_CHANNELS.ATTENDANCE_DELETE, (id: string) => attendanceService.deleteAttendance(id));

  // Evaluations
  handleSafe(IPC_CHANNELS.EVALUATIONS_LIST_BY_CLASS, (classId: string) => evaluationService.getEvaluationsByClass(classId));
  handleSafe(IPC_CHANNELS.EVALUATIONS_GET_ALL, () => evaluationService.getAllEvaluations());
  handleSafe(IPC_CHANNELS.EVALUATIONS_SAVE, (data: SaveEvaluationDTO) => evaluationService.saveEvaluation(data));
  handleSafe(IPC_CHANNELS.EVALUATIONS_DELETE, (id: string) => evaluationService.deleteEvaluation(id));

  // Participations
  handleSafe(IPC_CHANNELS.PARTICIPATIONS_LIST_BY_CLASS, (classId: string) => participationService.getParticipationsByClass(classId));
  handleSafe(IPC_CHANNELS.PARTICIPATIONS_GET_ALL, () => participationService.getAllParticipations());
  handleSafe(IPC_CHANNELS.PARTICIPATIONS_CREATE, (data: CreateParticipationDTO) => participationService.addParticipation(data));
  handleSafe(IPC_CHANNELS.PARTICIPATIONS_DELETE, (id: string) => participationService.deleteParticipation(id));

  // Discipline / Occurrences
  handleSafe(IPC_CHANNELS.OCCURRENCES_LIST_BY_CLASS, (classId: string) => disciplineService.getOccurrencesByClass(classId));
  handleSafe(IPC_CHANNELS.OCCURRENCES_GET_ALL, () => disciplineService.getAllOccurrences());
  handleSafe(IPC_CHANNELS.OCCURRENCES_CREATE, (data: CreateOccurrenceDTO) => disciplineService.addOccurrence(data));
  handleSafe(IPC_CHANNELS.OCCURRENCES_DELETE, (id: string) => disciplineService.deleteOccurrence(id));

  // Settings
  handleSafe(IPC_CHANNELS.SETTINGS_GET_ALL, () => settingsService.getAllSettings());
  handleSafe(IPC_CHANNELS.SETTINGS_GET, (key: string) => settingsService.getSetting(key));
  handleSafe(IPC_CHANNELS.SETTINGS_SET, (key: string, value: string) => settingsService.setSetting(key, value));
  handleSafe(IPC_CHANNELS.SETTINGS_UPDATE, (settings: Record<string, string>) => settingsService.updateSettings(settings));

  // Backup & SQLite Maintenance
  handleSafe(IPC_CHANNELS.BACKUP_GET_PATH, () => backupService.getDatabasePath());
  handleSafe(IPC_CHANNELS.BACKUP_EXPORT, (targetPath: string) => backupService.exportBackup(targetPath));
  handleSafe(IPC_CHANNELS.BACKUP_IMPORT, (sourcePath: string) => backupService.importBackup(sourcePath));

  // Legacy Storage API fallback (for backward compatibility during migration)
  ipcMain.handle(IPC_CHANNELS.STORAGE_LOAD, async () => {
    try {
      const data: AppData = {
        classes: classService.getAllClasses(),
        students: studentService.getAllStudents(),
        attendances: attendanceService.getAllAttendances(),
        evaluations: evaluationService.getAllEvaluations(),
        participations: participationService.getAllParticipations(),
        occurrences: disciplineService.getAllOccurrences(),
        settings: settingsService.getAllSettings(),
      };
      return data;
    } catch (err) {
      logger.error('Error in legacy storage:load fallback', { error: String(err) });
      return null;
    }
  });

  ipcMain.handle(IPC_CHANNELS.STORAGE_SAVE, async (_event, _data: AppData) => {
    // If legacy save is called, we gracefully accept it
    logger.debug('Legacy storage:save invoked');
    return true;
  });

  logger.info('All IPC handlers registered successfully');
}
