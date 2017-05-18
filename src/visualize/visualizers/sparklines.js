import Skeleton from '../skeleton';
import skeletonCell from '../cell';
import numberToChange from '../../helpers/general/number-to-change';
import getItemResults from '../../helpers/data/get-item-results';


export default class extends Skeleton {
    constructor (data, params) {
        super(data, params);

        this.durations.scale = d3.scaleLinear()
            .domain([1, data.meta.lastRound])
            .range([this.durations.move, 1.5*this.durations.move]);
    }

    makeTable (data, classes, columns) {
        const table = this.tableContainer
            .append('table')
            .attr('class', classes.join(' '));

        const tbody = table.append('tbody');
        const rows = tbody.selectAll('tr')
            .data(data, k => k.item)
            .enter().append('tr');

        const cells = rows.selectAll('td')
            .data(result => columns.map(column => new Cell(column, result, this.params)))
            .enter().append('td')
            .attr('class', cell => cell.classes.join(' '))
            .style('color', cell => cell.color)
            .text(cell => cell.text);

        cells.filter('.clickable')
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

        return [table, rows, cells];
    }

    makeSparks (data) {
        const table = this.tableContainer
            .append('table')
            .attr('class', 'sparks');

        const tbody = table.append('tbody');

        const sparksData = data.map(result => ({
            item: result.item,
            results: getItemResults(this.data.results, result.item)
        }));

        const rows = tbody.selectAll('tr')
            .data(sparksData, k => k.item)
            .enter().append('tr');

        const cells = rows.selectAll('td')
            .data(row => this.data.results.map((round, i) => ({
                result: row.results[i],
                roundMeta: row.results[i].roundMeta
            })))
            .enter().append('td')
            .attr('class', cell => `spark ${cell.roundMeta.index === this.currentRound ? 'current' : ''}`)
            .style('background-color', cell => {
                if (cell.roundMeta.index === this.currentRound) {
                    return this.params.currentSparkColors[cell.result.outcome] || 'transparent';
                } else {
                    return this.params.sparkColors[cell.result.outcome] || 'transparent';
                }
            })
            .on('mouseover', cell => this.preview(cell.roundMeta.index))
            .on('mouseout', cell => this.endPreview(false))
            .on('click', cell => this.endPreview(true));

        const scale = d3.scaleLinear()
            .domain([1, sparksData.length])
            .range([0, 100]);

        cells
            .append('span')
            .attr('class', 'spark-position')
            .style('top', cell => `${scale(cell.result.position.strict)}%`);

        cells
            .append('span')
            .attr('class', 'spark-score muted')
            .style('color', cell => this.params.colors[cell.result.outcome] || 'black')
            .text(cell => cell.result.match ? `${cell.result.match.score}:${cell.result.match.opponentScore}` : '');


        const switchCurrent = roundMeta => {
            this.sparks.cells
                .classed('current', cell => cell.roundMeta.index === roundMeta.index)
                .style('background-color', cell => {
                    if (cell.roundMeta.index === roundMeta.index) {
                        return this.params.currentSparkColors[cell.result.outcome] || 'transparent';
                    } else {
                        return this.params.sparkColors[cell.result.outcome] || 'transparent'
                    }
                });
        };

        this.dispatch.on('roundPreview.sparks', switchCurrent);
        this.dispatch.on('roundChange.sparks', switchCurrent);


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

        const left = `${this.scale(this.currentRound)}px`;
        return slider.select('.slider-cell')
            .append('span')
            .attr('class', 'slider-toggle')
            .style('left', left)
            .text(this.data.results[this.currentRound].meta.name)
            .call(d3.drag()
                .on("drag", () => {
                    const roundIndex = Math.round(this.scale.invert(d3.event.x));
                    this.moveRightTable(roundIndex);
                    this.preview(roundIndex);
                })
                .on("end", () => this.endPreview(true))
            );
    }

    renderTable (data, classes = ['main']) {
        this.left = {};
        this.sparks = {};
        this.right = {};
        this.slider = {};

        this.left.columns = ['position', 'item'];
        this.right.columns = ['score', 'opponent', 'points.change', 'equal', 'points', 'pointsLabel'];
        this.right.drilldownColumns = ['score', 'opponent', 'wins', 'draws', 'losses', 'labeledPoints'];

        [this.left.table, this.left.rows, this.left.cells] = this.makeTable(data, [...classes, 'left'], this.left.columns);
        [this.sparks.table, this.sparks.rows, this.sparks.cells] = this.makeSparks(data);
        [this.right.table, this.right.rows, this.right.cells] = this.makeTable(data, [...classes, 'right'], this.right.columns);

        this.scale = d3.scaleLinear()
            .domain([1, this.data.meta.lastRound])
            .range([0, this.sparks.rows.node().offsetWidth])
            .clamp(true);

        this.moveRightTable(this.currentRound);

        this.slider.top = this.makeSlider('top');
        this.slider.bottom = this.makeSlider('bottom');

        return ['table', 'rows', 'cells'].map(el => {
            const nodes = ['left', 'sparks', 'right'].map(part => this[part][el].nodes());
            return d3.selectAll(d3.merge(nodes));
        });
    }

