import * as jetpack from "fs-jetpack";

const isDevelopment = process.env.NODE_ENV !== 'production';

export class Config
{
    constructor()
    {
        this._fileName = 'conf.json';
        if (isDevelopment)
            this._fileName = 'conf_dev.json';

        this.Load();
    }

    Load()
    {
        this._data = jetpack.read(this._fileName, 'json');

        if (!(this._data instanceof Object))
            this._data = {};
    }

    Save()
    {
        jetpack.write(this._fileName, this._data);
    }

    Get(name)
    {
        return this._data[name];
    }

    Set(name, value)
    {
        this._data[name] = value;
        this.Save();
        return this;
    }
}
