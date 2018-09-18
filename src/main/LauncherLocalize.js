import {app} from "electron";
const Localize = require('localize');

export class LauncherLocalize
{
    constructor()
    {
        this._localize = new Localize({
            'Update': {
                'fr': 'Mise à Jour'
            },
            'Updating': {
                'fr': 'Mise à Jour'
            },
            'Downloading launcher update...': {
                'fr': 'Téléchargement de la mise à jour du launcher...'
            },
            'Select Wow folder (Create an empty one if you want new installation)': {
                'fr': 'Séléctionnez votre dossier WoW (ou créez en un vide si nouvelle installation'
            },
            'Downloading': {
                'fr': 'Téléchargement'
            },
            'Downloading of ': {
                'fr': 'Téléchargement de '
            },
            'Error': {
                'fr': 'Erreur'
            },
            'An error occured while fetching data from server, please re-try in a few minutes': {
                'fr': 'Une erreur est surevenue lors du téléchargement des données depuis le serveur, merci de ré-essayer dans quelques minutes'
            }
        });

        let locale = app.getLocale();
        switch (locale)
        {
            case 'fr':
            case 'en':
                break;
            default:
                locale = 'en';
                break;
        }

        this._localize.setLocale(locale);
    }

    translate(text)
    {
        return this._localize.translate(text);
    }

    static GetWTFLocale()
    {
        switch (app.getLocale())
        {
            default:
            case 'en':
                return 'enUS';
            case 'fr':
                return 'frFR';
            case 'es':
                return 'esES';
        }
    }
}