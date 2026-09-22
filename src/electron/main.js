import { app, BrowserWindow } from "electron";
import path from "node:path";

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