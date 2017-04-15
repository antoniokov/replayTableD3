import * as controls from '../controls';
import parseObject from '../../helpers/parsing/parse-object';
import validateArray from '../../helpers/validation/validate-array';
import validateObject from '../../helpers/validation/validate-object';
import isString from '../../helpers/general/is-string';

export default {
    controls: {
        default: ['play', 'previous', 'next'],
        parse: input => input.split(','),
        validate: value => validateArray(value, value => controls.hasOwnProperty(value))
    },

    columns: {
        default: ['position', 'item', 'total'],
        parse: input => input.split(','),
        validate: value => validateArray(value, isString)
    },

    labels: {
        default: {
            position: '#',
            item: 'Team',
            total: 'Points'
        },
        parse: parseObject,
        validate: obj => validateObject(obj,
            key => ['position', 'item', 'total'].includes(key),
            value => isString(value))
    }
};
