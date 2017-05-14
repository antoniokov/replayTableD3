import validateArray from '../../helpers/validation/validate-array';
import isString from '../../helpers/general/is-string';
import * as controls from '../controls';
import parseObject from '../../helpers/parsing/parse-object';
import validateObject from '../../helpers/validation/validate-object';

export default {
    controls: {
        default: ['play'],
        parse: input => input.split(','),
        validate: value => validateArray(value, value => controls.hasOwnProperty(value))
    },

    colors: {
        default: {
            'win': '#ACE680',
            'draw': '#B3B3B3',
            'loss': '#E68080'
        },
        parse: parseObject,
        validate: obj => validateObject(obj,
            key => ['win', 'draw', 'loss'].includes(key),
            value => isString(value))
    },

    sparkColors: {
        default: {
            'win': '#A8C968',
            'draw': '#C2C2C2',
            'loss': '#D78B68'
        },
        parse: parseObject,
        validate: obj => validateObject(obj,
            key => ['win', 'draw', 'loss'].includes(key),
            value => isString(value))
    },

    pointsLabel: {
        default: 'points',
        parse: input => input,
        validate: isString
    },

    allLabel: {
        default: 'All',
        parse: input => input,
        validate: isString
    }
};
