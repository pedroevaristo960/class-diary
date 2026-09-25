import path from 'node:path';
import os from 'node:os';

export const APP_CONFIG = {
  APP_NAME: 'Class Diary',
  APP_ID: 'com.pedroevaristo.classdiary',
  DATABASE_FILENAME: 'class-diary.sqlite',
  DATABASE_SUBDIR: 'database',
  BACKUP_SUBDIR: 'backups',
  LOG_FILENAME: 'class-diary.log',
  DEFAULT_WIDTH: 1280,
  DEFAULT_HEIGHT: 820,
  MIN_WIDTH: 960,
  MIN_HEIGHT: 640,
  SCHEMA_VERSION: 1,
} as const;

export function getAppDataDir(): string {
  // If running in Electron, app.getPath('userData') will be used.
  // Fallback for tests or CLI scripts:
  if (process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'class-diary');
  }
  return path.join(os.homedir(), '.class-diary');
}

export function resolveDatabasePath(baseDir?: string): string {
  const dir = baseDir || getAppDataDir();
  return path.join(dir, APP_CONFIG.DATABASE_SUBDIR, APP_CONFIG.DATABASE_FILENAME);
}

export function isDev(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.VITE_DEV_SERVER_URL !== undefined;
}
