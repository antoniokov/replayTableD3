import PlayButton from '../controls/play-button';


const rowHeight = 23;

const animationDuration = {
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

        this.animationDuration = Object.keys(animationDuration).reduce((obj, key) =>
            Object.assign(obj, { [key]: animationDuration[key]/params.speed }), {});
        this.animationDuration.total = Object.keys(animationDuration).reduce((total, key) =>
            total + this.animationDuration[key],0);

        this.currentRound = this.params.startFromRound === 'last' ? this.data.meta.lastRound : this.params.startFromRound;

        const selector = params.id ? `#${params.id}` : '.replayTable';
        this.renderControls(selector);
        this.renderTable(selector);
    }

    renderControls(selector) {
        const controls = d3.select(selector).append('div')
            .attr('class', 'controls');

        const checkLastRound = () => this.currentRound ===  this.data.meta.lastRound;
        const goToNextRound = () => checkLastRound() ? this.goToRound(0) : this.goToRound(this.currentRound + 1);
        const playButton = new PlayButton(controls, this.animationDuration.total, checkLastRound, goToNextRound);
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

    goToRound (roundNumber) {
        const rows = this.tbody.selectAll('tr')
            .data(this.data.results[roundNumber].results, k => k.item);

        rows.transition().duration(this.animationDuration.highlight)
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
            .delay(this.animationDuration.highlight + this.animationDuration.highlightToMove)
            .duration(this.animationDuration.move)
            .style('top', (d,i) => this.top + rowHeight + ((i*rowHeight)) + "px");

        rows.transition()
            .delay(this.animationDuration.highlight + this.animationDuration.highlightToMove + this.animationDuration.move)
            .duration(this.animationDuration.fade)
            .style("background-color", 'transparent');

        const cells = rows.selectAll('td')
            .data(result => [result.position.strict, result.item, result.total.total])
            .transition()
            .delay(this.animationDuration.highlight + this.animationDuration.highlightToMove + this.animationDuration.move)
            .duration(this.animationDuration.fade)
            .text(cell => cell);

        this.currentRound = roundNumber;
    }

    drillDownToItem (item) {
        const itemResults = this.data.results.map(round => ({
            meta: round.meta,
            results: round.results.filter(result => result.item === item)[0]
        }));
        console.log(itemResults);
    }
};
