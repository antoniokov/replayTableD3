import * as configs from './configs';
import * as presets from './presets';
import toCamelCase from '../helpers/general/to-camel-case';
import warn from '../helpers/warn';


const reservedKeywords = ['preset'];

export default function (id, userConfig) {
    const config = getPresetConfig(userConfig.preset) || getEmptyConfig(id);

    Object.keys(userConfig)
        .filter(param => !reservedKeywords.includes(param))
        .map(param => toCamelCase(param))
        .forEach(param => {
            const module = paramToModule(param);

            if (module) {
                config[module][param] = configs[module][param].parse(userConfig[param]);
            } else {
                warn(`Sorry, there is no "${param}" parameter available. Ignoring it and moving on.`);
            }
        });

    return config;
};


function getPresetConfig (userPreset) {
    if (!userPreset) {
        return null;
    }

    if (!presets.hasOwnProperty(userPreset)) {
        warn(`No "${userPreset}" preset for now, sorry about that. Moving on with the default settings.`);
        return null;
    }

    return presets[userPreset];
}

function getEmptyConfig (id) {
    return Object.keys(configs).reduce((obj, module) => Object.assign(obj, { [module]: { id: id } }), {});
}

function paramToModule (param) {
    const modules = Object.keys(configs)
        .filter(config => configs[config].hasOwnProperty(param));
    return modules.length > 0 ? modules[0] : null;
}

