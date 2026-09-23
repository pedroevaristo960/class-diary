const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    loadData: () => ipcRenderer.invoke("storage:load"),
    saveData: (data) => ipcRenderer.invoke("storage:save", data),
});
