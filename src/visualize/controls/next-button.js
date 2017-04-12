export default class {
    constructor (selector, checkLastRound, next) {
        this.checkLastRound = checkLastRound;

        this.button = selector.append('div')
            .attr('class', 'next')
            .classed('disabled', checkLastRound())
            .on('click', next);
    }

    update () {
        this.button.classed('disabled', this.checkLastRound());
    }
};
