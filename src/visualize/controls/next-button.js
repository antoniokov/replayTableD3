export default class {
    constructor (selector, roundMeta, next) {
        this.button = selector.append('div')
            .attr('class', 'next')
            .classed('disabled', roundMeta.isLast)
            .on('click', next);
    }

    update (roundMeta) {
        this.button.classed('disabled', roundMeta.isLast);
    }
};
