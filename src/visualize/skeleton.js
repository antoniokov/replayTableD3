import * as Controls from './controls';
import adjustDurations from './helpers/adjust-durations';
import getRowsYs from './helpers/get-rows-ys';
import toCamelCase from '../helpers/general/to-camel-case';


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

        this.currentRound = params.startFromRound === null ? this.data.meta.lastRound : params.startFromRound;
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
                        const classes = this.table.attr('class');
                        this.table.remove();
                        this.table = table.attr('class', classes);
                        this.rows = rows;
                        this.cells = cells;
                        resolve();
                    }
                });
        });
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
};
