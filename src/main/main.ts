import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { logger } from './logger.js';
import { APP_CONFIG, resolveDatabasePath } from './config/appConfig.js';
import { dbConnection } from './database/connection.js';
import { setupMigrations, migrator } from './database/migrations/index.js';
import { ClassRepository } from './database/repositories/ClassRepository.js';
import { StudentRepository } from './database/repositories/StudentRepository.js';
import { AttendanceRepository } from './database/repositories/AttendanceRepository.js';
import { EvaluationRepository } from './database/repositories/EvaluationRepository.js';
import { ParticipationRepository } from './database/repositories/ParticipationRepository.js';
import { DisciplineRepository } from './database/repositories/DisciplineRepository.js';
import { SettingsRepository } from './database/repositories/SettingsRepository.js';
import { ClassService } from './services/ClassService.js';
import { StudentService } from './services/StudentService.js';
import { AttendanceService } from './services/AttendanceService.js';
import { EvaluationService } from './services/EvaluationService.js';
import { ParticipationService } from './services/ParticipationService.js';
import { DisciplineService } from './services/DisciplineService.js';
import { SettingsService } from './services/SettingsService.js';
import { BackupService } from './services/BackupService.js';
import { registerIpcHandlers } from './ipc/registerHandlers.js';

let mainWindow: BrowserWindow | null = null;

function initializeApp(): void {
  const userDataDir = app.getPath('userData');
  const logsDir = path.join(userDataDir, 'logs');
  logger.init(logsDir, APP_CONFIG.LOG_FILENAME);

  logger.info(`Starting ${APP_CONFIG.APP_NAME}`, {
    version: app.getVersion(),
    userDataDir,
    platform: process.platform,
    arch: process.arch,
  });

  // 1. Initialize SQLite Database
  const dbPath = resolveDatabasePath(userDataDir);
  const db = dbConnection.init(dbPath);

  // 2. Setup and run migrations
  setupMigrations();
  migrator.run(db);

  // 3. Instantiate Repositories
  const classRepo = new ClassRepository(db);
  const studentRepo = new StudentRepository(db);
  const attendanceRepo = new AttendanceRepository(db);
  const evalRepo = new EvaluationRepository(db);
  const partRepo = new ParticipationRepository(db);
  const discRepo = new DisciplineRepository(db);
  const settingsRepo = new SettingsRepository(db);

  // 4. Instantiate Services
  const classService = new ClassService(classRepo);
  const studentService = new StudentService(studentRepo);
  const attendanceService = new AttendanceService(attendanceRepo);
  const evaluationService = new EvaluationService(evalRepo);
  const participationService = new ParticipationService(partRepo);
  const disciplineService = new DisciplineService(discRepo);
  const settingsService = new SettingsService(settingsRepo);
  const backupService = new BackupService();

  // 5. Register IPC Handlers
  registerIpcHandlers({
    classService,
    studentService,
    attendanceService,
    evaluationService,
    participationService,
    disciplineService,
    settingsService,
    backupService,
  });
}

function createWindow(): void {
  // Preload path: points to compiled preload.cjs / preload.js alongside main.js
  const preloadPath = path.join(import.meta.dirname, 'preload.cjs');
  const fallbackPreload = path.join(import.meta.dirname, 'preload.js');
  const resolvedPreload = fs.existsSync(preloadPath) ? preloadPath : fallbackPreload;

  // Icon path for development and production
  const iconPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'icon-512x512.png')
    : path.join(import.meta.dirname, '../../public/icon-512x512.png');

  mainWindow = new BrowserWindow({
    width: APP_CONFIG.DEFAULT_WIDTH,
    height: APP_CONFIG.DEFAULT_HEIGHT,
    minWidth: APP_CONFIG.MIN_WIDTH,
    minHeight: APP_CONFIG.MIN_HEIGHT,
    title: APP_CONFIG.APP_NAME,
    icon: iconPath,
    webPreferences: {
      preload: resolvedPreload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Remove default menu in production
  if (app.isPackaged) {
    mainWindow.removeMenu();
  }

  // Load from Vite dev server or production index.html
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    logger.info('Loading dev server URL', { devServerUrl });
    mainWindow.loadURL(devServerUrl);
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist-react', 'index.html');
    logger.info('Loading production index file', { indexPath });
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  try {
    initializeApp();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (err) {
    logger.error('Critical initialization error:', { error: String(err) });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  logger.info('Application is shutting down. Closing database connection...');
  dbConnection.close();
});
