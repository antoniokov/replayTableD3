import './replay-table.css';
import configure from './configure/configure';
import extract from './extract/extract';
import transform from './transform/transform';
import calculate from './calculate/calculate';
import visualize from './visualize/visualize';

import crash from './helpers/crash';


Array.from(document.getElementsByClassName('replayTable'))
    .forEach(table => {
        const config = configure(table.dataset);
        config.visualize.id = table.id;

        Promise.resolve(extract(config.extract))
            .then(raw => {
                const transformed = transform(raw, config.transform);
                const calculated = calculate(transformed, config.calculate);
                visualize(calculated, config.visualize);
            })
            .catch(error => crash(error));
    });
