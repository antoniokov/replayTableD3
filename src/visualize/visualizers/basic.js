import * as Controls from '../controls';
import getRowsYs from '../helpers/get-rows-ys';
import makeCell from '../helpers/make-cell';
import fromCamelCase from '../../helpers/general/from-camel-case';
import toCamelCase from '../../helpers/general/to-camel-case';


const dispatchers = ['roundChange', 'play', 'pause', 'roundPreview', 'endPreview'];
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
        this.renderControls(this.params.controls);
        [this.table, this.rows, this.cells] = this.renderTable(this.currentRound);
    }

    renderControls(controls) {
        const controlsSelector = d3.select(this.selector).append('div')
            .attr('class', 'controls');

        const roundMeta = this.data.results[this.currentRound].meta;
        const roundsTotalNumber = this.params.roundsTotalNumber || this.data.meta.lastRound;

        this.controls = {};
        const args = {
            play: [controlsSelector, roundMeta, this.play, this.pause],
            previous: [controlsSelector, roundMeta, this.previous],
            next: [controlsSelector, roundMeta, this.next],
            slider: [controlsSelector, this.data.meta.lastRound, roundsTotalNumber, roundMeta, this.preview, this.endPreview]
        };
        controls.forEach(control => this.controls[control] = new Controls[control](...args[control]));

        Object.keys(this.controls).forEach(ctrl => {
            const control = this.controls[ctrl];
            dispatchers.forEach(dispatcher => {
                const method = toCamelCase(`on-${dispatcher}`);
                if (control[method]) {
                    this.dispatch.on(`${dispatcher}.${ctrl}`, control[method].bind(control));
                }
            });
        });
    }

    renderTable (roundNumber, isVisible = true) {
        const table = d3.select(this.selector).append('table')
            .attr('class', () => isVisible ? 'main' : 'hidden');

        const thead = table.append('thead');
        const tbody = table.append('tbody');

        const header = thead.append('tr')
            .selectAll('th')
            .data(this.params.columns)
            .enter().append('th')
            .text((column, i) => {
                if (this.params.labels[i]) {
                    return this.params.labels[i];
                }

                if (column === 'outcome' || makeCell(column, {}, {}).classes.includes('change')) {
                    return '';
                }

                return fromCamelCase(column);
            });

        const rows = tbody.selectAll('tr')
            .data(this.data.results[roundNumber].results, k => k.item)
            .enter().append('tr');

        const cells = rows.selectAll('td')
            .data(result => this.params.columns.map(column => makeCell(column, result, this.params)))
            .enter().append('td')
            .attr('class', cell => cell.classes.join(' '))
            .style('background-color', cell => cell.backgroundColor || 'transparent')
            .text(cell => cell.text);

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
            d3.selectAll(`${this.selector} table.main td.outcome`)
                .transition()
                .duration(this.durations.outcomes)
                .style("background-color", cell => this.params.colors[newResults.get(cell.result.item).outcome] || 'transparent');
        }

        d3.selectAll(`${this.selector} table.main td.change`)
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
        const itemResults = this.data.results.map(round => ({
            meta: round.meta,
            results: round.results.filter(result => result.item === item)[0]
        }));
        console.log(itemResults);
    }
};
