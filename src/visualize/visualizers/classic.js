import * as Controls from '../controls';
import getRowsYs from '../helpers/get-rows-ys';
import makeCell from '../helpers/make-cell';
import fromCamelCase from '../../helpers/general/from-camel-case';
import toCamelCase from '../../helpers/general/to-camel-case';


const dispatchers = ['roundChange', 'play', 'pause', 'roundPreview', 'endPreview', 'drillDown', 'endDrillDown'];
const durations = {
    move: 750,
    freeze: 750,
    outcomes: 200
};


export default class {
    constructor (data, params) {
        this.data = data;
        this.params = params;

        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        this.previous = this.previous.bind(this);
        this.next = this.next.bind(this);
        this.preview = this.preview.bind(this);
        this.endPreview = this.endPreview.bind(this);

        this.durations = Object.keys(durations).reduce((obj, key) =>
            Object.assign(obj, { [key]: durations[key]/params.speed }), {});

        this.currentRound = this.params.startFromRound ? this.params.startFromRound : this.data.meta.lastRound;
        this.previewedRound = null;

        this.dispatch = d3.dispatch(...dispatchers);

        this.dispatch.on('roundChange', roundMeta => this.currentRound = roundMeta.index);

        this.dispatch.on('play', () => this.isPlaying = true);
        this.dispatch.on('pause', () => this.isPlaying = false);

        this.dispatch.on('roundPreview', roundMeta => this.previewedRound = roundMeta.index);
        this.dispatch.on('endPreview', roundMeta => this.previewedRound = null);

        this.selector = params.id ? `#${params.id}` : '.replayTable';
        this.controlsContainer = d3.select(this.selector)
            .append('div')
            .attr('class', 'controls-container');
        this.tableContainer = d3.select(this.selector)
            .append('div')
            .attr('class', 'table-container');

        this.renderControls(this.params.controls);
        [this.table, this.rows, this.cells] = this.renderTable(this.currentRound);
    }

    renderControls(controls) {
        this.controls = this.controlsContainer.append('div')
            .attr('class', 'controls');

        const roundMeta = this.data.results[this.currentRound].meta;
        const roundsTotalNumber = this.params.roundsTotalNumber || this.data.meta.lastRound;

        const controlsObject = {};
        const args = {
            play: [this.controls, roundMeta, this.play, this.pause],
            previous: [this.controls, roundMeta, this.previous],
            next: [this.controls, roundMeta, this.next],
            slider: [this.controls, this.data.meta.lastRound, roundsTotalNumber, roundMeta, this.preview, this.endPreview]
        };
        controls.forEach(control => controlsObject[control] = new Controls[control](...args[control]));

        Object.keys(controlsObject).forEach(ctrl => {
            const control = controlsObject[ctrl];
            dispatchers.forEach(dispatcher => {
                const method = toCamelCase(`on-${dispatcher}`);
                if (control[method]) {
                    this.dispatch.on(`${dispatcher}.${ctrl}`, control[method].bind(control));
                }
            });
        });

        return this.controls;
    }

    renderHeader (table, columns, labels) {
        const thead = table.append('thead');

        const sampleResult = this.data.results[1].results[0];
        return thead.append('tr')
            .selectAll('th')
            .data(columns)
            .enter().append('th')
            .text((column, i) => {
                if (labels[i]) {
                    return labels[i];
                } else if (['outcome', 'round'].includes(column) || makeCell(column, sampleResult, this.params).classes.includes('change')) {
                    return '';
                } else {
                    return fromCamelCase(column);
                }
            });
    }

    renderTable (roundNumber, isVisible = true) {
        const table = this.tableContainer
            .append('table')
            .attr('class', () => isVisible ? 'main' : 'hidden');

        const header = this.renderHeader(table, this.params.columns, this.params.labels);

        const tbody = table.append('tbody');
        const rows = tbody.selectAll('tr')
            .data(this.data.results[roundNumber].results, k => k.item)
            .enter().append('tr');

        const cells = rows.selectAll('td')
            .data(result => this.params.columns.map(column => makeCell(column, result, this.params)))
            .enter().append('td')
            .attr('class', cell => cell.classes.join(' '))
            .style('background-color', cell => cell.backgroundColor || 'transparent')
            .text(cell => cell.text)
            .on('click', cell => cell.column === 'item' ? this.drillDownToItem(cell.result.item) : null);

        return [table, rows, cells];
    }

    move (roundIndex, delay, duration) {
        return new Promise((resolve, reject) => {
            let transitionsFinished = 0;
            const [table, rows, cells] = this.renderTable(roundIndex, false);
            const currentYs = getRowsYs(this.rows);
            const nextYs = getRowsYs(rows);

            this.cells
                .transition()
                .delay(delay)
                .duration(duration)
                .style('transform', (cell, i) => `translateY(${nextYs.get(cell.result.item) - currentYs.get(cell.result.item)}px)`)
                .each(() => ++transitionsFinished)
                .on('end', () => {
                    if (!--transitionsFinished) {
                        this.table.remove();
                        this.table = table.attr('class', 'main');
                        this.rows = rows;
                        this.cells = cells;
                        resolve();
                    }
                });
        });
    }

