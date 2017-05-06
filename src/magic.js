import configure from './configure/configure';
import extract from './extract/extract';
import transform from './transform/transform';
import calculate from './calculate/calculate';
import visualize from './visualize/visualize';

import crash from './helpers/crash';


export default function () {
    Array.from(document.getElementsByClassName('replayTable'))
        .forEach(table => {
            const config = configure(table.id, table.dataset);

            Promise.resolve(extract(config.extract))
                .then(raw => {
                    const transformed = transform(raw, config.transform);
                    const calculated = calculate(transformed, config.calculate);
                    const replayTable = visualize(calculated, config.visualize);
                })
                .catch(error => crash(error));
        });
};
