export default class {
    constructor (selector, roundMeta, previous) {
        this.button = selector.append('div')
            .attr('class', 'previous')
            .classed('disabled', roundMeta.index === 0)
            .on('click', previous);
    }

    update (roundMeta) {
        this.button.classed('disabled', roundMeta.index === 0);
    }
};
