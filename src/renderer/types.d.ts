// src/renderer/types.d.ts
interface ElectronAPI {
  ipcRenderer: {
    sendMessage(channel: string, args: unknown[]): void;
    once(channel: string, func: (...args: unknown[]) => void): void;
  };
}

interface Window {
  electron: ElectronAPI;
}
