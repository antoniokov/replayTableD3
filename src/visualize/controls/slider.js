export default class {
    constructor (selector, roundsAvailable, roundsTotal, roundMeta, preview, endPreview, to) {
        this.container = selector.append('div')
            .attr('class', 'slider');

        this.roundToPercent = d3.scaleLinear()
            .domain([0, roundsTotal])
            .range([0, 100]);

        const rectangle = this.container.node().getBoundingClientRect();
        this.scale =  d3.scaleLinear()
            .domain([0, roundsTotal])
            .range([0, rectangle.right - rectangle.left])
            .clamp(true);

        this.available = this.container.append('span')
            .attr('class', 'slider-available')
            .style('width', `${this.roundToPercent(roundsAvailable)}%`);

        const progress = `${this.roundToPercent(roundMeta.index)}%`;

        this.toggle = this.container.append('span')
            .attr('class', 'slider-toggle')
            .style('left', progress)
            .text(roundMeta.name)
            .call(d3.drag()
                .on("drag", () => {
                    const round = Math.round(this.scale.invert(d3.event.x));
                    preview(round);
                })
                .on("end", () => {
                    const round = Math.round(this.scale.invert(d3.event.x));
                    endPreview(true);
                }));

        this.progress = this.container.append('span')
            .attr('class', 'slider-progress')
            .style('width', progress);

        this.onRoundPreview = this.onRoundPreview.bind(this);
        this.onRoundChange = this.onRoundChange.bind(this);
    }

    onRoundPreview (roundMeta) {
        const progress = `${this.roundToPercent(roundMeta.index)}%`;

        this.toggle
            .style('left', progress)
            .text(roundMeta.name);

        this.progress
            .style('width', progress);
    }

    onRoundChange (roundMeta) {
        const progress = `${this.roundToPercent(roundMeta.index)}%`;

        this.toggle
            .transition()
            .duration(500)
            .styleTween('left', () => d3.interpolateString(this.toggle.node().style.left, progress))
            .on('end', () => this.toggle.text(roundMeta.name));

        this.progress
            .transition()
            .duration(500)
            .styleTween('width', () => d3.interpolateString(this.progress.node().style.width, progress));
    }
};
