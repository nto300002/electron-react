// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

export type ElectronHandler = typeof electronHandler;

// ---- 新規追加 ----
contextBridge.exposeInMainWorld('electron', electronHandler);

contextBridge.exposeInMainWorld('db', {
  loadTodoList: () => ipcRenderer.invoke('loadTodoList'),
  storeTodoList: (todoList: Array<object>) =>
    ipcRenderer.invoke('storeTodoList', todoList),
  deleteTodoList: (id: number) => ipcRenderer.invoke('deleteTodoList', id),
});
// ---- 新規追加 ----
