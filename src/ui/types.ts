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
}

export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  records: Record<string, AttendanceStatus>; // studentId -> status
  completedAt?: string;
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

export interface AppData {
  classes: Classroom[];
  students: Student[];
  attendances: AttendanceSession[];
  evaluations: EvaluationItem[];
  participations: ParticipationRecord[];
  occurrences: OccurrenceRecord[];
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
