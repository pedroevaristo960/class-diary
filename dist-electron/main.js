import { BrowserWindow, app, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { DatabaseSync } from "node:sqlite";
//#region src/main/logger.ts
var Logger = class {
	logFilePath = null;
	init(logDir, logFileName = "class-diary.log") {
		try {
			if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
			this.logFilePath = path.join(logDir, logFileName);
			this.info("Logger initialized", { logFilePath: this.logFilePath });
		} catch (err) {
			console.error("Failed to initialize file logger:", err);
		}
	}
	write(level, message, context) {
		const logLine = `[${(/* @__PURE__ */ new Date()).toISOString()}] [${level}] ${message}${context ? ` | ${typeof context === "object" ? JSON.stringify(context) : String(context)}` : ""}\n`;
		if (level === "ERROR") console.error(logLine.trim());
		else if (level === "WARN") console.warn(logLine.trim());
		else console.log(logLine.trim());
		if (this.logFilePath) try {
			fs.appendFileSync(this.logFilePath, logLine, "utf-8");
		} catch (err) {
			console.error("Failed to append to log file:", err);
		}
	}
	debug(message, context) {
		this.write("DEBUG", message, context);
	}
	info(message, context) {
		this.write("INFO", message, context);
	}
	warn(message, context) {
		this.write("WARN", message, context);
	}
	error(message, context) {
		this.write("ERROR", message, context);
	}
};
var logger = new Logger();
//#endregion
//#region src/main/config/appConfig.ts
var APP_CONFIG = {
	APP_NAME: "Class Diary",
	APP_ID: "com.pedroevaristo.classdiary",
	DATABASE_FILENAME: "class-diary.sqlite",
	DATABASE_SUBDIR: "database",
	BACKUP_SUBDIR: "backups",
	LOG_FILENAME: "class-diary.log",
	DEFAULT_WIDTH: 1280,
	DEFAULT_HEIGHT: 820,
	MIN_WIDTH: 960,
	MIN_HEIGHT: 640,
	SCHEMA_VERSION: 1
};
function getAppDataDir() {
	if (process.env.APPDATA) return path.join(process.env.APPDATA, "class-diary");
	return path.join(os.homedir(), ".class-diary");
}
function resolveDatabasePath(baseDir) {
	const dir = baseDir || getAppDataDir();
	return path.join(dir, APP_CONFIG.DATABASE_SUBDIR, APP_CONFIG.DATABASE_FILENAME);
}
//#endregion
//#region src/main/database/connection.ts
var DatabaseConnection = class {
	db = null;
	currentDbPath = null;
	init(dbPath) {
		if (this.db) return this.db;
		const resolvedPath = dbPath || resolveDatabasePath();
		const dbDir = path.dirname(resolvedPath);
		try {
			if (!fs.existsSync(dbDir)) {
				fs.mkdirSync(dbDir, { recursive: true });
				logger.info("Database directory created", { dbDir });
			}
			logger.info("Opening SQLite database connection", { path: resolvedPath });
			const db = new DatabaseSync(resolvedPath);
			db.exec("PRAGMA foreign_keys = ON;");
			db.exec("PRAGMA journal_mode = WAL;");
			db.exec("PRAGMA synchronous = NORMAL;");
			db.exec("PRAGMA busy_timeout = 5000;");
			this.db = db;
			this.currentDbPath = resolvedPath;
			logger.info("SQLite database connected successfully", { path: resolvedPath });
			return db;
		} catch (err) {
			logger.error("Failed to initialize SQLite database", {
				error: String(err),
				path: resolvedPath
			});
			throw new Error(`Falha ao abrir a base de dados local: ${err instanceof Error ? err.message : String(err)}`);
		}
	}
	getDb() {
		if (!this.db) throw new Error("A conexão à base de dados não foi inicializada.");
		return this.db;
	}
	getDbPath() {
		if (!this.currentDbPath) throw new Error("Caminho da base de dados não definido.");
		return this.currentDbPath;
	}
	transaction(action) {
		const db = this.getDb();
		db.exec("BEGIN TRANSACTION;");
		try {
			const result = action();
			db.exec("COMMIT;");
			return result;
		} catch (err) {
			db.exec("ROLLBACK;");
			logger.error("Transaction rolled back due to error", { error: String(err) });
			throw err;
		}
	}
	close() {
		if (this.db) try {
			this.db.close();
			logger.info("SQLite connection closed cleanly");
		} catch (err) {
			logger.error("Error closing SQLite database", { error: String(err) });
		} finally {
			this.db = null;
			this.currentDbPath = null;
		}
	}
};
var dbConnection = new DatabaseConnection();
//#endregion
//#region src/main/database/migrations/migrator.ts
var Migrator = class {
	migrations = [];
	register(migration) {
		this.migrations.push(migration);
		this.migrations.sort((a, b) => a.version - b.version);
	}
	run(db) {
		logger.info("Checking database migrations...");
		db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);
		const appliedRows = db.prepare("SELECT version FROM schema_migrations").all();
		const appliedVersions = new Set(appliedRows.map((r) => r.version));
		for (const migration of this.migrations) if (!appliedVersions.has(migration.version)) {
			logger.info(`Applying migration ${migration.version}: ${migration.name}`);
			db.exec("BEGIN TRANSACTION;");
			try {
				migration.up(db);
				db.prepare("INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)").run(migration.version, migration.name, (/* @__PURE__ */ new Date()).toISOString());
				db.exec("COMMIT;");
				logger.info(`Migration ${migration.version} applied successfully`);
			} catch (err) {
				db.exec("ROLLBACK;");
				logger.error(`Migration ${migration.version} failed`, { error: String(err) });
				throw new Error(`Erro ao aplicar migration ${migration.version} (${migration.name}): ${err instanceof Error ? err.message : String(err)}`);
			}
		}
		logger.info("Database migrations completed successfully");
	}
	getAppliedVersions(db) {
		try {
			return db.prepare("SELECT version FROM schema_migrations ORDER BY version ASC").all().map((r) => r.version);
		} catch {
			return [];
		}
	}
};
var migrator = new Migrator();
//#endregion
//#region src/main/database/migrations/001_initial_schema.ts
var migration001 = {
	version: 1,
	name: "001_initial_schema",
	up: (db) => {
		db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
		db.exec(`
      CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        course TEXT NOT NULL,
        grade TEXT NOT NULL,
        period TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_classes_created_at ON classes(created_at);
    `);
		db.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        number INTEGER,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
      CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
    `);
		db.exec(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(class_id, date)
      );
      CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_date ON attendance_sessions(class_id, date);
    `);
		db.exec(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(session_id, student_id)
      );
      CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
    `);
		db.exec(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        max_score REAL NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_evaluations_class ON evaluations(class_id);
      CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(date);
    `);
		db.exec(`
      CREATE TABLE IF NOT EXISTS evaluation_scores (
        id TEXT PRIMARY KEY,
        evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        score REAL NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(evaluation_id, student_id)
      );
      CREATE INDEX IF NOT EXISTS idx_evaluation_scores_eval ON evaluation_scores(evaluation_id);
      CREATE INDEX IF NOT EXISTS idx_evaluation_scores_student ON evaluation_scores(student_id);
    `);
		db.exec(`
      CREATE TABLE IF NOT EXISTS participations (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        note TEXT,
        timestamp TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_participations_class_student ON participations(class_id, student_id);
      CREATE INDEX IF NOT EXISTS idx_participations_date ON participations(date);
    `);
		db.exec(`
      CREATE TABLE IF NOT EXISTS occurrences (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        reason TEXT NOT NULL,
        note TEXT,
        timestamp TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_occurrences_class_student ON occurrences(class_id, student_id);
      CREATE INDEX IF NOT EXISTS idx_occurrences_date ON occurrences(date);
    `);
	}
};
//#endregion
//#region src/main/database/migrations/002_initial_seed.ts
var migration002 = {
	version: 2,
	name: "002_initial_seed_and_legacy_migration",
	up: (db) => {
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)");
		insertSetting.run("teacher_name", "", now);
		insertSetting.run("default_course", "", now);
		insertSetting.run("school_year", "2026/2027", now);
		insertSetting.run("theme", "dark", now);
		const legacyPath = path.join(getAppDataDir(), "class_diary_data.json");
		if (fs.existsSync(legacyPath)) try {
			logger.info("Found legacy class_diary_data.json. Migrating to SQLite...", { legacyPath });
			const raw = fs.readFileSync(legacyPath, "utf-8");
			const legacyData = JSON.parse(raw);
			if (Array.isArray(legacyData.classes)) {
				const insertClass = db.prepare("INSERT OR IGNORE INTO classes (id, name, course, grade, period, created_at) VALUES (?, ?, ?, ?, ?, ?)");
				for (const cls of legacyData.classes) insertClass.run(cls.id, cls.name, cls.course, cls.grade, cls.period, cls.createdAt || now);
			}
			if (Array.isArray(legacyData.students)) {
				const insertStudent = db.prepare("INSERT OR IGNORE INTO students (id, class_id, name, number, active, created_at) VALUES (?, ?, ?, ?, ?, ?)");
				for (const std of legacyData.students) insertStudent.run(std.id, std.classId, std.name, std.number ?? null, std.active ? 1 : 0, std.createdAt || now);
			}
			if (Array.isArray(legacyData.attendances)) {
				const insertSession = db.prepare("INSERT OR IGNORE INTO attendance_sessions (id, class_id, date, completed_at, created_at) VALUES (?, ?, ?, ?, ?)");
				const insertRecord = db.prepare("INSERT OR IGNORE INTO attendance_records (id, session_id, student_id, status, created_at) VALUES (?, ?, ?, ?, ?)");
				for (const att of legacyData.attendances) {
					insertSession.run(att.id, att.classId, att.date, att.completedAt ?? null, att.createdAt || now);
					if (att.records) for (const [studentId, status] of Object.entries(att.records)) insertRecord.run(`rec_${att.id}_${studentId}`, att.id, studentId, status, now);
				}
			}
			if (Array.isArray(legacyData.evaluations)) {
				const insertEval = db.prepare("INSERT OR IGNORE INTO evaluations (id, class_id, title, type, date, max_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
				const insertScore = db.prepare("INSERT OR IGNORE INTO evaluation_scores (id, evaluation_id, student_id, score, created_at) VALUES (?, ?, ?, ?, ?)");
				for (const ev of legacyData.evaluations) {
					insertEval.run(ev.id, ev.classId, ev.title, ev.type, ev.date, ev.maxScore, ev.createdAt || now);
					if (ev.scores) for (const [studentId, score] of Object.entries(ev.scores)) insertScore.run(`scr_${ev.id}_${studentId}`, ev.id, studentId, score, now);
				}
			}
			if (Array.isArray(legacyData.participations)) {
				const insertPart = db.prepare("INSERT OR IGNORE INTO participations (id, class_id, student_id, date, type, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)");
				for (const pt of legacyData.participations) insertPart.run(pt.id, pt.classId, pt.studentId, pt.date, pt.type, pt.note ?? null, pt.timestamp || now);
			}
			if (Array.isArray(legacyData.occurrences)) {
				const insertOcc = db.prepare("INSERT OR IGNORE INTO occurrences (id, class_id, student_id, date, reason, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)");
				for (const oc of legacyData.occurrences) insertOcc.run(oc.id, oc.classId, oc.studentId, oc.date, oc.reason, oc.note ?? null, oc.timestamp || now);
			}
			logger.info("Legacy migration completed successfully");
		} catch (err) {
			logger.error("Error migrating legacy data:", { error: String(err) });
		}
	}
};
//#endregion
//#region src/main/database/migrations/index.ts
function setupMigrations() {
	migrator.register(migration001);
	migrator.register(migration002);
}
//#endregion
//#region src/main/database/repositories/ClassRepository.ts
var ClassRepository = class {
	db;
	constructor(db) {
		this.db = db;
	}
	findAll() {
		return this.db.prepare("SELECT id, name, course, grade, period, created_at FROM classes ORDER BY created_at ASC").all().map((row) => ({
			id: row.id,
			name: row.name,
			course: row.course,
			grade: row.grade,
			period: row.period,
			createdAt: row.created_at
		}));
	}
	findById(id) {
		const row = this.db.prepare("SELECT id, name, course, grade, period, created_at FROM classes WHERE id = ?").get(id);
		if (!row) return null;
		return {
			id: row.id,
			name: row.name,
			course: row.course,
			grade: row.grade,
			period: row.period,
			createdAt: row.created_at
		};
	}
	create(id, data, createdAt) {
		this.db.prepare("INSERT INTO classes (id, name, course, grade, period, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, data.name, data.course, data.grade, data.period, createdAt);
		return {
			id,
			name: data.name,
			course: data.course,
			grade: data.grade,
			period: data.period,
			createdAt
		};
	}
	update(id, data) {
		const existing = this.findById(id);
		if (!existing) return null;
		const updated = {
			...existing,
			name: data.name ?? existing.name,
			course: data.course ?? existing.course,
			grade: data.grade ?? existing.grade,
			period: data.period ?? existing.period
		};
		this.db.prepare("UPDATE classes SET name = ?, course = ?, grade = ?, period = ? WHERE id = ?").run(updated.name, updated.course, updated.grade, updated.period, id);
		return updated;
	}
	delete(id) {
		this.db.prepare("DELETE FROM classes WHERE id = ?").run(id);
		return true;
	}
};
//#endregion
//#region src/main/database/repositories/StudentRepository.ts
var StudentRepository = class {
	db;
	constructor(db) {
		this.db = db;
	}
	findAll() {
		return this.db.prepare("SELECT id, class_id, name, number, active, created_at FROM students ORDER BY number ASC, name ASC").all().map((row) => ({
			id: row.id,
			classId: row.class_id,
			name: row.name,
			number: row.number ?? void 0,
			active: row.active === 1,
			createdAt: row.created_at
		}));
	}
	findByClassId(classId) {
		return this.db.prepare("SELECT id, class_id, name, number, active, created_at FROM students WHERE class_id = ? ORDER BY number ASC, name ASC").all(classId).map((row) => ({
			id: row.id,
			classId: row.class_id,
			name: row.name,
			number: row.number ?? void 0,
			active: row.active === 1,
			createdAt: row.created_at
		}));
	}
	findById(id) {
		const row = this.db.prepare("SELECT id, class_id, name, number, active, created_at FROM students WHERE id = ?").get(id);
		if (!row) return null;
		return {
			id: row.id,
			classId: row.class_id,
			name: row.name,
			number: row.number ?? void 0,
			active: row.active === 1,
			createdAt: row.created_at
		};
	}
	create(id, data, createdAt) {
		const stmt = this.db.prepare("INSERT INTO students (id, class_id, name, number, active, created_at) VALUES (?, ?, ?, ?, ?, ?)");
		const activeInt = data.active !== false ? 1 : 0;
		stmt.run(id, data.classId, data.name, data.number ?? null, activeInt, createdAt);
		return {
			id,
			classId: data.classId,
			name: data.name,
			number: data.number,
			active: activeInt === 1,
			createdAt
		};
	}
	createBatch(students) {
		const stmt = this.db.prepare("INSERT INTO students (id, class_id, name, number, active, created_at) VALUES (?, ?, ?, ?, ?, ?)");
		for (const s of students) stmt.run(s.id, s.classId, s.name, s.number ?? null, s.active ? 1 : 0, s.createdAt);
		return students;
	}
	update(id, data) {
		const existing = this.findById(id);
		if (!existing) return null;
		const updated = {
			...existing,
			name: data.name ?? existing.name,
			number: data.number !== void 0 ? data.number : existing.number,
			active: data.active !== void 0 ? data.active : existing.active
		};
		this.db.prepare("UPDATE students SET name = ?, number = ?, active = ? WHERE id = ?").run(updated.name, updated.number ?? null, updated.active ? 1 : 0, id);
		return updated;
	}
	delete(id) {
		this.db.prepare("DELETE FROM students WHERE id = ?").run(id);
		return true;
	}
};
//#endregion
//#region src/main/database/repositories/AttendanceRepository.ts
var AttendanceRepository = class {
	db;
	constructor(db) {
		this.db = db;
	}
	findAll() {
		const sessionRows = this.db.prepare("SELECT id, class_id, date, completed_at, created_at FROM attendance_sessions ORDER BY date DESC").all();
		if (sessionRows.length === 0) return [];
		const recordRows = this.db.prepare("SELECT session_id, student_id, status FROM attendance_records").all();
		const recordsBySession = /* @__PURE__ */ new Map();
		for (const r of recordRows) {
			if (!recordsBySession.has(r.session_id)) recordsBySession.set(r.session_id, {});
			recordsBySession.get(r.session_id)[r.student_id] = r.status;
		}
		return sessionRows.map((s) => ({
			id: s.id,
			classId: s.class_id,
			date: s.date,
			records: recordsBySession.get(s.id) || {},
			completedAt: s.completed_at ?? void 0,
			createdAt: s.created_at
		}));
	}
	findByClassId(classId) {
		const sessionRows = this.db.prepare("SELECT id, class_id, date, completed_at, created_at FROM attendance_sessions WHERE class_id = ? ORDER BY date DESC").all(classId);
		if (sessionRows.length === 0) return [];
		const sessionIds = sessionRows.map((s) => s.id);
		const placeholders = sessionIds.map(() => "?").join(",");
		const recordRows = this.db.prepare(`SELECT session_id, student_id, status FROM attendance_records WHERE session_id IN (${placeholders})`).all(...sessionIds);
		const recordsBySession = /* @__PURE__ */ new Map();
		for (const r of recordRows) {
			if (!recordsBySession.has(r.session_id)) recordsBySession.set(r.session_id, {});
			recordsBySession.get(r.session_id)[r.student_id] = r.status;
		}
		return sessionRows.map((s) => ({
			id: s.id,
			classId: s.class_id,
			date: s.date,
			records: recordsBySession.get(s.id) || {},
			completedAt: s.completed_at ?? void 0,
			createdAt: s.created_at
		}));
	}
	findByClassAndDate(classId, date) {
		const sessionRow = this.db.prepare("SELECT id, class_id, date, completed_at, created_at FROM attendance_sessions WHERE class_id = ? AND date = ?").get(classId, date);
		if (!sessionRow) return null;
		const recordRows = this.db.prepare("SELECT session_id, student_id, status FROM attendance_records WHERE session_id = ?").all(sessionRow.id);
		const records = {};
		for (const r of recordRows) records[r.student_id] = r.status;
		return {
			id: sessionRow.id,
			classId: sessionRow.class_id,
			date: sessionRow.date,
			records,
			completedAt: sessionRow.completed_at ?? void 0,
			createdAt: sessionRow.created_at
		};
	}
	saveSession(id, data, now) {
		const existing = this.findByClassAndDate(data.classId, data.date);
		const sessionId = existing ? existing.id : id;
		if (existing) this.db.prepare("UPDATE attendance_sessions SET completed_at = ? WHERE id = ?").run(data.completedAt ?? existing.completedAt ?? null, sessionId);
		else this.db.prepare("INSERT INTO attendance_sessions (id, class_id, date, completed_at, created_at) VALUES (?, ?, ?, ?, ?)").run(sessionId, data.classId, data.date, data.completedAt ?? null, now);
		const upsertRecord = this.db.prepare(`
      INSERT INTO attendance_records (id, session_id, student_id, status, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(session_id, student_id) DO UPDATE SET
        status = excluded.status
    `);
		for (const [studentId, status] of Object.entries(data.records)) upsertRecord.run(`rec_${sessionId}_${studentId}`, sessionId, studentId, status, now);
		return {
			id: sessionId,
			classId: data.classId,
			date: data.date,
			records: data.records,
			completedAt: data.completedAt ?? (existing ? existing.completedAt : void 0),
			createdAt: existing ? existing.createdAt : now
		};
	}
	delete(id) {
		this.db.prepare("DELETE FROM attendance_sessions WHERE id = ?").run(id);
		return true;
	}
};
//#endregion
//#region src/main/database/repositories/EvaluationRepository.ts
var EvaluationRepository = class {
	db;
	constructor(db) {
		this.db = db;
	}
	findAll() {
		const evalRows = this.db.prepare("SELECT id, class_id, title, type, date, max_score, created_at FROM evaluations ORDER BY date DESC").all();
		if (evalRows.length === 0) return [];
		const scoreRows = this.db.prepare("SELECT evaluation_id, student_id, score FROM evaluation_scores").all();
		const scoresByEval = /* @__PURE__ */ new Map();
		for (const r of scoreRows) {
			if (!scoresByEval.has(r.evaluation_id)) scoresByEval.set(r.evaluation_id, {});
			scoresByEval.get(r.evaluation_id)[r.student_id] = r.score;
		}
		return evalRows.map((e) => ({
			id: e.id,
			classId: e.class_id,
			title: e.title,
			type: e.type,
			date: e.date,
			maxScore: e.max_score,
			scores: scoresByEval.get(e.id) || {},
			createdAt: e.created_at
		}));
	}
	findByClassId(classId) {
		const evalRows = this.db.prepare("SELECT id, class_id, title, type, date, max_score, created_at FROM evaluations WHERE class_id = ? ORDER BY date DESC").all(classId);
		if (evalRows.length === 0) return [];
		const evalIds = evalRows.map((e) => e.id);
		const placeholders = evalIds.map(() => "?").join(",");
		const scoreRows = this.db.prepare(`SELECT evaluation_id, student_id, score FROM evaluation_scores WHERE evaluation_id IN (${placeholders})`).all(...evalIds);
		const scoresByEval = /* @__PURE__ */ new Map();
		for (const r of scoreRows) {
			if (!scoresByEval.has(r.evaluation_id)) scoresByEval.set(r.evaluation_id, {});
			scoresByEval.get(r.evaluation_id)[r.student_id] = r.score;
		}
		return evalRows.map((e) => ({
			id: e.id,
			classId: e.class_id,
			title: e.title,
			type: e.type,
			date: e.date,
			maxScore: e.max_score,
			scores: scoresByEval.get(e.id) || {},
			createdAt: e.created_at
		}));
	}
	findById(id) {
		const evalRow = this.db.prepare("SELECT id, class_id, title, type, date, max_score, created_at FROM evaluations WHERE id = ?").get(id);
		if (!evalRow) return null;
		const scoreRows = this.db.prepare("SELECT evaluation_id, student_id, score FROM evaluation_scores WHERE evaluation_id = ?").all(id);
		const scores = {};
		for (const s of scoreRows) scores[s.student_id] = s.score;
		return {
			id: evalRow.id,
			classId: evalRow.class_id,
			title: evalRow.title,
			type: evalRow.type,
			date: evalRow.date,
			maxScore: evalRow.max_score,
			scores,
			createdAt: evalRow.created_at
		};
	}
	saveEvaluation(id, data, now) {
		const existing = data.id ? this.findById(data.id) : null;
		const evalId = existing ? existing.id : id;
		if (existing) this.db.prepare("UPDATE evaluations SET title = ?, type = ?, date = ?, max_score = ? WHERE id = ?").run(data.title, data.type, data.date, data.maxScore, evalId);
		else this.db.prepare("INSERT INTO evaluations (id, class_id, title, type, date, max_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(evalId, data.classId, data.title, data.type, data.date, data.maxScore, now);
		const upsertScore = this.db.prepare(`
      INSERT INTO evaluation_scores (id, evaluation_id, student_id, score, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(evaluation_id, student_id) DO UPDATE SET
        score = excluded.score
    `);
		for (const [studentId, score] of Object.entries(data.scores)) upsertScore.run(`scr_${evalId}_${studentId}`, evalId, studentId, score, now);
		return {
			id: evalId,
			classId: data.classId,
			title: data.title,
			type: data.type,
			date: data.date,
			maxScore: data.maxScore,
			scores: data.scores,
			createdAt: existing ? existing.createdAt : now
		};
	}
	delete(id) {
		this.db.prepare("DELETE FROM evaluations WHERE id = ?").run(id);
		return true;
	}
};
//#endregion
//#region src/main/database/repositories/ParticipationRepository.ts
var ParticipationRepository = class {
	db;
	constructor(db) {
		this.db = db;
	}
	findAll() {
		return this.db.prepare("SELECT id, class_id, student_id, date, type, note, timestamp FROM participations ORDER BY timestamp DESC").all().map((r) => ({
			id: r.id,
			classId: r.class_id,
			studentId: r.student_id,
			date: r.date,
			type: r.type,
			note: r.note ?? void 0,
			timestamp: r.timestamp
		}));
	}
	findByClassId(classId) {
		return this.db.prepare("SELECT id, class_id, student_id, date, type, note, timestamp FROM participations WHERE class_id = ? ORDER BY timestamp DESC").all(classId).map((r) => ({
			id: r.id,
			classId: r.class_id,
			studentId: r.student_id,
			date: r.date,
			type: r.type,
			note: r.note ?? void 0,
			timestamp: r.timestamp
		}));
	}
	findByStudentId(studentId) {
		return this.db.prepare("SELECT id, class_id, student_id, date, type, note, timestamp FROM participations WHERE student_id = ? ORDER BY timestamp DESC").all(studentId).map((r) => ({
			id: r.id,
			classId: r.class_id,
			studentId: r.student_id,
			date: r.date,
			type: r.type,
			note: r.note ?? void 0,
			timestamp: r.timestamp
		}));
	}
	create(id, data, timestamp) {
		this.db.prepare("INSERT INTO participations (id, class_id, student_id, date, type, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, data.classId, data.studentId, data.date, data.type, data.note ?? null, timestamp);
		return {
			id,
			classId: data.classId,
			studentId: data.studentId,
			date: data.date,
			type: data.type,
			note: data.note,
			timestamp
		};
	}
	delete(id) {
		this.db.prepare("DELETE FROM participations WHERE id = ?").run(id);
		return true;
	}
};
//#endregion
//#region src/main/database/repositories/DisciplineRepository.ts
var DisciplineRepository = class {
	db;
	constructor(db) {
		this.db = db;
	}
	findAll() {
		return this.db.prepare("SELECT id, class_id, student_id, date, reason, note, timestamp FROM occurrences ORDER BY timestamp DESC").all().map((r) => ({
			id: r.id,
			classId: r.class_id,
			studentId: r.student_id,
			date: r.date,
			reason: r.reason,
			note: r.note ?? void 0,
			timestamp: r.timestamp
		}));
	}
	findByClassId(classId) {
		return this.db.prepare("SELECT id, class_id, student_id, date, reason, note, timestamp FROM occurrences WHERE class_id = ? ORDER BY timestamp DESC").all(classId).map((r) => ({
			id: r.id,
			classId: r.class_id,
			studentId: r.student_id,
			date: r.date,
			reason: r.reason,
			note: r.note ?? void 0,
			timestamp: r.timestamp
		}));
	}
	findByStudentId(studentId) {
		return this.db.prepare("SELECT id, class_id, student_id, date, reason, note, timestamp FROM occurrences WHERE student_id = ? ORDER BY timestamp DESC").all(studentId).map((r) => ({
			id: r.id,
			classId: r.class_id,
			studentId: r.student_id,
			date: r.date,
			reason: r.reason,
			note: r.note ?? void 0,
			timestamp: r.timestamp
		}));
	}
	create(id, data, timestamp) {
		this.db.prepare("INSERT INTO occurrences (id, class_id, student_id, date, reason, note, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, data.classId, data.studentId, data.date, data.reason, data.note ?? null, timestamp);
		return {
			id,
			classId: data.classId,
			studentId: data.studentId,
			date: data.date,
			reason: data.reason,
			note: data.note,
			timestamp
		};
	}
	delete(id) {
		this.db.prepare("DELETE FROM occurrences WHERE id = ?").run(id);
		return true;
	}
};
//#endregion
//#region src/main/database/repositories/SettingsRepository.ts
var SettingsRepository = class {
	db;
	constructor(db) {
		this.db = db;
	}
	getAll() {
		const rows = this.db.prepare("SELECT key, value, updated_at FROM settings").all();
		const settings = {};
		for (const r of rows) settings[r.key] = r.value;
		return settings;
	}
	get(key) {
		const row = this.db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
		return row ? row.value : null;
	}
	set(key, value) {
		const now = (/* @__PURE__ */ new Date()).toISOString();
		this.db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `).run(key, value, now);
	}
	setMultiple(settings) {
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);
		for (const [k, v] of Object.entries(settings)) stmt.run(k, v, now);
	}
};
//#endregion
//#region src/main/services/ClassService.ts
var ClassService = class {
	classRepo;
	constructor(classRepo) {
		this.classRepo = classRepo;
	}
	getAllClasses() {
		return this.classRepo.findAll();
	}
	getClassById(id) {
		if (!id || id.trim() === "") throw new Error("ID da turma é obrigatório.");
		const cls = this.classRepo.findById(id);
		if (!cls) throw new Error(`Turma com ID '${id}' não foi encontrada.`);
		return cls;
	}
	createClass(data) {
		if (!data.name || data.name.trim() === "") throw new Error("O nome da turma é obrigatório.");
		if (!data.course || data.course.trim() === "") throw new Error("A disciplina/curso da turma é obrigatório.");
		if (!data.grade || data.grade.trim() === "") throw new Error("O ano/classe da turma é obrigatório.");
		if (!data.period || ![
			"Manhã",
			"Tarde",
			"Noite"
		].includes(data.period)) throw new Error("O período deve ser Manhã, Tarde ou Noite.");
		const id = `class_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const createdAt = (/* @__PURE__ */ new Date()).toISOString();
		const created = this.classRepo.create(id, {
			name: data.name.trim(),
			course: data.course.trim(),
			grade: data.grade.trim(),
			period: data.period
		}, createdAt);
		logger.info("Class created", {
			id: created.id,
			name: created.name
		});
		return created;
	}
	updateClass(id, data) {
		if (!id) throw new Error("ID da turma é obrigatório.");
		const updated = this.classRepo.update(id, data);
		if (!updated) throw new Error(`Turma com ID '${id}' não foi encontrada para atualização.`);
		logger.info("Class updated", { id });
		return updated;
	}
	deleteClass(id) {
		if (!id) throw new Error("ID da turma é obrigatório.");
		this.classRepo.delete(id);
		logger.info("Class deleted", { id });
		return true;
	}
};
//#endregion
//#region src/main/services/StudentService.ts
var StudentService = class {
	studentRepo;
	constructor(studentRepo) {
		this.studentRepo = studentRepo;
	}
	getAllStudents() {
		return this.studentRepo.findAll();
	}
	getStudentsByClass(classId) {
		if (!classId) throw new Error("ID da turma é obrigatório.");
		return this.studentRepo.findByClassId(classId);
	}
	getStudentById(id) {
		if (!id) throw new Error("ID do aluno é obrigatório.");
		const student = this.studentRepo.findById(id);
		if (!student) throw new Error(`Aluno com ID '${id}' não encontrado.`);
		return student;
	}
	addStudent(data) {
		if (!data.classId) throw new Error("ID da turma é obrigatório.");
		if (!data.name || data.name.trim() === "") throw new Error("O nome do aluno é obrigatório.");
		const currentStudents = this.studentRepo.findByClassId(data.classId);
		let number = data.number;
		if (number === void 0 || number === null) number = currentStudents.reduce((max, s) => s.number ? Math.max(max, s.number) : max, 0) + 1;
		const id = `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const createdAt = (/* @__PURE__ */ new Date()).toISOString();
		const created = this.studentRepo.create(id, {
			classId: data.classId,
			name: data.name.trim(),
			number,
			active: data.active ?? true
		}, createdAt);
		logger.info("Student added", {
			id: created.id,
			name: created.name,
			classId: data.classId
		});
		return created;
	}
	addMultipleStudents(data) {
		if (!data.classId) throw new Error("ID da turma é obrigatório.");
		if (!data.names || data.names.length === 0) return [];
		const validNames = data.names.map((n) => n.trim()).filter((n) => n.length > 0);
		if (validNames.length === 0) return [];
		let nextNumber = this.studentRepo.findByClassId(data.classId).reduce((max, s) => s.number ? Math.max(max, s.number) : max, 0) + 1;
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const studentsToInsert = validNames.map((name, idx) => ({
			id: `std_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
			classId: data.classId,
			name,
			number: nextNumber++,
			active: true,
			createdAt: now
		}));
		const result = this.studentRepo.createBatch(studentsToInsert);
		logger.info("Batch students added", {
			classId: data.classId,
			count: result.length
		});
		return result;
	}
	updateStudent(id, data) {
		if (!id) throw new Error("ID do aluno é obrigatório.");
		const updated = this.studentRepo.update(id, data);
		if (!updated) throw new Error(`Aluno com ID '${id}' não encontrado para atualização.`);
		logger.info("Student updated", { id });
		return updated;
	}
	deleteStudent(id) {
		if (!id) throw new Error("ID do aluno é obrigatório.");
		this.studentRepo.delete(id);
		logger.info("Student deleted", { id });
		return true;
	}
};
//#endregion
//#region src/main/services/AttendanceService.ts
var AttendanceService = class {
	attendanceRepo;
	constructor(attendanceRepo) {
		this.attendanceRepo = attendanceRepo;
	}
	getAllAttendances() {
		return this.attendanceRepo.findAll();
	}
	getAttendancesByClass(classId) {
		if (!classId) throw new Error("ID da turma é obrigatório.");
		return this.attendanceRepo.findByClassId(classId);
	}
	getAttendanceByDate(classId, date) {
		if (!classId || !date) throw new Error("ID da turma e data são obrigatórios.");
		return this.attendanceRepo.findByClassAndDate(classId, date);
	}
	saveAttendance(data) {
		if (!data.classId) throw new Error("ID da turma é obrigatório.");
		if (!data.date) throw new Error("Data da chamada é obrigatória.");
		const id = data.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const saved = this.attendanceRepo.saveSession(id, data, now);
		logger.info("Attendance session saved", {
			id: saved.id,
			classId: saved.classId,
			date: saved.date,
			recordCount: Object.keys(saved.records).length
		});
		return saved;
	}
	deleteAttendance(id) {
		if (!id) throw new Error("ID da sessão de presença é obrigatório.");
		this.attendanceRepo.delete(id);
		logger.info("Attendance session deleted", { id });
		return true;
	}
};
//#endregion
//#region src/main/services/EvaluationService.ts
var EvaluationService = class {
	evalRepo;
	constructor(evalRepo) {
		this.evalRepo = evalRepo;
	}
	getAllEvaluations() {
		return this.evalRepo.findAll();
	}
	getEvaluationsByClass(classId) {
		if (!classId) throw new Error("ID da turma é obrigatório.");
		return this.evalRepo.findByClassId(classId);
	}
	getEvaluationById(id) {
		if (!id) throw new Error("ID da avaliação é obrigatório.");
		const ev = this.evalRepo.findById(id);
		if (!ev) throw new Error(`Avaliação '${id}' não encontrada.`);
		return ev;
	}
	saveEvaluation(data) {
		if (!data.classId) throw new Error("ID da turma é obrigatório.");
		if (!data.title || data.title.trim() === "") throw new Error("Título da avaliação é obrigatório.");
		if (data.maxScore === void 0 || data.maxScore <= 0) throw new Error("A pontuação máxima deve ser superior a zero.");
		const id = data.id || `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const saved = this.evalRepo.saveEvaluation(id, data, now);
		logger.info("Evaluation saved", {
			id: saved.id,
			title: saved.title,
			classId: saved.classId,
			scoresCount: Object.keys(saved.scores).length
		});
		return saved;
	}
	deleteEvaluation(id) {
		if (!id) throw new Error("ID da avaliação é obrigatório.");
		this.evalRepo.delete(id);
		logger.info("Evaluation deleted", { id });
		return true;
	}
};
//#endregion
//#region src/main/services/ParticipationService.ts
var ParticipationService = class {
	partRepo;
	constructor(partRepo) {
		this.partRepo = partRepo;
	}
	getAllParticipations() {
		return this.partRepo.findAll();
	}
	getParticipationsByClass(classId) {
		if (!classId) throw new Error("ID da turma é obrigatório.");
		return this.partRepo.findByClassId(classId);
	}
	getParticipationsByStudent(studentId) {
		if (!studentId) throw new Error("ID do aluno é obrigatório.");
		return this.partRepo.findByStudentId(studentId);
	}
	addParticipation(data) {
		if (!data.classId) throw new Error("ID da turma é obrigatório.");
		if (!data.studentId) throw new Error("ID do aluno é obrigatório.");
		if (!data.date) throw new Error("Data é obrigatória.");
		if (!data.type || !["positive", "negative"].includes(data.type)) throw new Error("Tipo de participação deve ser positivo ou negativo.");
		const id = `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const timestamp = data.timestamp || (/* @__PURE__ */ new Date()).toISOString();
		const created = this.partRepo.create(id, data, timestamp);
		logger.info("Participation recorded", {
			id: created.id,
			studentId: created.studentId,
			type: created.type
		});
		return created;
	}
	deleteParticipation(id) {
		if (!id) throw new Error("ID do registo de participação é obrigatório.");
		this.partRepo.delete(id);
		logger.info("Participation deleted", { id });
		return true;
	}
};
//#endregion
//#region src/main/services/DisciplineService.ts
var DisciplineService = class {
	disciplineRepo;
	constructor(disciplineRepo) {
		this.disciplineRepo = disciplineRepo;
	}
	getAllOccurrences() {
		return this.disciplineRepo.findAll();
	}
	getOccurrencesByClass(classId) {
		if (!classId) throw new Error("ID da turma é obrigatório.");
		return this.disciplineRepo.findByClassId(classId);
	}
	getOccurrencesByStudent(studentId) {
		if (!studentId) throw new Error("ID do aluno é obrigatório.");
		return this.disciplineRepo.findByStudentId(studentId);
	}
	addOccurrence(data) {
		if (!data.classId) throw new Error("ID da turma é obrigatório.");
		if (!data.studentId) throw new Error("ID do aluno é obrigatório.");
		if (!data.date) throw new Error("Data é obrigatória.");
		if (!data.reason) throw new Error("Motivo da ocorrência é obrigatório.");
		const id = `occ_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const timestamp = data.timestamp || (/* @__PURE__ */ new Date()).toISOString();
		const created = this.disciplineRepo.create(id, data, timestamp);
		logger.info("Disciplinary occurrence recorded", {
			id: created.id,
			studentId: created.studentId,
			reason: created.reason
		});
		return created;
	}
	deleteOccurrence(id) {
		if (!id) throw new Error("ID da ocorrência é obrigatório.");
		this.disciplineRepo.delete(id);
		logger.info("Disciplinary occurrence deleted", { id });
		return true;
	}
};
//#endregion
//#region src/main/services/SettingsService.ts
var SettingsService = class {
	settingsRepo;
	constructor(settingsRepo) {
		this.settingsRepo = settingsRepo;
	}
	getAllSettings() {
		return this.settingsRepo.getAll();
	}
	getSetting(key) {
		if (!key) return null;
		return this.settingsRepo.get(key);
	}
	setSetting(key, value) {
		if (!key) throw new Error("Chave de configuração é obrigatória.");
		this.settingsRepo.set(key, value);
		logger.info("Setting updated", {
			key,
			value
		});
	}
	updateSettings(settings) {
		this.settingsRepo.setMultiple(settings);
		logger.info("Multiple settings updated", { keys: Object.keys(settings) });
		return this.settingsRepo.getAll();
	}
};
//#endregion
//#region src/main/services/BackupService.ts
var BackupService = class {
	conn;
	constructor(conn = dbConnection) {
		this.conn = conn;
	}
	getDatabasePath() {
		return this.conn.getDbPath();
	}
	exportBackup(targetFilePath) {
		const currentDbPath = this.conn.getDbPath();
		if (!fs.existsSync(currentDbPath)) throw new Error("O ficheiro da base de dados não existe para exportação.");
		const targetDir = path.dirname(targetFilePath);
		if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
		try {
			this.conn.getDb().exec("PRAGMA wal_checkpoint(TRUNCATE);");
			fs.copyFileSync(currentDbPath, targetFilePath);
			const stats = fs.statSync(targetFilePath);
			logger.info("Database backup exported successfully", {
				targetFilePath,
				sizeBytes: stats.size
			});
			return {
				success: true,
				filePath: targetFilePath,
				sizeBytes: stats.size
			};
		} catch (err) {
			logger.error("Failed to export database backup", { error: String(err) });
			throw new Error(`Falha ao exportar cópia de segurança: ${err instanceof Error ? err.message : String(err)}`);
		}
	}
	importBackup(sourceFilePath) {
		if (!fs.existsSync(sourceFilePath)) throw new Error(`Ficheiro de cópia de segurança '${sourceFilePath}' não encontrado.`);
		try {
			const testDb = new DatabaseSync(sourceFilePath);
			const integrity = testDb.prepare("PRAGMA integrity_check").get();
			testDb.close();
			if (!integrity || integrity.integrity_check !== "ok") throw new Error("O ficheiro selecionado não é uma base de dados SQLite válida ou está corrompido.");
		} catch (err) {
			throw new Error(`Ficheiro de backup inválido: ${err instanceof Error ? err.message : String(err)}`);
		}
		const currentDbPath = this.conn.getDbPath();
		try {
			this.conn.close();
			const failsafePath = `${currentDbPath}.failsafe.${Date.now()}`;
			if (fs.existsSync(currentDbPath)) fs.copyFileSync(currentDbPath, failsafePath);
			fs.copyFileSync(sourceFilePath, currentDbPath);
			const walPath = `${currentDbPath}-wal`;
			const shmPath = `${currentDbPath}-shm`;
			if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
			if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
			this.conn.init(currentDbPath);
			logger.info("Database backup imported successfully", { sourceFilePath });
			return {
				success: true,
				message: "Base de dados restaurada com sucesso a partir da cópia de segurança."
			};
		} catch (err) {
			logger.error("Failed to import database backup", { error: String(err) });
			try {
				this.conn.init(currentDbPath);
			} catch {}
			throw new Error(`Falha ao restaurar cópia de segurança: ${err instanceof Error ? err.message : String(err)}`);
		}
	}
};
//#endregion
//#region src/main/ipc/channels.ts
var IPC_CHANNELS = {
	APP_GET_ALL: "app:getAll",
	CLASSES_LIST: "classes:list",
	CLASSES_GET: "classes:get",
	CLASSES_CREATE: "classes:create",
	CLASSES_UPDATE: "classes:update",
	CLASSES_DELETE: "classes:delete",
	STUDENTS_LIST_BY_CLASS: "students:listByClass",
	STUDENTS_GET_ALL: "students:getAll",
	STUDENTS_CREATE: "students:create",
	STUDENTS_CREATE_BATCH: "students:createBatch",
	STUDENTS_UPDATE: "students:update",
	STUDENTS_DELETE: "students:delete",
	ATTENDANCE_LIST_BY_CLASS: "attendance:listByClass",
	ATTENDANCE_GET_ALL: "attendance:getAll",
	ATTENDANCE_SAVE: "attendance:save",
	ATTENDANCE_DELETE: "attendance:delete",
	EVALUATIONS_LIST_BY_CLASS: "evaluations:listByClass",
	EVALUATIONS_GET_ALL: "evaluations:getAll",
	EVALUATIONS_SAVE: "evaluations:save",
	EVALUATIONS_DELETE: "evaluations:delete",
	PARTICIPATIONS_LIST_BY_CLASS: "participations:listByClass",
	PARTICIPATIONS_GET_ALL: "participations:getAll",
	PARTICIPATIONS_CREATE: "participations:create",
	PARTICIPATIONS_DELETE: "participations:delete",
	OCCURRENCES_LIST_BY_CLASS: "occurrences:listByClass",
	OCCURRENCES_GET_ALL: "occurrences:getAll",
	OCCURRENCES_CREATE: "occurrences:create",
	OCCURRENCES_DELETE: "occurrences:delete",
	SETTINGS_GET_ALL: "settings:getAll",
	SETTINGS_GET: "settings:get",
	SETTINGS_SET: "settings:set",
	SETTINGS_UPDATE: "settings:update",
	BACKUP_GET_PATH: "backup:getPath",
	BACKUP_EXPORT: "backup:export",
	BACKUP_IMPORT: "backup:import",
	STORAGE_LOAD: "storage:load",
	STORAGE_SAVE: "storage:save"
};
//#endregion
//#region src/main/ipc/registerHandlers.ts
function registerIpcHandlers(services) {
	const { classService, studentService, attendanceService, evaluationService, participationService, disciplineService, settingsService, backupService } = services;
	function handleSafe(channel, handler) {
		ipcMain.handle(channel, async (_event, ...args) => {
			try {
				return {
					success: true,
					data: await handler(...args)
				};
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "Erro interno ao processar operação.";
				logger.error(`IPC error on ${channel}`, {
					error: String(err),
					args
				});
				return {
					success: false,
					error: errorMessage
				};
			}
		});
	}
	handleSafe(IPC_CHANNELS.APP_GET_ALL, () => {
		return {
			classes: classService.getAllClasses(),
			students: studentService.getAllStudents(),
			attendances: attendanceService.getAllAttendances(),
			evaluations: evaluationService.getAllEvaluations(),
			participations: participationService.getAllParticipations(),
			occurrences: disciplineService.getAllOccurrences(),
			settings: settingsService.getAllSettings()
		};
	});
	handleSafe(IPC_CHANNELS.CLASSES_LIST, () => classService.getAllClasses());
	handleSafe(IPC_CHANNELS.CLASSES_GET, (id) => classService.getClassById(id));
	handleSafe(IPC_CHANNELS.CLASSES_CREATE, (data) => classService.createClass(data));
	handleSafe(IPC_CHANNELS.CLASSES_UPDATE, (id, data) => classService.updateClass(id, data));
	handleSafe(IPC_CHANNELS.CLASSES_DELETE, (id) => classService.deleteClass(id));
	handleSafe(IPC_CHANNELS.STUDENTS_LIST_BY_CLASS, (classId) => studentService.getStudentsByClass(classId));
	handleSafe(IPC_CHANNELS.STUDENTS_GET_ALL, () => studentService.getAllStudents());
	handleSafe(IPC_CHANNELS.STUDENTS_CREATE, (data) => studentService.addStudent(data));
	handleSafe(IPC_CHANNELS.STUDENTS_CREATE_BATCH, (data) => studentService.addMultipleStudents(data));
	handleSafe(IPC_CHANNELS.STUDENTS_UPDATE, (id, data) => studentService.updateStudent(id, data));
	handleSafe(IPC_CHANNELS.STUDENTS_DELETE, (id) => studentService.deleteStudent(id));
	handleSafe(IPC_CHANNELS.ATTENDANCE_LIST_BY_CLASS, (classId) => attendanceService.getAttendancesByClass(classId));
	handleSafe(IPC_CHANNELS.ATTENDANCE_GET_ALL, () => attendanceService.getAllAttendances());
	handleSafe(IPC_CHANNELS.ATTENDANCE_SAVE, (data) => attendanceService.saveAttendance(data));
	handleSafe(IPC_CHANNELS.ATTENDANCE_DELETE, (id) => attendanceService.deleteAttendance(id));
	handleSafe(IPC_CHANNELS.EVALUATIONS_LIST_BY_CLASS, (classId) => evaluationService.getEvaluationsByClass(classId));
	handleSafe(IPC_CHANNELS.EVALUATIONS_GET_ALL, () => evaluationService.getAllEvaluations());
	handleSafe(IPC_CHANNELS.EVALUATIONS_SAVE, (data) => evaluationService.saveEvaluation(data));
	handleSafe(IPC_CHANNELS.EVALUATIONS_DELETE, (id) => evaluationService.deleteEvaluation(id));
	handleSafe(IPC_CHANNELS.PARTICIPATIONS_LIST_BY_CLASS, (classId) => participationService.getParticipationsByClass(classId));
	handleSafe(IPC_CHANNELS.PARTICIPATIONS_GET_ALL, () => participationService.getAllParticipations());
	handleSafe(IPC_CHANNELS.PARTICIPATIONS_CREATE, (data) => participationService.addParticipation(data));
	handleSafe(IPC_CHANNELS.PARTICIPATIONS_DELETE, (id) => participationService.deleteParticipation(id));
	handleSafe(IPC_CHANNELS.OCCURRENCES_LIST_BY_CLASS, (classId) => disciplineService.getOccurrencesByClass(classId));
	handleSafe(IPC_CHANNELS.OCCURRENCES_GET_ALL, () => disciplineService.getAllOccurrences());
	handleSafe(IPC_CHANNELS.OCCURRENCES_CREATE, (data) => disciplineService.addOccurrence(data));
	handleSafe(IPC_CHANNELS.OCCURRENCES_DELETE, (id) => disciplineService.deleteOccurrence(id));
	handleSafe(IPC_CHANNELS.SETTINGS_GET_ALL, () => settingsService.getAllSettings());
	handleSafe(IPC_CHANNELS.SETTINGS_GET, (key) => settingsService.getSetting(key));
	handleSafe(IPC_CHANNELS.SETTINGS_SET, (key, value) => settingsService.setSetting(key, value));
	handleSafe(IPC_CHANNELS.SETTINGS_UPDATE, (settings) => settingsService.updateSettings(settings));
	handleSafe(IPC_CHANNELS.BACKUP_GET_PATH, () => backupService.getDatabasePath());
	handleSafe(IPC_CHANNELS.BACKUP_EXPORT, (targetPath) => backupService.exportBackup(targetPath));
	handleSafe(IPC_CHANNELS.BACKUP_IMPORT, (sourcePath) => backupService.importBackup(sourcePath));
	ipcMain.handle(IPC_CHANNELS.STORAGE_LOAD, async () => {
		try {
			return {
				classes: classService.getAllClasses(),
				students: studentService.getAllStudents(),
				attendances: attendanceService.getAllAttendances(),
				evaluations: evaluationService.getAllEvaluations(),
				participations: participationService.getAllParticipations(),
				occurrences: disciplineService.getAllOccurrences(),
				settings: settingsService.getAllSettings()
			};
		} catch (err) {
			logger.error("Error in legacy storage:load fallback", { error: String(err) });
			return null;
		}
	});
	ipcMain.handle(IPC_CHANNELS.STORAGE_SAVE, async (_event, _data) => {
		logger.debug("Legacy storage:save invoked");
		return true;
	});
	logger.info("All IPC handlers registered successfully");
}
//#endregion
//#region src/main/main.ts
var mainWindow = null;
function initializeApp() {
	const userDataDir = app.getPath("userData");
	const logsDir = path.join(userDataDir, "logs");
	logger.init(logsDir, APP_CONFIG.LOG_FILENAME);
	logger.info(`Starting ${APP_CONFIG.APP_NAME}`, {
		version: app.getVersion(),
		userDataDir,
		platform: process.platform,
		arch: process.arch
	});
	const dbPath = resolveDatabasePath(userDataDir);
	const db = dbConnection.init(dbPath);
	setupMigrations();
	migrator.run(db);
	const classRepo = new ClassRepository(db);
	const studentRepo = new StudentRepository(db);
	const attendanceRepo = new AttendanceRepository(db);
	const evalRepo = new EvaluationRepository(db);
	const partRepo = new ParticipationRepository(db);
	const discRepo = new DisciplineRepository(db);
	const settingsRepo = new SettingsRepository(db);
	registerIpcHandlers({
		classService: new ClassService(classRepo),
		studentService: new StudentService(studentRepo),
		attendanceService: new AttendanceService(attendanceRepo),
		evaluationService: new EvaluationService(evalRepo),
		participationService: new ParticipationService(partRepo),
		disciplineService: new DisciplineService(discRepo),
		settingsService: new SettingsService(settingsRepo),
		backupService: new BackupService()
	});
}
function createWindow() {
	const preloadPath = path.join(import.meta.dirname, "preload.cjs");
	const fallbackPreload = path.join(import.meta.dirname, "preload.js");
	const resolvedPreload = fs.existsSync(preloadPath) ? preloadPath : fallbackPreload;
	mainWindow = new BrowserWindow({
		width: APP_CONFIG.DEFAULT_WIDTH,
		height: APP_CONFIG.DEFAULT_HEIGHT,
		minWidth: APP_CONFIG.MIN_WIDTH,
		minHeight: APP_CONFIG.MIN_HEIGHT,
		title: APP_CONFIG.APP_NAME,
		webPreferences: {
			preload: resolvedPreload,
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false
		}
	});
	if (app.isPackaged) mainWindow.removeMenu();
	const devServerUrl = process.env.VITE_DEV_SERVER_URL;
	if (devServerUrl) {
		logger.info("Loading dev server URL", { devServerUrl });
		mainWindow.loadURL(devServerUrl);
	} else {
		const indexPath = path.join(app.getAppPath(), "dist-react", "index.html");
		logger.info("Loading production index file", { indexPath });
		mainWindow.loadFile(indexPath);
	}
	mainWindow.on("closed", () => {
		mainWindow = null;
	});
}
app.whenReady().then(() => {
	try {
		initializeApp();
		createWindow();
		app.on("activate", () => {
			if (BrowserWindow.getAllWindows().length === 0) createWindow();
		});
	} catch (err) {
		logger.error("Critical initialization error:", { error: String(err) });
	}
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
app.on("will-quit", () => {
	logger.info("Application is shutting down. Closing database connection...");
	dbConnection.close();
});
//#endregion
export {};
