import calculations from '../../calculate/calculations';
import numberToChange from '../../helpers/general/number-to-change';
import formatPosition from './format-position';
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
        case 'points.change':
            return {
                column: 'points.change',
                result: result,
                text: numberToChange(result.points.change),
                classes: ['change']
            };
        case 'match':
            return {
                column: 'match',
                result: result,
                text: result.match ? `${result.match.score}-${result.match.opponentScore} ${result.match.opponent}` : '',
                classes: ['change']
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
                };
            } else if (column.includes('.change')) {
                const calc = column.replace('.change', '');
                return {
                    column: column,
                    result: result,
                    text: result[calc].change,
                    classes: ['change']
                };
            } else {
                const extraType = mapParamToModule(column, result.extras);

                if (extraType) {
                    return {
                        column: column,
                        result: result,
                        text: result.extras[extraType][column],
                        classes: ['extra']
                    };
                } else {
                    return {
                        column: column,
                        result: result,
                        text: '',
                        classes: []
                    };
                }
            }
    }
};
