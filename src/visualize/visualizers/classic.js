import * as Controls from '../controls';
import adjustDurations from '../helpers/adjust-durations';
import getRowsYs from '../helpers/get-rows-ys';
import makeCell from '../helpers/make-cell';
import fromCamelCase from '../../helpers/general/from-camel-case';
import toCamelCase from '../../helpers/general/to-camel-case';


const dispatchers = ['roundChange', 'play', 'pause', 'roundPreview', 'endPreview', 'drillDown', 'endDrillDown'];


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
        this.drillDown = this.drillDown.bind(this);
        this.endDrillDown = this.endDrillDown.bind(this);

        this.durations = adjustDurations(params.durations, params.speed);

        this.currentRound = params.startFromRound || this.data.meta.lastRound;
        this.previewedRound = null;
        this.drilldown = {};

        this.dispatch = d3.dispatch(...dispatchers);
        this.dispatch.on('roundChange', roundMeta => this.currentRound = roundMeta.index);
        this.dispatch.on('play', () => this.isPlaying = true);
        this.dispatch.on('pause', () => this.isPlaying = false);
        this.dispatch.on('roundPreview', roundMeta => this.previewedRound = roundMeta.index);
        this.dispatch.on('endPreview', roundMeta => this.previewedRound = null);
        this.dispatch.on('drillDown', item => this.drilldown.item = item);
        this.dispatch.on('endDrillDown', item => this.drilldown = {});

        this.selector = params.id ? `#${params.id}` : '.replayTable';

        this.controlsContainer = d3.select(this.selector)
            .append('div')
            .attr('class', 'controls-container');
        this.controls = this.renderControls(this.controlsContainer, this.params.controls);

        this.tableContainer = d3.select(this.selector)
            .append('div')
            .attr('class', 'table-container');
        [this.table, this.rows, this.cells] = this.renderTable(this.data.results[this.currentRound].results);
    }

    renderControls(container, list) {
        const controls = container.append('div')
            .attr('class', 'controls');

        const roundMeta = this.data.results[this.currentRound].meta;
        const roundsTotalNumber = this.params.roundsTotalNumber || this.data.meta.lastRound;

        const controlsObject = {};
        const args = {
            play: [controls, roundMeta, this.play, this.pause],
            previous: [controls, roundMeta, this.previous],
            next: [controls, roundMeta, this.next],
            slider: [controls, this.data.meta.lastRound, roundsTotalNumber, roundMeta, this.preview, this.endPreview]
        };
        list.forEach(control => controlsObject[control] = new Controls[control](...args[control]));

        Object.keys(controlsObject).forEach(ctrl => {
            const control = controlsObject[ctrl];
            dispatchers.forEach(dispatcher => {
                const method = toCamelCase(`on-${dispatcher}`);
                if (control[method]) {
                    this.dispatch.on(`${dispatcher}.${ctrl}`, control[method].bind(control));
                }
            });
        });

        return controls;
    }

    renderTable (data, className = 'main', columns = this.params.columns, labels = this.params.labels) {
        const table = this.tableContainer
            .append('table')
            .attr('class', className);

        const thead = table.append('thead');
        thead.append('tr')
            .selectAll('th')
            .data(columns)
            .enter().append('th')
            .text((column, i) => {
                if (labels[i]) {
                    return labels[i];
                } else if (['outcome', 'match', 'round'].includes(column) || column.includes('.change')) {
                    return '';
                } else {
                    return fromCamelCase(column);
                }
            });

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

    move (roundIndex, delay, duration) {
        const [table, rows, cells] = this.renderTable(this.data.results[roundIndex].results, 'hidden');
        const currentYs = getRowsYs(this.rows);
        const nextYs = getRowsYs(rows);

        return new Promise((resolve, reject) => {
            let transitionsFinished = 0;
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

        const nextRoundResults = new Map(this.data.results[roundIndex].results.map(result => [result.item, result]));

        const animateOutcomes = this.params.columns.includes('outcome');
        if (animateOutcomes) {
            this.table.selectAll('td.outcome')
                .transition()
                .duration(this.durations.outcomes)
                .style("background-color", cell => this.params.colors[nextRoundResults.get(cell.result.item).outcome] || 'transparent');
        }

        this.table.selectAll('td.change')
            .text(cell => makeCell(cell.column, nextRoundResults.get(cell.result.item), this.params).text);

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
            if (column !== 'item') {
                columns.push(column);
                labels.push(this.params.labels[i] || '');
            }
        });

        const itemData = this.data.results.slice(1).map(round => {
            const result = round.results.filter(result => result.item === item)[0];
            return Object.assign({}, result, { roundMeta: round.meta });
        });

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
