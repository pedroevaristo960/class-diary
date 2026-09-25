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
} from '../../shared/types.js';

export interface ClassDiaryAPI {
  getAllData: () => Promise<AppData>;
  classes: {
    list: () => Promise<Classroom[]>;
    get: (id: string) => Promise<Classroom>;
    create: (data: CreateClassDTO) => Promise<Classroom>;
    update: (id: string, data: UpdateClassDTO) => Promise<Classroom>;
    delete: (id: string) => Promise<boolean>;
  };
  students: {
    listByClass: (classId: string) => Promise<Student[]>;
    getAll: () => Promise<Student[]>;
    create: (data: CreateStudentDTO) => Promise<Student>;
    createBatch: (data: CreateStudentBatchDTO) => Promise<Student[]>;
    update: (id: string, data: Partial<CreateStudentDTO>) => Promise<Student>;
    delete: (id: string) => Promise<boolean>;
  };
  attendance: {
    listByClass: (classId: string) => Promise<AttendanceSession[]>;
    getAll: () => Promise<AttendanceSession[]>;
    save: (data: SaveAttendanceDTO) => Promise<AttendanceSession>;
    delete: (id: string) => Promise<boolean>;
  };
  evaluations: {
    listByClass: (classId: string) => Promise<EvaluationItem[]>;
    getAll: () => Promise<EvaluationItem[]>;
    save: (data: SaveEvaluationDTO) => Promise<EvaluationItem>;
    delete: (id: string) => Promise<boolean>;
  };
  participations: {
    listByClass: (classId: string) => Promise<ParticipationRecord[]>;
    getAll: () => Promise<ParticipationRecord[]>;
    create: (data: CreateParticipationDTO) => Promise<ParticipationRecord>;
    delete: (id: string) => Promise<boolean>;
  };
  occurrences: {
    listByClass: (classId: string) => Promise<OccurrenceRecord[]>;
    getAll: () => Promise<OccurrenceRecord[]>;
    create: (data: CreateOccurrenceDTO) => Promise<OccurrenceRecord>;
    delete: (id: string) => Promise<boolean>;
  };
  settings: {
    getAll: () => Promise<AppSettings>;
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
    update: (settings: Record<string, string>) => Promise<AppSettings>;
  };
  backup: {
    getPath: () => Promise<string>;
    export: (targetPath: string) => Promise<{ success: boolean; filePath: string; sizeBytes: number }>;
    import: (sourcePath: string) => Promise<{ success: boolean; message: string }>;
  };
}

declare global {
  interface Window {
    classDiaryAPI?: ClassDiaryAPI;
  }
}

// Browser fallback storage key for non-electron development preview
const BROWSER_FALLBACK_KEY = 'class_diary_browser_fallback_v1';

