"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const electron_log_1 = __importDefault(require("electron-log"));
const menu_1 = __importDefault(require("./menu"));
const util_1 = require("./util");
const electron_store_1 = __importDefault(require("electron-store"));
class AppUpdater {
    constructor() {
        electron_log_1.default.transports.file.level = 'info';
        electron_updater_1.autoUpdater.logger = electron_log_1.default;
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    }
}
let mainWindow = null;
electron_1.ipcMain.on('ipc-example', async (event, arg) => {
    const msgTemplate = (pingPong) => `IPC test: ${pingPong}`;
    console.log(msgTemplate(arg));
    event.reply('ipc-example', msgTemplate('pong'));
});
if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}
const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
if (isDebug) {
    require('electron-debug')();
}
const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS'];
    return installer
        .default(extensions.map((name) => installer[name]), forceDownload)
        .catch(console.log);
};
const createWindow = async () => {
    if (isDebug) {
        await installExtensions();
    }
    const RESOURCES_PATH = electron_1.app.isPackaged
        ? path_1.default.join(process.resourcesPath, 'assets')
        : path_1.default.join(__dirname, '../../assets');
    const getAssetPath = (...paths) => {
        return path_1.default.join(RESOURCES_PATH, ...paths);
    };
    mainWindow = new electron_1.BrowserWindow({
        show: false,
        width: 1024,
        height: 728,
        icon: getAssetPath('icon.png'),
        webPreferences: {
            preload: electron_1.app.isPackaged
                ? path_1.default.join(__dirname, 'preload.js')
                : path_1.default.join(__dirname, '../../.erb/dll/preload.js'),
        },
    });
    mainWindow.loadURL((0, util_1.resolveHtmlPath)('index.html'));
    mainWindow.on('ready-to-show', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize();
        }
        else {
            mainWindow.show();
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    const menuBuilder = new menu_1.default(mainWindow);
    menuBuilder.buildMenu();
    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        electron_1.shell.openExternal(edata.url);
        return { action: 'deny' };
    });
    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    new AppUpdater();
};
/**
 * Add event listeners...
 */
electron_1.app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app
    .whenReady()
    .then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null)
            createWindow();
    });
})
    .catch(console.log);
// 型付きStoreの作成
const storeData = new electron_store_1.default();
// 型アサーション - Storeインスタンスに対してgetとsetメソッドを持つことを明示
const typedStore = storeData;
electron_1.ipcMain.handle('loadTodoList', async (event, data) => {
    return typedStore.get('todoList', []);
});
electron_1.ipcMain.handle('storeTodoList', async (event, data) => {
    typedStore.set('todoList', data);
});
electron_1.ipcMain.handle('deleteTodoList', async (event, id) => {
    const todoList = typedStore.get('todoList', []);
    const updateTodoList = todoList.filter((todo) => todo.id !== id);
    typedStore.set('todoList', updateTodoList);
    console.log('updateList : ' + JSON.stringify(updateTodoList));
    return updateTodoList;
});
