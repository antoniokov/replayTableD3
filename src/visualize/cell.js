import calculations from '../calculate/calculations';
import numberToChange from '../helpers/general/number-to-change';
import formatPosition from './helpers/format-position';
import mapParamToModule from '../configure/helpers/map-param-to-module';


export default class {
    constructor (column, result, params) {
        this.column = column;
        this.result = result;

        const customConstructors = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        if (customConstructors.includes(column)) {
            return this[column](result, params);
        } else if (column.includes('spark')) {
            return this.makeSpark(column, result, params);
        } else if (calculations.hasOwnProperty(column)) {
            return this.makeCalculation(column, result, params);
        } else if (column.includes('.change')) {
            return this.makeChange(column, result, params);
        } else if (mapParamToModule(column, result.extras)) {
            return this.makeExtra(column, result, params);
        } else {
            this.text = '';
            this.classes = [];
            return this;
        }
    }

    position (result, params) {
        this.text = formatPosition(result.position, params.positionWhenTied);
        this.classes = ['position'];
        return this;
    }

    item (result, params) {
        this.text = result.item;
        this.classes = ['item', 'clickable'];
        return this;
    }

    match (result, params) {
        this.text = result.match ? `${result.match.score}-${result.match.opponentScore} ${result.match.opponent}` : '';
        this.classes = ['change'];
        return this;
    }

    outcome (result, params) {
        this.text = '';
        this.classes = ['outcome'];
        this.backgroundColor = params.colors[result.outcome] || 'transparent';
        return this;
    }

    goalsDifference (result, params) {
        this.text = numberToChange(result.goalsDifference.total, '0');
        this.classes = ['calculation'];
        return this;
    }

    winningPercentage (result, params) {
        this.text = result.winningPercentage.total.toFixed(3).toString().replace('0','');
        this.classes = ['calculation'];
        return this;
    }

    round (result, params) {
        this.text = result.roundMeta.name;
        this.classes = ['round', 'clickable'];
        return this;
    }

    makeSpark (column, result, params) {
        this.text = '';
        this.classes = ['outcome'];

        const [spark, roundIndex] = column.split('.');
        const itemResults = params.sparklinesData.get(result.item);

        if (roundIndex >= itemResults.length) {
            this.backgroundColor = 'transparent';
        } else {
            this.backgroundColor = params.colors[itemResults[roundIndex].outcome] || 'transparent';
        }

        return this;
    }

    makeCalculation (column, result, params) {
        this.text = result[column].total;
        this.classes = ['calculation'];
        return this;
    }

    makeChange (column, result, params) {
        const calc = column.replace('.change', '');
        this.text = numberToChange(result[calc].change);
        this.classes = ['change'];
        return this;
    }

    makeExtra (column, result, params) {
        const extraType = mapParamToModule(column, result.extras);
        this.text = result.extras[extraType][column];
        this.classes = [`extra-${extraType}`];
        return this;
    }
};