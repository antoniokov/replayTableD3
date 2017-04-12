import calculations from './calculations';
import validateArray from '../helpers/validation/validate-array';


export default {
    orderBy: {
        default: ['total'],
        parse: input => input.split(','),
        validate: value => validateArray(value, value => calculations.hasOwnProperty(value))
    }
};
