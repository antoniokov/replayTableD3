import formatPosition from './format-position';
import calculations from '../../calculate/calculations';
import mapParamToModule from '../../configure/helpers/map-param-to-module';


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
        case 'winningPercentage':
            return {
                item: result.item,
                text: result.winningPercentage.total.toFixed(3).toString().replace('0',''),
                classes: ['calculation']
            };
        default:
            if (calculations.hasOwnProperty(column)) {
                return {
                    item: result.item,
                    text: result[column].total,
                    classes: ['calculation']
                }
            } else {
                const extraType = mapParamToModule(column, result.extras);

                if (extraType) {
                    return {
                        item: result.item,
                        text: result.extras[extraType][column],
                        classes: ['extra']
                    }
                } else {
                    return {
                        item: result.item,
                        text: '',
                        classes: []
                    }
                }
            }
    }
};
