import * as visualizers from './visualizers';
import isString from '../helpers/general/is-string';
import parseObject from '../helpers/parsing/parse-object';
import validateObject from '../helpers/validation/validate-object';


export default {
    id: {
        default: '',
        parse: input => input,
        validate: isString
    },

    visualizer: {
        default: 'basic',
        parse: input => input,
        validate: value => visualizers.hasOwnProperty(value)
    },

    startFromRound: {
        default: undefined,
        parse: input => Number.parseInt(input, 10),
        validate: value => !value || !Number.isNaN(value)
    },

    roundsTotalNumber: {
        default: undefined,
        parse: input => Number.parseInt(input, 10) || undefined,
        validate: value => !value || !Number.isNaN(value)
    },

    positionWhenTied: {
        default: 'strict',
        parse: input => input,
        validate: value => ['strict', 'highest', 'range', 'average'].includes(value)
    },

    speed: {
        default: 2.0,
        parse: Number.parseFloat,
        validate: value => !Number.isNaN(value) && value > 0.0 && value <= 10.0
    },

    colors: {
        default: {
            'win': '#EDFFDF',
            'draw': '#F3F3F3',
            'loss': '#FFECEC'
        },
        parse: parseObject,
        validate: obj => validateObject(obj,
            key => ['win', 'draw', 'loss'].includes(key),
            value => isString(value))
    }
};
