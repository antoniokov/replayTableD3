import validateArray from '../../helpers/validation/validate-array';
import isString from '../../helpers/general/is-string';

export default {
    columns: {
        default: ['position', 'item', 'points'],
        parse: input => input.split(','),
        validate: value => validateArray(value, isString)
    },

    labels: {
        default: ['#', 'Team', 'Points'],
        parse: input => input.split(','),
        validate: value => validateArray(value, isString)
    }
};
