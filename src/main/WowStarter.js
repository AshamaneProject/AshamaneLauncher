import {app} from "electron";

import { Config } from './Config.js'
const path = require('path');
const spawn = require('child_process').spawn;
const fs = require('fs');
import jetpack from "fs-jetpack";
import {LauncherLocalize} from "./LauncherLocalize";

const portal = 'SET portal "logon.ashamane.com"';

export class WoWStarter
{
    StartWoW()
    {
        this._config = new Config();

        if (this._config.Get('wowDirectory') === undefined)
            return;

        this.CheckConfigWtf();
    }

    CheckConfigWtf()
    {
        this._configPath = path.join(this._config.Get('wowDirectory'),  'WTF', 'Config.wtf');
        let lines = [];

        if (!fs.existsSync(this._configPath))
        {
            lines.unshift('SET audioLocale "' + LauncherLocalize.GetWTFLocale() + '"');
            lines.unshift('SET textLocale "' + LauncherLocalize.GetWTFLocale() + '"');
            lines.unshift(portal);
            this.WriteConfigWTF(lines);
            return;
        }

        let lineReader = require('readline').createInterface({
            input: require('fs').createReadStream(this._configPath)
        });

        lineReader.on('line', (line) =>
        {
            if (!line.includes('portal'))
                lines.push(line);
        })
        .on('close', () =>
        {
            lines.unshift(portal);
            this.WriteConfigWTF(lines);
        });
    }

    WriteConfigWTF(lines)
    {
        jetpack.write(this._configPath, lines.join('\r\n'), { atomic: true });
        this.LaunchWowProcess();
    }

    LaunchWowProcess()
    {
        let wowName = 'Wow.exe';
        if (process.env.PROCESSOR_ARCHITECTURE === 'AMD64')
            wowName = 'Wow-64.exe';

        spawn(path.join(this._config.Get('wowDirectory'), wowName), {
            detached: true
        });

        app.quit();
    }
}
