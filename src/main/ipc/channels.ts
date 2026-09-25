export const IPC_CHANNELS = {
  // App data (aggregate for fast initial render)
  APP_GET_ALL: 'app:getAll',

  // Classes
  CLASSES_LIST: 'classes:list',
  CLASSES_GET: 'classes:get',
  CLASSES_CREATE: 'classes:create',
  CLASSES_UPDATE: 'classes:update',
  CLASSES_DELETE: 'classes:delete',

  // Students
  STUDENTS_LIST_BY_CLASS: 'students:listByClass',
  STUDENTS_GET_ALL: 'students:getAll',
  STUDENTS_CREATE: 'students:create',
  STUDENTS_CREATE_BATCH: 'students:createBatch',
  STUDENTS_UPDATE: 'students:update',
  STUDENTS_DELETE: 'students:delete',

  // Attendance
  ATTENDANCE_LIST_BY_CLASS: 'attendance:listByClass',
  ATTENDANCE_GET_ALL: 'attendance:getAll',
  ATTENDANCE_SAVE: 'attendance:save',
  ATTENDANCE_DELETE: 'attendance:delete',

  // Evaluations
  EVALUATIONS_LIST_BY_CLASS: 'evaluations:listByClass',
  EVALUATIONS_GET_ALL: 'evaluations:getAll',
  EVALUATIONS_SAVE: 'evaluations:save',
  EVALUATIONS_DELETE: 'evaluations:delete',

  // Participations
  PARTICIPATIONS_LIST_BY_CLASS: 'participations:listByClass',
  PARTICIPATIONS_GET_ALL: 'participations:getAll',
  PARTICIPATIONS_CREATE: 'participations:create',
  PARTICIPATIONS_DELETE: 'participations:delete',

  // Discipline / Occurrences
  OCCURRENCES_LIST_BY_CLASS: 'occurrences:listByClass',
  OCCURRENCES_GET_ALL: 'occurrences:getAll',
  OCCURRENCES_CREATE: 'occurrences:create',
  OCCURRENCES_DELETE: 'occurrences:delete',

  // Settings
  SETTINGS_GET_ALL: 'settings:getAll',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_UPDATE: 'settings:update',

  // Backup & Maintenance
  BACKUP_GET_PATH: 'backup:getPath',
  BACKUP_EXPORT: 'backup:export',
  BACKUP_IMPORT: 'backup:import',

  // Legacy fallback support for older storage calls
  STORAGE_LOAD: 'storage:load',
  STORAGE_SAVE: 'storage:save',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
