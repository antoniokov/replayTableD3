import formatPosition from './format-position';
import calculations from '../../calculate/calculations';
import mapParamToModule from '../../configure/helpers/map-param-to-module';


export default function (column, result, params) {
    switch (column) {
        case 'position':
            return {
                column: 'position',
                result: result,
                text: formatPosition(result.position, params.positionWhenTied),
                classes: ['position']
            };
        case 'item':
            return {
                column: 'item',
                result: result,
                text: result.item,
                classes: ['item']
            };
        case 'outcome':
            return {
                column: 'outcome',
                result: result,
                text: '',
                classes: ['outcome']
            };
        case 'winningPercentage':
            return {
                column: 'winningPercentage',
                result: result,
                text: result.winningPercentage.total.toFixed(3).toString().replace('0',''),
                classes: ['calculation']
            };
        default:
            if (calculations.hasOwnProperty(column)) {
                return {
                    column: column,
                    result: result,
                    text: result[column].total,
                    classes: ['calculation']
                }
            } else {
                const extraType = mapParamToModule(column, result.extras);

                if (extraType) {
                    return {
                        column: column,
                        result: result,
                        text: result.extras[extraType][column],
                        classes: ['extra']
                    }
                } else {
                    return {
                        column: column,
                        result: result,
                        text: '',
                        classes: []
                    }
                }
            }
    }
};
