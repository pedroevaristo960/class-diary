import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../main/ipc/channels.js';
import type {
  AppData,
  Classroom,
  Student,
  AttendanceSession,
  EvaluationItem,
  ParticipationRecord,
  OccurrenceRecord,
  AppSettings,
  CreateClassDTO,
  UpdateClassDTO,
  CreateStudentDTO,
  CreateStudentBatchDTO,
  SaveAttendanceDTO,
  SaveEvaluationDTO,
  CreateParticipationDTO,
  CreateOccurrenceDTO,
} from '../shared/types.js';

interface IpcResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function invokeChannel<T>(channel: string, ...args: unknown[]): Promise<T> {
  const result = (await ipcRenderer.invoke(channel, ...args)) as IpcResult<T>;
  if (!result || typeof result !== 'object') {
    return result as unknown as T;
  }
  if (result.success === false) {
    throw new Error(result.error || 'Erro ao comunicar com o processo principal.');
  }
  return result.data as T;
}

const api = {
  // Aggregate initial load
  getAllData: (): Promise<AppData> => invokeChannel<AppData>(IPC_CHANNELS.APP_GET_ALL),

  // Classes
  classes: {
    list: (): Promise<Classroom[]> => invokeChannel<Classroom[]>(IPC_CHANNELS.CLASSES_LIST),
    get: (id: string): Promise<Classroom> => invokeChannel<Classroom>(IPC_CHANNELS.CLASSES_GET, id),
    create: (data: CreateClassDTO): Promise<Classroom> => invokeChannel<Classroom>(IPC_CHANNELS.CLASSES_CREATE, data),
    update: (id: string, data: UpdateClassDTO): Promise<Classroom> => invokeChannel<Classroom>(IPC_CHANNELS.CLASSES_UPDATE, id, data),
    delete: (id: string): Promise<boolean> => invokeChannel<boolean>(IPC_CHANNELS.CLASSES_DELETE, id),
  },

  // Students
  students: {
    listByClass: (classId: string): Promise<Student[]> => invokeChannel<Student[]>(IPC_CHANNELS.STUDENTS_LIST_BY_CLASS, classId),
    getAll: (): Promise<Student[]> => invokeChannel<Student[]>(IPC_CHANNELS.STUDENTS_GET_ALL),
    create: (data: CreateStudentDTO): Promise<Student> => invokeChannel<Student>(IPC_CHANNELS.STUDENTS_CREATE, data),
    createBatch: (data: CreateStudentBatchDTO): Promise<Student[]> => invokeChannel<Student[]>(IPC_CHANNELS.STUDENTS_CREATE_BATCH, data),
    update: (id: string, data: Partial<CreateStudentDTO>): Promise<Student> => invokeChannel<Student>(IPC_CHANNELS.STUDENTS_UPDATE, id, data),
    delete: (id: string): Promise<boolean> => invokeChannel<boolean>(IPC_CHANNELS.STUDENTS_DELETE, id),
  },

  // Attendance
  attendance: {
    listByClass: (classId: string): Promise<AttendanceSession[]> => invokeChannel<AttendanceSession[]>(IPC_CHANNELS.ATTENDANCE_LIST_BY_CLASS, classId),
    getAll: (): Promise<AttendanceSession[]> => invokeChannel<AttendanceSession[]>(IPC_CHANNELS.ATTENDANCE_GET_ALL),
    save: (data: SaveAttendanceDTO): Promise<AttendanceSession> => invokeChannel<AttendanceSession>(IPC_CHANNELS.ATTENDANCE_SAVE, data),
    delete: (id: string): Promise<boolean> => invokeChannel<boolean>(IPC_CHANNELS.ATTENDANCE_DELETE, id),
  },

  // Evaluations
  evaluations: {
    listByClass: (classId: string): Promise<EvaluationItem[]> => invokeChannel<EvaluationItem[]>(IPC_CHANNELS.EVALUATIONS_LIST_BY_CLASS, classId),
    getAll: (): Promise<EvaluationItem[]> => invokeChannel<EvaluationItem[]>(IPC_CHANNELS.EVALUATIONS_GET_ALL),
    save: (data: SaveEvaluationDTO): Promise<EvaluationItem> => invokeChannel<EvaluationItem>(IPC_CHANNELS.EVALUATIONS_SAVE, data),
    delete: (id: string): Promise<boolean> => invokeChannel<boolean>(IPC_CHANNELS.EVALUATIONS_DELETE, id),
  },

  // Participations
  participations: {
    listByClass: (classId: string): Promise<ParticipationRecord[]> => invokeChannel<ParticipationRecord[]>(IPC_CHANNELS.PARTICIPATIONS_LIST_BY_CLASS, classId),
    getAll: (): Promise<ParticipationRecord[]> => invokeChannel<ParticipationRecord[]>(IPC_CHANNELS.PARTICIPATIONS_GET_ALL),
    create: (data: CreateParticipationDTO): Promise<ParticipationRecord> => invokeChannel<ParticipationRecord>(IPC_CHANNELS.PARTICIPATIONS_CREATE, data),
    delete: (id: string): Promise<boolean> => invokeChannel<boolean>(IPC_CHANNELS.PARTICIPATIONS_DELETE, id),
  },

  // Discipline / Occurrences
  occurrences: {
    listByClass: (classId: string): Promise<OccurrenceRecord[]> => invokeChannel<OccurrenceRecord[]>(IPC_CHANNELS.OCCURRENCES_LIST_BY_CLASS, classId),
    getAll: (): Promise<OccurrenceRecord[]> => invokeChannel<OccurrenceRecord[]>(IPC_CHANNELS.OCCURRENCES_GET_ALL),
    create: (data: CreateOccurrenceDTO): Promise<OccurrenceRecord> => invokeChannel<OccurrenceRecord>(IPC_CHANNELS.OCCURRENCES_CREATE, data),
    delete: (id: string): Promise<boolean> => invokeChannel<boolean>(IPC_CHANNELS.OCCURRENCES_DELETE, id),
  },

  // Settings
  settings: {
    getAll: (): Promise<AppSettings> => invokeChannel<AppSettings>(IPC_CHANNELS.SETTINGS_GET_ALL),
    get: (key: string): Promise<string | null> => invokeChannel<string | null>(IPC_CHANNELS.SETTINGS_GET, key),
    set: (key: string, value: string): Promise<void> => invokeChannel<void>(IPC_CHANNELS.SETTINGS_SET, key, value),
    update: (settings: Record<string, string>): Promise<AppSettings> => invokeChannel<AppSettings>(IPC_CHANNELS.SETTINGS_UPDATE, settings),
  },

  // Backup & Maintenance
  backup: {
    getPath: (): Promise<string> => invokeChannel<string>(IPC_CHANNELS.BACKUP_GET_PATH),
    export: (targetPath: string): Promise<{ success: boolean; filePath: string; sizeBytes: number }> =>
      invokeChannel(IPC_CHANNELS.BACKUP_EXPORT, targetPath),
    import: (sourcePath: string): Promise<{ success: boolean; message: string }> =>
      invokeChannel(IPC_CHANNELS.BACKUP_IMPORT, sourcePath),
  },
};

// Expose safe API to Renderer window
contextBridge.exposeInMainWorld('classDiaryAPI', api);

// Maintain backward-compatible electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => api.getAllData(),
  saveData: () => Promise.resolve(true),
});
