import Skeleton from '../skeleton';
import makeCell from '../helpers/make-cell';
import getItems from '../../helpers/data/get-items';
import getItemResults from '../../helpers/data/get-item-results';


const columns = ['position', 'item', 'sparkline', 'score', 'opponent', 'change', 'equal', 'points'];


export default class extends Skeleton {
    constructor (data, params) {
        super(data, params);

        const items = getItems(data.results);
        this.sparklinesData = new Map(items.map(item => [item, getItemResults(data.results, item)]));
    }

    makeTable (data, className, columns) {
        const table = this.tableContainer
            .append('table')
            .attr('class', className);

        const tbody = table.append('tbody');
        const rows = tbody.selectAll('tr')
            .data(data, k => k.item || k.roundMeta.index)
            .enter().append('tr');

        const cells = rows.selectAll('td')
            .data(result => columns.map(column => makeCell(column, result, this.params)))
            .enter().append('td')
            .attr('class', cell => cell.classes.join(' '))
            .style('background-color', cell => cell.backgroundColor || 'transparent')
            .text(cell => cell.text)
            .on('click', cell => {
                switch(cell.column) {
                    case 'item':
                        return this.drillDown(cell.result.item);
                    case 'round':
                        return this.endDrillDown(cell.result.roundMeta.index);
                    default:
                        return null;
                }
            });

        return [table, rows, cells];
    }

    renderTable (data, className = 'main') {
        this.left = {};
        this.right = {};

        this.left.columns = ['position', 'item', 'outcome'];
        this.right.columns = ['match', 'change', 'points'];

        [this.left.table, this.left.rows, this.left.cells] = this.makeTable(data, `${className} left`, this.left.columns);
        [this.right.table, this.right.rows, this.right.cells] = this.makeTable(data, `${className} right`, this.right.columns);

        const tables = d3.selectAll(`${this.selector} table.main`);
        const rows = d3.selectAll(`${this.selector} table.main > tbody > tr`);
        const cells = d3.selectAll(`${this.selector} table.main > tbody > tr > td`);

        return [tables, rows, cells];
    }

    to (roundIndex) {
        if (roundIndex < 0 || roundIndex > this.data.meta.lastRound) {
            return Promise.reject(`Sorry we can't go to round #${roundIndex}`);
        }

        this.dispatch.call('roundChange', this, this.data.results[roundIndex].meta);

        const nextRoundResults = new Map(this.data.results[roundIndex].results.map(result => [result.item, result]));

        this.table.selectAll('td.change')
            .text(cell => makeCell(cell.column, nextRoundResults.get(cell.result.item), this.params).text);

        return this.move(roundIndex, 0, this.durations.move);
    }

    preview (roundIndex) {
        this.dispatch.call('roundPreview', this, this.data.results[roundIndex].meta);

        this.rows = this.rows
            .data(this.data.results[roundIndex].results, k => k.item);

        this.cells = this.rows.selectAll('td')
            .data(result => this.params.columns.map(column => makeCell(column, result, this.params)))
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

        this.controls.classed('hidden', true);
        this.drilldown.controls = this.controlsContainer.append('div')
            .attr('class', 'drilldown-contorls');
        this.drilldown.controls.append('div')
            .attr('class', 'back')
            .text('<-')
            .on('click', this.endDrillDown.bind(this));
        this.drilldown.controls.append('div')
            .attr('class', 'item')
            .text(item);

        const columns = ['round'];
        const labels = [''];
        this.params.columns.forEach((column, i) => {
            const classes = makeCell(column, this.data.results[1].results[0], this.params).classes;
            if (column !== 'item' && !classes.includes('extra-item')) {
                columns.push(column);
                labels.push(this.params.labels[i] || '');
            }
        });

        const itemData = this.data.results
            .map(round => {
                const result = round.results.filter(result => result.item === item)[0];
                return Object.assign({}, result, { roundMeta: round.meta });
            }).filter(result => result.change !== null);

        this.table.classed('hidden', true);
        [this.drilldown.table, this.drilldown.rows, this.drilldown.cells] = this.renderTable(itemData, 'drilldown', columns, labels);

        return Promise.resolve();
    }

    endDrillDown (roundIndex = null) {
        const end = () => {
            this.dispatch.call('endDrillDown', this, roundIndex);
            return Promise.resolve();
        };

        this.drilldown.controls.remove();
        this.controls.classed('hidden', false);

        this.drilldown.table.remove();
        this.table.classed('hidden', false);

        if (roundIndex !== null) {
            return Promise.resolve(this.to(roundIndex))
                .then(end);
        } else {
            end();
        }
    }
};
