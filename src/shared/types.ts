export type Period = 'Manhã' | 'Tarde' | 'Noite';

export interface Classroom {
  id: string;
  name: string;      // e.g. "11ª Informática"
  course: string;    // e.g. "Informática"
  grade: string;     // e.g. "11ª"
  period: Period;    // e.g. "Manhã"
  createdAt: string;
}

export interface Student {
  id: string;
  classId: string;
  name: string;
  number?: number;
  active: boolean;
  createdAt?: string;
}

export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  records: Record<string, AttendanceStatus>; // studentId -> status
  completedAt?: string;
  createdAt?: string;
}

export type EvaluationType = 'Teste' | 'Trabalho' | 'Prova' | 'Exercício';

export interface EvaluationItem {
  id: string;
  classId: string;
  title: string;
  type: EvaluationType;
  date: string;
  maxScore: number;
  scores: Record<string, number>; // studentId -> score
  createdAt?: string;
}

export type ParticipationType = 'positive' | 'negative';

export interface ParticipationRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  type: ParticipationType;
  note?: string;
  timestamp: string;
}

export type OccurrenceReason = 
  | 'Conversa' 
  | 'Atraso' 
  | 'Uso indevido do telefone' 
  | 'Perturbação' 
  | 'Outro';

export interface OccurrenceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  reason: OccurrenceReason;
  note?: string;
  timestamp: string;
}

export interface AppSettings {
  teacherName?: string;
  defaultCourse?: string;
  schoolYear?: string;
  institutionName?: string;
  theme?: 'dark' | 'light';
  [key: string]: string | undefined;
}

export interface AppData {
  classes: Classroom[];
  students: Student[];
  attendances: AttendanceSession[];
  evaluations: EvaluationItem[];
  participations: ParticipationRecord[];
  occurrences: OccurrenceRecord[];
  settings?: AppSettings;
}

export type Screen = 
  | 'classes'
  | 'class_menu'
  | 'students'
  | 'attendance'
  | 'evaluations'
  | 'participation'
  | 'discipline'
  | 'history'
  | 'reports';

// DTOs for mutations
export interface CreateClassDTO {
  name: string;
  course: string;
  grade: string;
  period: Period;
}

export interface UpdateClassDTO {
  name?: string;
  course?: string;
  grade?: string;
  period?: Period;
}

export interface CreateStudentDTO {
  classId: string;
  name: string;
  number?: number;
  active?: boolean;
}

export interface CreateStudentBatchDTO {
  classId: string;
  names: string[];
}

export interface SaveAttendanceDTO {
  id?: string;
  classId: string;
  date: string;
  records: Record<string, AttendanceStatus>;
  completedAt?: string;
}

export interface SaveEvaluationDTO {
  id?: string;
  classId: string;
  title: string;
  type: EvaluationType;
  date: string;
  maxScore: number;
  scores: Record<string, number>;
}

export interface CreateParticipationDTO {
  classId: string;
  studentId: string;
  date: string;
  type: ParticipationType;
  note?: string;
  timestamp?: string;
}

export interface CreateOccurrenceDTO {
  classId: string;
  studentId: string;
  date: string;
  reason: OccurrenceReason;
  note?: string;
  timestamp?: string;
}

export interface BackupMetadata {
  exportedAt: string;
  version: number;
  dbPath: string;
  fileSizeBytes: number;
}
