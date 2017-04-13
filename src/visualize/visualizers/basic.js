import PlayButton from '../controls/play-button';
import PreviousButton from '../controls/previous-button';
import NextButton from '../controls/next-button';

import toCamelCase from '../../helpers/general/to-camel-case';


const rowHeight = 23;
const dispatchers = ['roundChange', 'play', 'pause'];

const durations = {
    highlight: 800,
    highlightToMove: 200,
    move: 1000,
    moveToFade: 0,
    fade: 700
};

export default class {
    constructor (data, params) {
        this.data = data;
        this.params = params;

        this.durations = Object.keys(durations).reduce((obj, key) =>
            Object.assign(obj, { [key]: durations[key]/params.speed }), {});
        this.durations.total = Object.keys(durations).reduce((total, key) =>
            total + this.durations[key],0);

        this.currentRound = this.params.startFromRound === 'last' ? this.data.meta.lastRound : this.params.startFromRound;

        this.dispatch = d3.dispatch(...dispatchers);

        const selector = params.id ? `#${params.id}` : '.replayTable';
        this.renderControls(selector);
        this.renderTable(selector);
    }

    renderControls(selector) {
        const controls = d3.select(selector).append('div')
            .attr('class', 'controls');

        const roundMeta = this.data.results[this.currentRound].meta;

        this.controls = {
            play: new PlayButton(controls, roundMeta, this.play.bind(this), this.pause.bind(this)),
            previous: new PreviousButton(controls, roundMeta, this.previous.bind(this)),
            next: new NextButton(controls, roundMeta, this.next.bind(this))
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

    renderTable (selector) {
        const columns = ['position', 'item', 'total'];

        const table = d3.select(selector).append('table');
        this.thead = table.append('thead');
        this.tbody = table.append('tbody');

        this.top = this.tbody.node().getBoundingClientRect().top;

        const header = this.thead.append('tr')
            .selectAll('th')
            .data(columns)
            .enter().append('th')
            .text(column => column);

        const rows = this.tbody.selectAll('tr')
            .data(this.data.results[this.currentRound].results, k => k.item)
            .enter().append('tr')
            .style('top', (d,i) => this.top + rowHeight + ((i*rowHeight)) + "px");

        const cells = rows.selectAll('td')
            .data(result => [result.position.strict, result.item, result.total.total])
            .enter().append('td')
            .text(cell => cell);
    }

    to (roundNumber) {
        this.dispatch.call('roundChange', this, this.data.results[roundNumber].meta);

        const rows = this.tbody.selectAll('tr')
            .data(this.data.results[roundNumber].results, k => k.item);

        rows.transition().duration(this.durations.highlight)
            .style("background-color", d => {
                switch(d.outcome) {
                    case 'win':
                        return '#EDFFDF';
                    case 'draw':
                        return '#F3F3F3';
                    case 'loss':
                        return '#FFECEC';
                    default:
                        return 'transparent';
                }
            });


        rows.transition()
            .delay(this.durations.highlight + this.durations.highlightToMove)
            .duration(this.durations.move)
            .style('top', (d,i) => this.top + rowHeight + ((i*rowHeight)) + "px");

        rows.transition()
            .delay(this.durations.highlight + this.durations.highlightToMove + this.durations.move)
            .duration(this.durations.fade)
            .style("background-color", 'transparent');

        const cells = rows.selectAll('td')
            .data(result => [result.position.strict, result.item, result.total.total])
            .transition()
            .delay(this.durations.highlight + this.durations.highlightToMove + this.durations.move)
            .duration(this.durations.fade)
            .text(cell => cell);

        this.currentRound = roundNumber;
    }

    first () {
        this.to(0);
    }

    last () {
        this.to(this.data.meta.lastRound);
    }

    previous () {
        if (this.currentRound > 0) {
            this.to(this.currentRound - 1);
        }
    }

    next () {
        if (this.currentRound < this.data.meta.lastRound) {
            this.to(this.currentRound + 1);
        }
    }

    play (stopAt = this.data.meta.lastRound) {
        this.dispatch.call('play');

        if (this.currentRound === this.data.meta.lastRound) {
            this.first();
        } else {
            this.next();
        }

        this.timer = setInterval(() => {
            if (this.currentRound === stopAt) {
                this.dispatch.call('pause');
            } else {
                this.next();
            }
        }, this.durations.total);

    }

    pause () {
        this.dispatch.call('pause');
        clearInterval(this.timer);
    }

    drillDownToItem (item) {
        const itemResults = this.data.results.map(round => ({
            meta: round.meta,
            results: round.results.filter(result => result.item === item)[0]
        }));
        console.log(itemResults);
    }
};