    to (roundIndex) {
        if (roundIndex < 0 || roundIndex > this.data.meta.lastRound) {
            return Promise.reject(`Sorry we can't go to round #${roundIndex}`);
        }

        this.dispatch.call('roundChange', this, this.data.results[roundIndex].meta);

        const newResults = new Map(this.data.results[roundIndex].results.map(result => [result.item, result]));

        const animateOutcomes = this.params.columns.includes('outcome');
        if (animateOutcomes) {
            this.table.selectAll('td.outcome')
                .transition()
                .duration(this.durations.outcomes)
                .style("background-color", cell => this.params.colors[newResults.get(cell.result.item).outcome] || 'transparent');
        }

        this.table.selectAll('td.change')
            .text(cell => makeCell(cell.column, newResults.get(cell.result.item), this.params).text);

        return this.move(roundIndex, animateOutcomes ? this.durations.outcomes : 0, this.durations.move);
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
    }

    endPreview (move = false) {
        if (this.previewedRound === null || this.previewedRound === this.currentRound) {
            this.dispatch.call('endPreview', this, this.data.results[this.currentRound].meta);
            return;
        }

        if (!move) {
            this.preview(this.currentRound);
        } else {
            this.to(this.previewedRound);
        }

        this.dispatch.call('endPreview', this, this.data.results[this.currentRound].meta);
    }

    first () {
        return this.to(0);
    }

    last () {
        return this.to(this.data.meta.lastRound);
    }

    previous () {
        if (this.currentRound > 0) {
            return this.to(this.currentRound - 1);
        }
    }

    next () {
        if (this.currentRound < this.data.meta.lastRound) {
            return this.to(this.currentRound + 1);
        }
    }

    play (stopAt = this.data.meta.lastRound) {
        this.dispatch.call('play');

        const playFunction = () => {
            if (this.currentRound === stopAt || !this.isPlaying) {
                this.pause();
            } else {
                Promise.resolve(this.next())
                    .then(() => setTimeout(playFunction, this.durations.freeze));
            }
        };

        if (this.currentRound === this.data.meta.lastRound) {
            Promise.resolve(this.first())
                .then(() => setTimeout(playFunction, this.durations.freeze))
        } else {
            Promise.resolve(this.next())
                .then(() => setTimeout(playFunction, this.durations.freeze))
        }
    }

    pause () {
        this.dispatch.call('pause');
    }

    drillDownToItem (item) {
        this.dispatch.call('drillDown', this, item);

        const itemResults = this.data.results.slice(1).map(round => ({
            meta: round.meta,
            result: round.results.filter(result => result.item === item)[0]
        }));

        this.controls.classed('hidden', true);
        this.drillDownControls = this.controlsContainer.append('div')
            .attr('class', 'drilldown-contorls');

        this.drillDownControls.append('div')
            .attr('class', 'drilldown drilldown-back')
            .text('<-')
            .on('click', this.endDrillDown.bind(this));
        this.drillDownControls.append('div')
            .attr('class', 'drilldown drilldown-item')
            .text(item);

        this.table.attr('class', 'hidden');
        this.drillDownTable = this.tableContainer.append('table')
            .attr('class', 'drilldown');

        const columns = ['round'];
        const labels = [''];
        this.params.columns.forEach((column, i) => {
            if (column !== 'item') {
                columns.push(column);
                labels.push(this.params.labels[i] || '');
            }
        });
        const header = this.renderHeader(this.drillDownTable, columns, labels);

        const tbody = this.drillDownTable.append('tbody');
        this.drillDownRows = tbody.selectAll('tr')
            .data(itemResults, k => k.meta.index)
            .enter().append('tr');

        this.drillDownCells = this.drillDownRows.selectAll('td')
            .data(round => columns.map(column => makeCell(column, Object.assign({ roundMeta: round.meta }, round.result), this.params)))
            .enter().append('td')
            .attr('class', cell => cell.classes.join(' '))
            .style('background-color', cell => cell.backgroundColor || 'transparent')
            .text(cell => cell.text)
            .on('click', cell => cell.column === 'round' ? this.endDrillDown(cell.result.roundMeta.index) : null);
    }

    endDrillDown (roundIndex = null) {
        this.dispatch.call('endDrillDown', this, roundIndex);

        this.drillDownControls.remove();
        this.controls.classed('hidden', false);

        this.drillDownTable.remove();
        this.table.attr('class', 'main');

        if (roundIndex !== null) {
            this.to(roundIndex);
        }
    }
};
