import * as visualizers from './visualizers';
import parametrize from '../configure/parametrize';
import config from './config';

export default function (calculatedData, userConfig) {
    const params = parametrize(config, userConfig);
    const replayTable = new visualizers[params.visualizer](calculatedData, params);
    //setTimeout(() => replayTable.drillDownToItem('Everton'), 1000);
};
