import * as controls from '../controls';
import parseObject from '../../helpers/parsing/parse-object';
import validateArray from '../../helpers/validation/validate-array';
import validateObject from '../../helpers/validation/validate-object';
import isString from '../../helpers/general/is-string';

export default {
    controls: {
        default: ['play', 'previous', 'next', 'slider'],
        parse: input => input.split(','),
        validate: value => validateArray(value, value => controls.hasOwnProperty(value))
    },

    columns: {
        default: ['position', 'item', 'points', 'outcome'],
        parse: input => input.split(','),
        validate: value => validateArray(value, isString)
    },

    labels: {
        default: ['#', 'Team', 'Points', ''],
        parse: input => input.split(','),
        validate: value => validateArray(value, isString)
    },

    colorAnimation: {
        default: false,
        parse: input => input === "true",
        validate: typeof value === 'boolean'
    }
};
