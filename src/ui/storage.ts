import type { AppData, Classroom, Student } from './types';

const STORAGE_KEY = 'class_diary_data_v1';

const INITIAL_CLASSES: Classroom[] = [
  {
    id: 'class-1',
    name: '11ª Informática',
    course: 'Informática',
    grade: '11ª',
    period: 'Manhã',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    id: 'class-2',
    name: '10ª Eletrónica',
    course: 'Eletrónica',
    grade: '10ª',
    period: 'Tarde',
    createdAt: '2026-09-01T13:00:00.000Z'
  }
];

const INITIAL_STUDENTS: Student[] = [
  { id: 'std-1', classId: 'class-1', name: 'Alberto Manuel', number: 1, active: true },
  { id: 'std-2', classId: 'class-1', name: 'António José', number: 2, active: true },
  { id: 'std-3', classId: 'class-1', name: 'Carlos Pedro', number: 3, active: true },
  { id: 'std-4', classId: 'class-1', name: 'João Paulo', number: 4, active: true },
  { id: 'std-5', classId: 'class-1', name: 'Manuel Domingos', number: 5, active: true },
  { id: 'std-6', classId: 'class-1', name: 'Zacarias Gomes', number: 6, active: true },
  // Students for class 2
  { id: 'std-7', classId: 'class-2', name: 'Ana Luísa', number: 1, active: true },
  { id: 'std-8', classId: 'class-2', name: 'Bernardo Silva', number: 2, active: true },
  { id: 'std-9', classId: 'class-2', name: 'Domingos Neto', number: 3, active: true }
];

const INITIAL_DATA: AppData = {
  classes: INITIAL_CLASSES,
  students: INITIAL_STUDENTS,
  attendances: [
    {
      id: 'att-1',
      classId: 'class-1',
      date: '2026-09-20',
      records: {
        'std-1': 'present',
        'std-2': 'present',
        'std-3': 'absent',
        'std-4': 'present',
        'std-5': 'present',
        'std-6': 'present'
      },
      completedAt: '2026-09-20T08:15:00.000Z'
    },
    {
      id: 'att-2',
      classId: 'class-1',
      date: '2026-09-22',
      records: {
        'std-1': 'present',
        'std-2': 'present',
        'std-3': 'present',
        'std-4': 'present',
        'std-5': 'absent',
        'std-6': 'present'
      },
      completedAt: '2026-09-22T08:10:00.000Z'
    }
  ],
  evaluations: [
    {
      id: 'eval-1',
      classId: 'class-1',
      title: 'Teste 1 - Algoritmos',
      type: 'Teste',
      date: '2026-09-18',
      maxScore: 20,
      scores: {
        'std-1': 15,
        'std-2': 13,
        'std-3': 17,
        'std-4': 14,
        'std-5': 12,
        'std-6': 16
      }
    }
  ],
  participations: [
    {
      id: 'part-1',
      classId: 'class-1',
      studentId: 'std-1',
      date: '2026-09-18',
      type: 'positive',
      timestamp: '2026-09-18T09:20:00.000Z'
    },
    {
      id: 'part-2',
      classId: 'class-1',
      studentId: 'std-3',
      date: '2026-09-22',
      type: 'positive',
      timestamp: '2026-09-22T08:45:00.000Z'
    }
  ],
  occurrences: [
    {
      id: 'occ-1',
      classId: 'class-1',
      studentId: 'std-1',
      date: '2026-09-15',
      reason: 'Conversa',
      note: 'conversa durante a aula',
      timestamp: '2026-09-15T09:10:00.000Z'
    }
  ]
};

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveAppData(INITIAL_DATA);
      return INITIAL_DATA;
    }
    const parsed = JSON.parse(raw);
    return {
      classes: parsed.classes || [],
      students: parsed.students || [],
      attendances: parsed.attendances || [],
      evaluations: parsed.evaluations || [],
      participations: parsed.participations || [],
      occurrences: parsed.occurrences || []
    };
  } catch (err) {
    console.error('Error loading app data from localStorage:', err);
    return INITIAL_DATA;
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving app data to localStorage:', err);
  }
}
