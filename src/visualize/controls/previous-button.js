export default class {
    constructor (selector, checkFirstRound, previous) {
        this.checkFirstRound = checkFirstRound;

        this.button = selector.append('div')
            .attr('class', 'previous')
            .classed('disabled', checkFirstRound())
            .on('click', previous);
    }

    update () {
        this.button.classed('disabled', this.checkFirstRound());
    }
};
