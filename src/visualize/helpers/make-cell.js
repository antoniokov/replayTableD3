import formatPosition from './format-position';
import calculations from '../../calculate/calculations';


export default function (column, result, params) {
    switch (column) {
        case 'position':
            return {
                item: result.item,
                text: formatPosition(result.position, params.positionWhenTied),
                classes: ['position']
            };
        case 'item':
            return {
                item: result.item,
                text: result.item,
                classes: ['item']
            };
        default:
            if (calculations.hasOwnProperty(column)) {
                return {
                    item: result.item,
                    text: result[column].total,
                    classes: ['calculation']
                }
            } else {
                return {
                    item: result.item,
                    text: '',
                    classes: []
                }
            }
    }
};
