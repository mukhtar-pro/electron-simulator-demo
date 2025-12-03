import { contextBridge } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  // Add more IPC methods here as needed for future features
  // Example: getSensorData: () => ipcRenderer.invoke('get-sensor-data'),
});

// Type declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      platform: string;
    };
  }
}