function getBrowserStorage(): AppData {
  try {
    const raw = localStorage.getItem(BROWSER_FALLBACK_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading browser storage:', err);
  }
  return {
    classes: [],
    students: [],
    attendances: [],
    evaluations: [],
    participations: [],
    occurrences: [],
    settings: {},
  };
}

function saveBrowserStorage(data: AppData): void {
  try {
    localStorage.setItem(BROWSER_FALLBACK_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed saving browser storage:', err);
  }
}

// Fallback implementation when running inside a regular browser tab
const fallbackAPI: ClassDiaryAPI = {
  getAllData: async () => getBrowserStorage(),
  classes: {
    list: async () => getBrowserStorage().classes,
    get: async (id: string) => {
      const cls = getBrowserStorage().classes.find((c) => c.id === id);
      if (!cls) throw new Error('Turma não encontrada');
      return cls;
    },
    create: async (data: CreateClassDTO) => {
      const db = getBrowserStorage();
      const newClass: Classroom = {
        id: `class_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
      };
      db.classes.push(newClass);
      saveBrowserStorage(db);
      return newClass;
    },
    update: async (id: string, data: UpdateClassDTO) => {
      const db = getBrowserStorage();
      const idx = db.classes.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Turma não encontrada');
      db.classes[idx] = { ...db.classes[idx], ...data };
      saveBrowserStorage(db);
      return db.classes[idx];
    },
    delete: async (id: string) => {
      const db = getBrowserStorage();
      db.classes = db.classes.filter((c) => c.id !== id);
      db.students = db.students.filter((s) => s.classId !== id);
      db.attendances = db.attendances.filter((a) => a.classId !== id);
      db.evaluations = db.evaluations.filter((e) => e.classId !== id);
      db.participations = db.participations.filter((p) => p.classId !== id);
      db.occurrences = db.occurrences.filter((o) => o.classId !== id);
      saveBrowserStorage(db);
      return true;
    },
  },
  students: {
    listByClass: async (classId: string) => getBrowserStorage().students.filter((s) => s.classId === classId),
    getAll: async () => getBrowserStorage().students,
    create: async (data: CreateStudentDTO) => {
      const db = getBrowserStorage();
      const newStd: Student = {
        id: `std_${Date.now()}`,
        classId: data.classId,
        name: data.name,
        number: data.number ?? db.students.filter((s) => s.classId === data.classId).length + 1,
        active: data.active ?? true,
        createdAt: new Date().toISOString(),
      };
      db.students.push(newStd);
      saveBrowserStorage(db);
      return newStd;
    },
    createBatch: async (data: CreateStudentBatchDTO) => {
      const db = getBrowserStorage();
      let currentNumber = db.students.filter((s) => s.classId === data.classId).length + 1;
      const created: Student[] = data.names.map((name) => ({
        id: `std_${Date.now()}_${Math.random()}`,
        classId: data.classId,
        name,
        number: currentNumber++,
        active: true,
        createdAt: new Date().toISOString(),
      }));
      db.students.push(...created);
      saveBrowserStorage(db);
      return created;
    },
    update: async (id: string, data: Partial<CreateStudentDTO>) => {
      const db = getBrowserStorage();
      const idx = db.students.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error('Aluno não encontrado');
      db.students[idx] = { ...db.students[idx], ...data };
      saveBrowserStorage(db);
      return db.students[idx];
    },
    delete: async (id: string) => {
      const db = getBrowserStorage();
      db.students = db.students.filter((s) => s.id !== id);
      saveBrowserStorage(db);
      return true;
    },
  },
  attendance: {
    listByClass: async (classId: string) => getBrowserStorage().attendances.filter((a) => a.classId === classId),
    getAll: async () => getBrowserStorage().attendances,
    save: async (data: SaveAttendanceDTO) => {
      const db = getBrowserStorage();
      const idx = db.attendances.findIndex((a) => a.classId === data.classId && a.date === data.date);
      const session: AttendanceSession = {
        id: data.id || (idx >= 0 ? db.attendances[idx].id : `att_${Date.now()}`),
        classId: data.classId,
        date: data.date,
        records: data.records,
        completedAt: data.completedAt,
        createdAt: new Date().toISOString(),
      };
      if (idx >= 0) {
        db.attendances[idx] = session;
      } else {
        db.attendances.push(session);
      }
      saveBrowserStorage(db);
      return session;
    },
    delete: async (id: string) => {
      const db = getBrowserStorage();
      db.attendances = db.attendances.filter((a) => a.id !== id);
      saveBrowserStorage(db);
      return true;
    },
  },
  evaluations: {
    listByClass: async (classId: string) => getBrowserStorage().evaluations.filter((e) => e.classId === classId),
    getAll: async () => getBrowserStorage().evaluations,
    save: async (data: SaveEvaluationDTO) => {
      const db = getBrowserStorage();
      const idx = data.id ? db.evaluations.findIndex((e) => e.id === data.id) : -1;
      const evaluation: EvaluationItem = {
        id: data.id || `eval_${Date.now()}`,
        classId: data.classId,
        title: data.title,
        type: data.type,
        date: data.date,
        maxScore: data.maxScore,
        scores: data.scores,
        createdAt: new Date().toISOString(),
      };
      if (idx >= 0) {
        db.evaluations[idx] = evaluation;
      } else {
        db.evaluations.push(evaluation);
      }
      saveBrowserStorage(db);
      return evaluation;
    },
    delete: async (id: string) => {
      const db = getBrowserStorage();
      db.evaluations = db.evaluations.filter((e) => e.id !== id);
      saveBrowserStorage(db);
      return true;
    },
  },
  participations: {
    listByClass: async (classId: string) => getBrowserStorage().participations.filter((p) => p.classId === classId),
    getAll: async () => getBrowserStorage().participations,
    create: async (data: CreateParticipationDTO) => {
      const db = getBrowserStorage();
      const part: ParticipationRecord = {
        id: `part_${Date.now()}`,
        classId: data.classId,
        studentId: data.studentId,
        date: data.date,
        type: data.type,
        note: data.note,
        timestamp: data.timestamp || new Date().toISOString(),
      };
      db.participations.push(part);
      saveBrowserStorage(db);
      return part;
    },
    delete: async (id: string) => {
      const db = getBrowserStorage();
      db.participations = db.participations.filter((p) => p.id !== id);
      saveBrowserStorage(db);
      return true;
    },
  },
  occurrences: {
    listByClass: async (classId: string) => getBrowserStorage().occurrences.filter((o) => o.classId === classId),
    getAll: async () => getBrowserStorage().occurrences,
    create: async (data: CreateOccurrenceDTO) => {
      const db = getBrowserStorage();
      const occ: OccurrenceRecord = {
        id: `occ_${Date.now()}`,
        classId: data.classId,
        studentId: data.studentId,
        date: data.date,
        reason: data.reason,
        note: data.note,
        timestamp: data.timestamp || new Date().toISOString(),
      };
      db.occurrences.push(occ);
      saveBrowserStorage(db);
      return occ;
    },
    delete: async (id: string) => {
      const db = getBrowserStorage();
      db.occurrences = db.occurrences.filter((o) => o.id !== id);
      saveBrowserStorage(db);
      return true;
    },
  },
  settings: {
    getAll: async () => getBrowserStorage().settings || {},
    get: async (key: string) => (getBrowserStorage().settings || {})[key] ?? null,
    set: async (key: string, value: string) => {
      const db = getBrowserStorage();
      db.settings = { ...(db.settings || {}), [key]: value };
      saveBrowserStorage(db);
    },
    update: async (settings: Record<string, string>) => {
      const db = getBrowserStorage();
      db.settings = { ...(db.settings || {}), ...settings };
      saveBrowserStorage(db);
      return db.settings;
    },
  },
  backup: {
    getPath: async () => 'LocalStorage fallback',
    export: async () => ({ success: true, filePath: 'browser-memory', sizeBytes: 0 }),
    import: async () => ({ success: true, message: 'Restaurado no browser.' }),
  },
};

export const apiClient: ClassDiaryAPI = typeof window !== 'undefined' && window.classDiaryAPI
  ? window.classDiaryAPI
  : fallbackAPI;
