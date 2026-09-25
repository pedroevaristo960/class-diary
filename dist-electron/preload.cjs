let electron = require("electron");
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
//#region src/preload/preload.ts
async function invokeChannel(channel, ...args) {
	const result = await electron.ipcRenderer.invoke(channel, ...args);
	if (!result || typeof result !== "object") return result;
	if (result.success === false) throw new Error(result.error || "Erro ao comunicar com o processo principal.");
	return result.data;
}
var api = {
	getAllData: () => invokeChannel(IPC_CHANNELS.APP_GET_ALL),
	classes: {
		list: () => invokeChannel(IPC_CHANNELS.CLASSES_LIST),
		get: (id) => invokeChannel(IPC_CHANNELS.CLASSES_GET, id),
		create: (data) => invokeChannel(IPC_CHANNELS.CLASSES_CREATE, data),
		update: (id, data) => invokeChannel(IPC_CHANNELS.CLASSES_UPDATE, id, data),
		delete: (id) => invokeChannel(IPC_CHANNELS.CLASSES_DELETE, id)
	},
	students: {
		listByClass: (classId) => invokeChannel(IPC_CHANNELS.STUDENTS_LIST_BY_CLASS, classId),
		getAll: () => invokeChannel(IPC_CHANNELS.STUDENTS_GET_ALL),
		create: (data) => invokeChannel(IPC_CHANNELS.STUDENTS_CREATE, data),
		createBatch: (data) => invokeChannel(IPC_CHANNELS.STUDENTS_CREATE_BATCH, data),
		update: (id, data) => invokeChannel(IPC_CHANNELS.STUDENTS_UPDATE, id, data),
		delete: (id) => invokeChannel(IPC_CHANNELS.STUDENTS_DELETE, id)
	},
	attendance: {
		listByClass: (classId) => invokeChannel(IPC_CHANNELS.ATTENDANCE_LIST_BY_CLASS, classId),
		getAll: () => invokeChannel(IPC_CHANNELS.ATTENDANCE_GET_ALL),
		save: (data) => invokeChannel(IPC_CHANNELS.ATTENDANCE_SAVE, data),
		delete: (id) => invokeChannel(IPC_CHANNELS.ATTENDANCE_DELETE, id)
	},
	evaluations: {
		listByClass: (classId) => invokeChannel(IPC_CHANNELS.EVALUATIONS_LIST_BY_CLASS, classId),
		getAll: () => invokeChannel(IPC_CHANNELS.EVALUATIONS_GET_ALL),
		save: (data) => invokeChannel(IPC_CHANNELS.EVALUATIONS_SAVE, data),
		delete: (id) => invokeChannel(IPC_CHANNELS.EVALUATIONS_DELETE, id)
	},
	participations: {
		listByClass: (classId) => invokeChannel(IPC_CHANNELS.PARTICIPATIONS_LIST_BY_CLASS, classId),
		getAll: () => invokeChannel(IPC_CHANNELS.PARTICIPATIONS_GET_ALL),
		create: (data) => invokeChannel(IPC_CHANNELS.PARTICIPATIONS_CREATE, data),
		delete: (id) => invokeChannel(IPC_CHANNELS.PARTICIPATIONS_DELETE, id)
	},
	occurrences: {
		listByClass: (classId) => invokeChannel(IPC_CHANNELS.OCCURRENCES_LIST_BY_CLASS, classId),
		getAll: () => invokeChannel(IPC_CHANNELS.OCCURRENCES_GET_ALL),
		create: (data) => invokeChannel(IPC_CHANNELS.OCCURRENCES_CREATE, data),
		delete: (id) => invokeChannel(IPC_CHANNELS.OCCURRENCES_DELETE, id)
	},
	settings: {
		getAll: () => invokeChannel(IPC_CHANNELS.SETTINGS_GET_ALL),
		get: (key) => invokeChannel(IPC_CHANNELS.SETTINGS_GET, key),
		set: (key, value) => invokeChannel(IPC_CHANNELS.SETTINGS_SET, key, value),
		update: (settings) => invokeChannel(IPC_CHANNELS.SETTINGS_UPDATE, settings)
	},
	backup: {
		getPath: () => invokeChannel(IPC_CHANNELS.BACKUP_GET_PATH),
		export: (targetPath) => invokeChannel(IPC_CHANNELS.BACKUP_EXPORT, targetPath),
		import: (sourcePath) => invokeChannel(IPC_CHANNELS.BACKUP_IMPORT, sourcePath)
	}
};
electron.contextBridge.exposeInMainWorld("classDiaryAPI", api);
electron.contextBridge.exposeInMainWorld("electronAPI", {
	loadData: () => api.getAllData(),
	saveData: () => Promise.resolve(true)
});
//#endregion