    to (roundIndex) {
        if (roundIndex < 1 || roundIndex > this.data.meta.lastRound) {
            return Promise.reject(`Sorry we can't go to round #${roundIndex}`);
        }

        if (roundIndex === this.currentRound) {
            return Promise.resolve();
        }

        if (this.drilldown.item) {
            this.endDrillDown();
        }

        const change = roundIndex - this.currentRound;
        this.dispatch.call('roundChange', this, this.data.results[roundIndex].meta);

        ['left', 'right'].forEach(side => {
            this[side].rows
                .data(this.data.results[roundIndex].results, k => k.item);

            this[side].cells = this[side].cells
                .data(result => this[side].columns.map(column => new Cell(column, result, this.params)));
        });

        this.right.cells.filter('.change')
            .attr('class', cell => cell.classes.join(' '))
            .style('color', cell => cell.color)
            .text(cell => cell.text);

        const duration = this.durations.scale(Math.abs(change));
        this.moveRightTable(roundIndex, duration);
        this.moveSlider(roundIndex, duration);
        return this.move(roundIndex, 0, duration)
            .then(() => {
                const merged = d3.merge([this.left.cells.nodes(), this.right.cells.filter(':not(.change)').nodes()]);
                d3.selectAll(merged)
                    .attr('class', cell => cell.classes.join(' '))
                    .style('color', cell => cell.color)
                    .text(cell => cell.text);
            });
    }

    moveSlider (roundIndex, duration = 0) {
        const left =`${this.scale(roundIndex)}px`;
        [this.slider.top, this.slider.bottom].map(slider => {
            slider
                .transition()
                .duration(duration)
                .style('left', left)
                .text(this.data.results[roundIndex].meta.name);
        });
    }

    moveRightTable (roundIndex, duration = 0) {
        this.right.table
            .transition()
            .duration(duration)
            .style('left', `${this.scale(roundIndex)}px`);
    }

    first () {
        return this.to(1);
    }

    preview (roundIndex) {
        if (roundIndex < 1 || roundIndex > this.data.meta.lastRound) {
            return Promise.reject(`Sorry we can't preview round #${roundIndex}`);
        }

        const previousPreviewedRound = this.previewedRound;

        if (previousPreviewedRound === roundIndex) {
            return Promise.resolve();
        }

        this.dispatch.call('roundPreview', this, this.data.results[roundIndex].meta);
        this.moveSlider(roundIndex);

        ['left', 'right'].forEach(side => {
            this[side].rows
                .data(this.data.results[roundIndex].results, k => k.item);

            const columns = !this.drilldown.item
                ? this[side].columns
                : side === 'right' ? this.right.drilldownColumns : this.left.columns;

            this[side].cells = this[side].cells
                .data(result => columns.map(column => new Cell(column, result, this.params)))
                .attr('class', cell => cell.classes.join(' '))
                .style('color', cell => cell.color)
                .text(cell => cell.text);
        });

        return Promise.resolve();
    }

    drillDown (item) {
        this.dispatch.call('drillDown', this, item);

        if (!this.drilldown.controls) {
            this.drilldown.controls = this.controls.append('div')
                .attr('class', 'drilldown-control')
                .on('click', this.endDrillDown)
                .text(this.params.allLabel);
        }

        this.right.cells
            .data(result => this.right.drilldownColumns.map(column => new Cell(column, result, this.params)))
            .attr('class', cell => cell.classes.join(' '))
            .style('color', cell => cell.color)
            .text(cell => cell.text);

        this.right.rows.classed('muted', row => row.item !== item);

        this.sparks.cells
            .classed('muted', cell => !cell.result.match || (cell.result.item !== item && cell.result.match.opponent !== item));

        this.sparks.cells.filter('.spark-score')
            .classed('muted', cell => !cell.result.match || cell.result.item === item || cell.result.match.opponent !== item);

        return Promise.resolve();
    }

    endDrillDown () {
        this.drilldown.controls.remove();
        this.drilldown.controls = null;

        this.sparks.cells.classed('muted', false);

        this.sparks.cells.filter('.spark-score')
            .classed('muted', true);

        this.right.cells
            .data(result => this.right.columns.map(column => new Cell(column, result, this.params)))
            .attr('class', cell => cell.classes.join(' '))
            .style('color', cell => cell.color)
            .text(cell => cell.text);

        this.right.rows.classed('muted', false);

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
        this.classes = ['label'];
        return this;
    }

    pointsLabel (result, params) {
        this.text = result.position.strict === 1 ? params.pointsLabel : '';
        this.classes = ['label'];
        return this;
    }

    wins (result, params) {
        this.text = `${result.wins.total} w.`;
        this.classes = ['change'];
        this.color = params.colors.win;
        return this;
    }

    draws (result, params) {
        this.text = `${result.draws.total} d.`;
        this.classes = ['calculation'];
        this.color = params.colors.draw;
        return this;
    }

    losses (result, params) {
        this.text = `${result.losses.total} l.`;
        this.classes = ['calculation'];
        this.color = params.colors.loss;
        return this;
    }

    labeledPoints (result, params) {
        this.text = `${result.points.total} points`;
        this.classes = ['calculation'];
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
