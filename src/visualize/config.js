import * as visualizers from './visualizers';
import parseObject from '../helpers/parsing/parse-object';
import validateArray from '../helpers/validation/validate-array';
import validateObject from '../helpers/validation/validate-object';
import isString from '../helpers/general/is-string';


export default {
    visualizer: {
        default: 'basic',
        parse: input => input,
        validate: value => visualizers.hasOwnProperty(value)
    },

    columns: {
        default: ['position', 'item', 'total', 'match', 'opponent'],
        parse: input => input.split(','),
        validate: value => validateArray(value, isString)
    },

    id: {
        default: '',
        parse: input => input,
        validate: isString
    },

    startFromRound: {
        default: 'last',
        parse: input => input === "last" ? 'last' : Number.parseInt(input, 10),
        validate: value => value === "last" || !Number.isNaN(value)
    },

    labels: {
        default: {
            season: 'Season',
            round: 'Round',
            position: '#',
            item: 'Team',
            total: 'Points',
            changes: 'Changes',
            change: 'Change'
        },
        parse: input => parseObject(input),
        validate: obj => validateObject(obj,
            key => ['season', 'round', 'position', 'item', 'total', 'changes', 'change'].includes(key),
            value => isString(value)
        )
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
        default: 1.0,
        parse: input => Number.parseFloat(input),
        validate: value => !Number.isNaN(value) && value > 0.0 && value <= 10.0
    }
};
