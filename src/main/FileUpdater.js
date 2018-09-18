
import { Config } from './Config.js'
import axios from "axios";
import * as path from "path";
import { app, dialog } from "electron";
import {download} from "electron-dl";
import {LauncherLocalize} from "./LauncherLocalize";

const ProgressBar = require('electron-progressbar');
const fs = require('fs');
const sha1File = require('sha1-file');
const extract = require('extract-zip');

const downloadUrl = "https://dl.ashamane.com/launcher/";
const downloadData = "data.json";
const webCertBundleDir = 'C:\\ProgramData\\Blizzard Entertainment\\Battle.net\\Cache';

export class FileUpdater
{
    constructor(mainWindow)
    {
        this._mainWindow = mainWindow;
        this._config = new Config();
        this._files = {};
        this._callback = null;
        this._localize = new LauncherLocalize();

        this._updateStep = 0;
    }

    CheckDistFiles(callback)
    {
        this._callback = callback;

        // We first need to need where to check files, ask user first
        if (this._config.Get('wowDirectory') === undefined)
        {
            this.AskUserWowFolder();
            return;
        }

        this.GetDataFromServer();
    }

    AskUserWowFolder()
    {
        dialog.showOpenDialog({
            title: this._localize.translate('Select Wow folder (Create an empty one if you want new installation)'),
            properties: ['openDirectory', 'createDirectory']
        }, (filePaths) => {

            if (filePaths === undefined || filePaths.length !== 1) {
                this.AskUserWowFolder();
                return;
            }

            this._config.Set('wowDirectory', filePaths[0]);
            this.GetDataFromServer();
        });
    }

    GetDataFromServer()
    {
        axios.get(downloadUrl + downloadData).then((data) =>
        {
            this._files = data.data;
            this.HandleNextUpdateStep();
        })
        .catch((e) =>
        {
            dialog.showErrorBox(this._localize.translate('Error'), this._localize.translate('An error occured while fetching data from server, please re-try in a few minutes'));
            console.log(e);
        });
    }

    HandleNextUpdateStep()
    {
        if (this._files === undefined)
            return;

        switch (++this._updateStep)
        {
            case 1:
                this.CheckWebCertBundle();
                break;
            case 2:
                this.CheckMinimalWow();
                break;
            default:
            {
                let nextFile = this._updateStep - 3;
                if (nextFile >= this._files.length)
                {
                    this._callback();
                    break;
                }

                let fullPath = path.join(this._config.Get('wowDirectory'), this._files[nextFile].name);
                this.CheckFile(fullPath, this._config.Get('wowDirectory'), this._files[nextFile]);
                break;
            }
        }
    }

    // Check for patched blizzard web_cert_bundle
    CheckWebCertBundle()
    {
        let fullPath = path.join(webCertBundleDir, 'web_cert_bundle');
        let file = {
            'name': 'web_cert_bundle',
            'sha1': 'd23d7f3c1dd11f1c12ccf1314876f15a2544268c',
            'showProgress': true
        };
        this.CheckFile(fullPath, webCertBundleDir, file);
    }

    CheckMinimalWow()
    {
        let files = fs.readdirSync(this._config.Get('wowDirectory'));
        if (files.length !== 0)
        {
            this.HandleNextUpdateStep();
            return;
        }

        let file = {
            'name': 'Ashamane_735_minimal.zip',
            'sha1': 'baa26971dfd2186ec87cd6a534d2466574b017dd',
            'showProgress': true
        };

        this.DownloadFile(file, this._config.Get('wowDirectory'));
    }

    async CheckFile(fullPath, baseDir, file)
    {
        let localSha1 = '';
        if (fs.existsSync(fullPath))
            localSha1 = sha1File(fullPath);

        if (localSha1 !== file.sha1)
            this.DownloadFile(file, baseDir);
        else
            this.HandleNextUpdateStep();
    }

    DownloadFile(file, downloadDir)
    {
        console.log('Start downloading ' + file.name);

        let progressBar = null;
        if (file.showProgress)
        {
            progressBar = new ProgressBar({
                indeterminate: false,
                text: this._localize.translate('Downloading of ') + file.name,
                detail: '',
                title: this._localize.translate('Downloading')
            });
        }

        let totalBytes = 0;
        let totalBytesFormatted = '';

        download(this._mainWindow, path.join(downloadUrl, file.path !== undefined ? file.path: file.name),
        {
            directory: downloadDir,
            filename: file.name,
            onStarted(item) {
                totalBytes = item.getTotalBytes();
                totalBytesFormatted = FileUpdater.formatBytes(totalBytes);
            },
            onProgress(progress) {
                if (progressBar !== null) {
                    if (progressBar.value !== 100) {
                        progressBar.value = Math.ceil(progress * 100);

                        if (totalBytes){
                            let currentBytesFormated = FileUpdater.formatBytes(totalBytes * progress);
                            progressBar.detail = `${currentBytesFormated}/${totalBytesFormatted}...`;
                        }
                    }
                }
            }
        })
        .then(dl => {
            let savePath = dl.getSavePath();
            console.log("Downloaded : " + savePath);
            if (file.name.slice(-4) === '.zip')
            {
                console.log('Extracting : ' + file.name);
                extract(savePath, {dir: downloadDir}, (extractErr) =>
                {
                    fs.unlinkSync(savePath);
                    if (extractErr) throw extractErr;

                    setTimeout(() =>
                    {
                        console.log('Extract done, HandleNextUpdateStep');
                        this.HandleNextUpdateStep();
                    }, 2000);
                });
            }
            else
                this.HandleNextUpdateStep();
        })
        .catch(ex =>
        {
            progressBar.close();
            console.log(ex);
            this.HandleNextUpdateStep();
        });
    }

    static formatBytes(bytes,decimals)
    {
        if(bytes === 0) return '0 Bytes';
        let k = 1024,
            dm = decimals <= 0 ? 0 : decimals || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}
