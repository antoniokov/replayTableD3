import calculations from '../../calculate/calculations';
import numberToChange from '../../helpers/general/number-to-change';
import formatPosition from './format-position';
import mapParamToModule from '../../configure/helpers/map-param-to-module';


export default function (column, result, params) {
    const cell = {
        column: column,
        result: result
    };

    switch (column) {
        case 'position':
            cell.text = formatPosition(result.position, params.positionWhenTied);
            cell.classes = ['position'];
            return cell;
        case 'item':
            cell.text = result.item;
            cell.classes = ['item', 'clickable'];
            return cell;
        case 'outcome':
            cell.text = '';
            cell.classes = ['outcome'];
            cell.backgroundColor = params.colors[result.outcome] || 'transparent';
            return cell;
        case 'match':
            cell.text = result.match ? `${result.match.score}-${result.match.opponentScore} ${result.match.opponent}` : '';
            cell.classes = ['change'];
            return cell;
        case 'goalsDifference':
            cell.text = numberToChange(result.goalsDifference.total, '0');
            cell.classes = ['calculation'];
            return cell;
        case 'winningPercentage':
            cell.text = result.winningPercentage.total.toFixed(3).toString().replace('0','');
            cell.classes = ['calculation'];
            return cell;
        case 'round':
            cell.text = result.roundMeta.name;
            cell.classes = ['round', 'clickable'];
            return cell;
        default:
            if (calculations.hasOwnProperty(column)) {
                cell.text = result[column].total;
                cell.classes = ['calculation'];
            } else if (column.includes('.change')) {
                const calc = column.replace('.change', '');
                cell.text = numberToChange(result[calc].change);
                cell.classes = ['change'];
            } else {
                const extraType = mapParamToModule(column, result.extras);

                if (extraType) {
                    cell.text = result.extras[extraType][column];
                    cell.classes = [`extra-${extraType}`];
                } else {
                    cell.text = '';
                    cell.classes = [];
                }
            }

            return cell;
    }
};
