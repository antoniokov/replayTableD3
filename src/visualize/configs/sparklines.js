import validateArray from '../../helpers/validation/validate-array';
import isString from '../../helpers/general/is-string';
import * as controls from '../controls';

export default {
    controls: {
        default: ['play'],
        parse: input => input.split(','),
        validate: value => validateArray(value, value => controls.hasOwnProperty(value))
    }
};
