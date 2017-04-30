import * as Controls from '../controls';
import toCamelCase from '../../helpers/general/to-camel-case';


const dispatchers = ['roundChange', 'play', 'pause', 'roundPreview', 'endPreview'];
const durations = {
    highlight: 500,
    highlightToMove: 200,
    move: 750,
    moveToFade: 0,
    fade: 250,
    freeze: 500,
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
        this.durations.total = Object.keys(durations).reduce((total, key) =>
            total + this.durations[key],0);

        this.currentRound = this.params.startFromRound ? this.params.startFromRound : this.data.meta.lastRound;
        this.previewedRound = null;

        this.dispatch = d3.dispatch(...dispatchers);

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
        const params = {
            play: [controlsSelector, roundMeta, this.play, this.pause],
            previous: [controlsSelector, roundMeta, this.previous],
            next: [controlsSelector, roundMeta, this.next],
            slider: [controlsSelector, this.data.meta.lastRound, roundsTotalNumber, roundMeta, this.preview, this.endPreview]
        };
        controls.forEach(control => this.controls[control] = new Controls[control](...params[control]));

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
            .classed('hidden', !isVisible);

        const thead = table.append('thead');
        const tbody = table.append('tbody');

        const header = thead.append('tr')
            .selectAll('th')
            .data(this.params.columns)
            .enter().append('th')
            .text(column => column);

        const rows = tbody.selectAll('tr')
            .data(this.data.results[roundNumber].results, k => k.item)
            .enter().append('tr');

        const cells = rows.selectAll('td')
            .data(result => [
                Object.assign({}, result, { text: result.position.strict}),
                Object.assign({}, result, { text: result.item}),
                Object.assign({}, result, { text: result.points.total})
            ])
            .enter().append('td')
            .text(cell => cell.text);

        return [table, rows, cells];
    }

    getItemsYs (rows) {
        return new Map(rows.nodes().map(n => [n.__data__.item, n.getBoundingClientRect().top]));
    }

    to (roundIndex) {
        this.dispatch.call('roundChange', this, this.data.results[roundIndex].meta);

        const [table, rows, cells] = this.renderTable(roundIndex, false);
        const currentYs = this.getItemsYs(this.rows);
        const nextYs = this.getItemsYs(rows);

        const outcomes = new Map(this.data.results[roundIndex].results.map(result => [result.item, result.outcome]));

        let transitionsFinished = 0;


        return new Promise((resolve, reject) => {
            this.cells
                .transition()
                .duration(this.durations.highlight)
                .style("background-color", d => this.params.colors[outcomes.get(d.item)] || 'transparent')
                .transition()
                .delay(this.durations.highlightToMove)
                .duration(this.durations.move)
                .style('transform', (d, i) => `translateY(${nextYs.get(d.item) - currentYs.get(d.item)}px)`)
                .transition()
                .delay(this.durations.moveToFade)
                .duration(this.durations.fade)
                .style("background-color", 'transparent')
                .each(() => ++transitionsFinished)
                .on('end', () => {
                    if (!--transitionsFinished) {
                        this.table.remove();
                        this.table = table.classed('hidden', false);
                        this.rows = rows;
                        this.cells = cells;
                        this.currentRound = roundIndex;
                        resolve();
                    }
                })
        });
    }

    preview (roundIndex) {
        this.dispatch.call('roundPreview', this, this.data.results[roundIndex].meta);

        this.rows = this.rows
            .data(this.data.results[roundIndex].results, k => k.item);

        this.cells = this.rows.selectAll('td')
            .data(result => [
                Object.assign({}, result, { text: result.position.strict}),
                Object.assign({}, result, { text: result.item}),
                    Object.assign({}, result, { text: result.points.total})
            ])
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
                    .then(playFunction);
            }
        };

        if (this.currentRound === this.data.meta.lastRound) {
            Promise.resolve(this.first())
                .then(playFunction)
        } else {
            Promise.resolve(this.next())
                .then(playFunction)
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
