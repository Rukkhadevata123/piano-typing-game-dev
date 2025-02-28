import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import squirrelStartup from 'electron-squirrel-startup';

// 初始化配置
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Windows 安装事件处理
if (squirrelStartup) {
    app.quit();
}

// 创建主窗口
const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1600,
        height: 1200,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            allowRunningInsecureContent: true
        },
        show: false
    });

    // 窗口加载完成后显示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // 根据环境加载内容
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // 错误处理
    mainWindow.webContents.on('did-fail-load', () => {
        console.log('页面加载失败，尝试重新加载...');
        mainWindow.loadURL('http://localhost:3000');
    });
};

// 应用生命周期事件
app.whenReady().then(createWindow);

// macOS 应用激活事件
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// 窗口关闭事件
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});