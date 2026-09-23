import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";

const DATA_FILE = path.join(app.getPath("userData"), "class_diary_data.json");

function loadDataFromDisk() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, "utf-8");
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error("Error loading data from disk:", err);
    }
    return null;
}

function saveDataToDisk(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
        console.error("Error saving data to disk:", err);
    }
}

// IPC handlers for persistent storage
ipcMain.handle("storage:load", () => {
    return loadDataFromDisk();
});

ipcMain.handle("storage:save", (_event, data) => {
    saveDataToDisk(data);
    return true;
});

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,

        webPreferences: {
            preload: path.join(import.meta.dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    win.loadFile(
        path.join(app.getAppPath(), "dist-react/index.html")
    );
};

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});