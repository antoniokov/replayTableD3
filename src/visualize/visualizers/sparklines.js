import Skeleton from '../skeleton';
import skeletonCell from '../cell';
import numberToChange from '../../helpers/general/number-to-change';
import getItems from '../../helpers/data/get-items';
import getItemResults from '../../helpers/data/get-item-results';
import toCSS from '../../helpers/general/to-css';


export default class extends Skeleton {
    constructor (data, params) {
        const items = getItems(data.results);
        const paramsEnriched = Object.assign(params, {
            sparklinesData: new Map(items.map(item => [item, getItemResults(data.results, item)]))
        });

        super(data, paramsEnriched);
    }

    makeTable (data, className, columns) {
        const table = this.tableContainer
            .append('table')
            .attr('class', className);

        const tbody = table.append('tbody');
        const rows = tbody.selectAll('tr')
            .data(data, k => k.item)
            .enter().append('tr')
            .attr('id', k => k.item);

        const cells = rows.selectAll('td')
            .data(result => columns.map(column => new Cell(column, result, this.params)))
            .enter().append('td')
            .attr('class', cell => cell.classes.join(' '))
            .each(function(cell) {
                ['color', 'backgroundColor']
                    .filter(property => cell.hasOwnProperty(property))
                    .forEach(property => d3.select(this).style(toCSS(property), cell[property]));
            })
            .text(cell => cell.text)
            .on('click', cell => {
                switch(cell.column) {
                    case 'item':
                        if (this.drilldown.item !== cell.result.item) {
                            return this.drillDown(cell.result.item);
                        } else {
                            return this.endDrillDown();
                        }
                    default:
                        return null;
                }
            });

        table.selectAll('td.spark')
            .append('span')
            .attr('class', 'position-line');

        return [table, rows, cells];
    }

    makeSlider (position = 'top') {
        const slider = position === 'top'
            ? this.left.table.select('tbody').insert('tr', 'tr')
            : this.left.table.select('tbody').append('tr');

        slider
            .attr('class', `sparklines-slider ${position}`)
            .selectAll('td')
            .data(this.left.columns.slice(0, 3))
            .enter().append('td')
            .attr('colspan', (d,i) => i === 2 ? this.roundsTotalNumber: null)
            .attr('class', (d,i) => i === 2 ? 'slider-cell' : null);

        slider.select('.slider-cell')
            .append('span')
            .attr('class', 'slider-toggle')
            .text(this.data.results[this.currentRound].meta.name);
    }

    renderTable (data, className = 'main') {
        this.left = {};
        this.right = {};
        this.slider = {};

        const sparks = Array.from({ length: this.roundsTotalNumber }, (v, i) => `spark.${i+1}`);
        this.left.columns = ['position', 'item', ...sparks];
        this.right.columns = ['score', 'opponent', 'points.change', 'equal', 'points', 'pointsLabel'];

        [this.left.table, this.left.rows, this.left.cells] = this.makeTable(data, `${className} left`, this.left.columns);
        [this.right.table, this.right.rows, this.right.cells] = this.makeTable(data, `${className} right`, this.right.columns);

        this.right.table.style('left', `${this.left.table.node().getBoundingClientRect().right}px`);

        const tables = d3.selectAll(`${this.selector} table.${className}`);
        const rows = d3.selectAll(`${this.selector} table.${className} > tbody > tr`);
        const cells = d3.selectAll(`${this.selector} table.${className} > tbody > tr > td`);

        this.slider.top = this.makeSlider('top');
        this.slider.bottom = this.makeSlider('bottom');

        return [tables, rows, cells];
    }

    to (roundIndex) {
        if (roundIndex < 0 || roundIndex > this.data.meta.lastRound) {
            return Promise.reject(`Sorry we can't go to round #${roundIndex}`);
        }

        this.dispatch.call('roundChange', this, this.data.results[roundIndex].meta);

        const nextRoundResults = new Map(this.data.results[roundIndex].results.map(result => [result.item, result]));

        const params = this.params;
        this.table.selectAll('td.change')
            .each(function (currentCell) {
                const cell = new Cell(currentCell.column, nextRoundResults.get(currentCell.result.item), params);
                if (cell.color) {
                    d3.select(this).style('color', cell.color)
                }

                d3.select(this).text(cell.text);
            });

        return this.move(roundIndex, 0, this.durations.move);
    }

    preview (roundIndex) {
        this.dispatch.call('roundPreview', this, this.data.results[roundIndex].meta);

        this.rows = this.rows
            .data(this.data.results[roundIndex].results, k => k.item);

        this.cells = this.rows.selectAll('td')
            .data(result => this.params.columns.map(column => new Cell(column, result, this.params)))
            .attr('class', cell => cell.classes.join(' '))
            .style('background-color', cell => cell.backgroundColor || 'transparent')
            .text(cell => cell.text);

        return Promise.resolve();
    }

    endPreview (move = false) {
        const end = () => {
            this.dispatch.call('endPreview', this, this.data.results[this.currentRound].meta);
            return Promise.resolve();
        };

        if (this.previewedRound === null || this.previewedRound === this.currentRound) {
            return end();
        } else if (!move) {
            return Promise.resolve(this.preview(this.currentRound))
                .then(end);
        } else {
            return Promise.resolve(this.to(this.previewedRound))
                .then(end);
        }
    }

    drillDown (item) {
        this.dispatch.call('drillDown', this, item);

        if (!this.drilldown.controls) {
            this.drilldown.controls = this.controls.append('div')
                .attr('class', 'drilldown-control')
                .on('click', this.endDrillDown)
                .text(this.params.allLabel);
        }

        this.left.table.selectAll('td.spark')
            .classed('muted', cell => {
                return !cell.result.match || (cell.result.item !== item && cell.result.match.opponent !== item)
            });

        return Promise.resolve();
    }

    endDrillDown () {
        this.drilldown.controls.remove();
        this.drilldown.controls = null;

        this.left.table.selectAll('td.spark')
            .classed('muted', false);

        this.dispatch.call('endDrillDown', this, null);
        return Promise.resolve();
    }
};


class Cell extends skeletonCell {
    score (result, params) {
        this.text = result.match ? `${result.match.score}:${result.match.opponentScore}` : '';
        this.classes = ['score', 'change'];
        this.color = params.colors[result.outcome];
        return this;
    }

    opponent (result, params) {
        this.text = result.match ? result.match.opponent : '';
        this.classes = ['opponent', 'change'];
        return this;
    }

    equal (result, params) {
        this.text = result.position.strict === 1 ? '=' : '';
        this.classes = ['label', 'change'];
        return this;
    }

    pointsLabel (result, params) {
        this.text = result.position.strict === 1 ? params.pointsLabel : '';
        this.classes = ['label', 'change'];
        return this;
    }

    makeChange (column, result, params) {
        const calc = column.replace('.change', '');
        this.text = numberToChange(result[calc].change, '0');
        this.classes = ['change'];
        this.color = params.colors[result.outcome];
        return this;
    }
}
