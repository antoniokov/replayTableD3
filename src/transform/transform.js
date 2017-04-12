import * as transformers from './transformers';
import * as postTransformers from './post-transformers';
import parametrize from '../configure/parametrize';
import config from './config';


export default function (rawData, userConfig) {
    const params = parametrize(config, userConfig);

    const transformed = transformers[params.transformer](rawData, params);

    const filtered = params.filterItems.length > 0
        ? postTransformers.filterItems(transformed, params.filterItems)
        : transformed;

    const collapsed = params.collapseToRounds
        ? postTransformers.collapseToRounds(filtered)
        : filtered;

    return params.insertStartRound
        ? postTransformers.insertStartRound(collapsed, params.insertStartRound)
        : collapsed;
};
