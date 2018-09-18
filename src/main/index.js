'use strict';

import { app, BrowserWindow } from 'electron';
import path from 'path'
import { format as formatUrl } from 'url';
import { autoUpdater } from "electron-updater";
import { FileUpdater } from "./FileUpdater";
import { WoWStarter } from "./WowStarter";
import { LauncherLocalize } from "./LauncherLocalize";

const isDevelopment = process.env.NODE_ENV !== 'production';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;

function createMainWindow()
{
    const localize = new LauncherLocalize();
    const window = new BrowserWindow({
        height: 300,
        width: 256,
        resizable: false,
        transparent: true,
        show: false,
        icon: path.join(__static, 'images', 'icon.png')
    });
    window.setMenu(null);

    InitAutoUpdater();

    window.loadURL(formatUrl({
        pathname: path.join(__static, 'index.html'),
        protocol: 'file',
        slashes: true
    }));

    window.on('closed', () => {
        mainWindow = null;
    });

    window.on('ready-to-show', () =>
    {
        window.show();

        if (!isDevelopment)
            autoUpdater.checkForUpdates();
        else
            CheckFilesAndStartWoW(window);
    });

    return window;
}

function InitAutoUpdater()
{
    autoUpdater.on('update-not-available', () => {
        CheckFilesAndStartWoW(window);
    });

    autoUpdater.on('update-available', () => {
        window.webContents.send('update-in-progress', localize.translate('Updating'));
    });

    autoUpdater.on('update-downloaded', () => {
        autoUpdater.quitAndInstall();
    });
}

function CheckFilesAndStartWoW(window)
{
    new FileUpdater(window).CheckDistFiles(() => {
        new WoWStarter().StartWoW();
    });
}

// quit application when all windows are closed
app.on('window-all-closed', () =>
{
    // on macOS it is common for applications to stay open until the user explicitly quits
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () =>
{
    // on macOS it is common to re-create a window even after all windows have been closed
    if (mainWindow === null)
        mainWindow = createMainWindow();
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
    mainWindow = createMainWindow();
});
