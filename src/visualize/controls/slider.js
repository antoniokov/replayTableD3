export default class {
    constructor (selector, roundsAvailable, roundsTotal, roundMeta, preview, endPreview, to) {
        this.container = selector.append('div')
            .attr('class', 'slider');

        this.available = this.container.append('span')
            .attr('class', 'slider-available')
            .style('width', `${100*roundsAvailable/roundsTotal}%`);

        const progress = `${100*roundMeta.index/roundsTotal}%`;

        this.toggle = this.container.append('span')
            .attr('class', 'slider-toggle')
            .style('left', progress)
            .text(roundMeta.name)
            .on('drag', () => console.log(this));

        this.progress = this.container.append('span')
            .attr('class', 'slider-progress')
            .style('width', progress);

        this.roundsAvailable = roundsAvailable;
        this.roundsTotal = roundsTotal;

        this.onRoundChange = this.onRoundChange.bind(this);
    }

    onRoundChange (roundMeta) {
        const progress = `${100*roundMeta.index/this.roundsTotal}%`;

        this.toggle
            .transition()
            .duration(500)
            .styleTween('left', () => d3.interpolateString(this.toggle.node().style.left, progress))
            .text(roundMeta.name);

        this.progress
            .transition()
            .duration(500)
            .styleTween('width', () => d3.interpolateString(this.progress.node().style.width, progress));
    }
};
