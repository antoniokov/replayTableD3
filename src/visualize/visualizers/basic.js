import * as controls from '../controls';
import toCamelCase from '../../helpers/general/to-camel-case';


const columns = ['position', 'item', 'total'];
const rowHeight = 22;
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

        this.durations = Object.keys(durations).reduce((obj, key) =>
            Object.assign(obj, { [key]: durations[key]/params.speed }), {});
        this.durations.total = Object.keys(durations).reduce((total, key) =>
            total + this.durations[key],0);

        this.currentRound = this.params.startFromRound ? this.params.startFromRound : this.data.meta.lastRound;

        this.dispatch = d3.dispatch(...dispatchers);
        this.dispatch.on('play', () => this.isPlaying = true);
        this.dispatch.on('pause', () => this.isPlaying = false);

        this.selector = params.id ? `#${params.id}` : '.replayTable';
        this.renderControls();
        [this.table, this.rows, this.cells] = this.renderTable(this.currentRound);
    }

    renderControls() {
        const controlsSelector = d3.select(this.selector).append('div')
            .attr('class', 'controls');

        const roundMeta = this.data.results[this.currentRound].meta;
        const roundsTotalNumber = this.params.roundsTotalNumber || this.data.meta.lastRound;

        this.controls = {
            play: new controls.Play(controlsSelector, roundMeta, this.play.bind(this), this.pause.bind(this)),
            previous: new controls.Previous(controlsSelector, roundMeta, this.previous.bind(this)),
            next: new controls.Next(controlsSelector, roundMeta, this.next.bind(this)),
            slider: new controls.Slider(controlsSelector, this.data.meta.lastRound, roundsTotalNumber, roundMeta,
                this.preview.bind(this), this.endPreview.bind(this), this.to.bind(this))
        };

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
            .data(columns)
            .enter().append('th')
            .text(column => column);

        const rows = tbody.selectAll('tr')
            .data(this.data.results[roundNumber].results, k => k.item)
            .enter().append('tr');

        const cells = rows.selectAll('td')
            .data(result => [
                Object.assign({}, result, { text: result.position.strict}),
                Object.assign({}, result, { text: result.item}),
                Object.assign({}, result, { text: result.total.total})
            ])
            .enter().append('td')
            .text(cell => cell.text);

        return [table, rows, cells];
    }

    getItemsYs (rows) {
        return new Map(rows.nodes().map(n => [n.__data__.item, n.getBoundingClientRect().top]));
    }

    to (roundIndex, callback) {
        this.dispatch.call('roundChange', this, this.data.results[roundIndex].meta);

        const [table, rows, cells] = this.renderTable(roundIndex, false);
        const currentYs = this.getItemsYs(this.rows);
        const nextYs = this.getItemsYs(rows);

        const outcomes = new Map(this.data.results[roundIndex].results.map(result => [result.item, result.outcome]));

        let transitionsFinished = 0;

        this.cells
            .transition()
            .duration(this.durations.highlight)
            .style("background-color", d => this.params.colors[outcomes.get(d.item)] || 'transparent')
            .transition()
            .delay(this.durations.highlightToMove)
            .duration(this.durations.move)
            .style('transform', (d,i) => `translateY(${nextYs.get(d.item) - currentYs.get(d.item)}px)`)
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
                    if (callback) {
                        callback();
                    }
                }
            });
    }

    preview (roundIndex) {
        if (roundIndex !== this.currentRound) {
            this.dispatch.call('roundPreview', this, this.data.results[roundIndex].meta);
        }

        this.rows = this.rows
            .data(this.data.results[roundIndex].results, k => k.item);

        this.cells = this.rows.selectAll('td')
            .data(result => [result.position.strict, result.item, result.total.total])
            .transition()
            .duration(this.durations.fade)
            .text(cell => cell);
    }

    endPreview () {
        this.dispatch.call('endPreview', this, this.data.results[this.currentRound].meta);
        this.preview(this.currentRound);
    }

    first (callback) {
        this.to(0, callback);
    }

    last (callback) {
        this.to(this.data.meta.lastRound, callback);
    }

    previous (callback) {
        if (this.currentRound > 0) {
            this.to(this.currentRound - 1, callback);
        }
    }

    next (callback) {
        if (this.currentRound < this.data.meta.lastRound) {
            this.to(this.currentRound + 1, callback);
        }
    }

    play (stopAt = this.data.meta.lastRound) {
        this.dispatch.call('play');

        const playFunction = () => {
            if (this.currentRound === stopAt || !this.isPlaying) {
                this.pause();
            } else {
                this.next(playFunction);
            }
        };

        if (this.currentRound === this.data.meta.lastRound) {
            this.first(playFunction);
        } else {
            this.next(playFunction);
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
