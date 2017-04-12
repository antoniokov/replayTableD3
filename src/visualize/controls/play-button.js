export default class {
    constructor (selector, animationTime, checkLastRound, first, next) {
        this.animationTime = animationTime;
        this.checkLastRound = checkLastRound;
        this.first = first;
        this.next = next;

        this.isPlaying = false;
        this.timer = null;

        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        this.update = this.update.bind(this);

        this.button = selector.append('div')
            .on('click', () => {
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
            });

        this.update();
    }

    play () {
        this.isPlaying = true;
        this.update();

        if (this.checkLastRound()) {
            this.first();
        } else {
            this.next();
        }

        this.timer = setInterval(() => {
            if (this.checkLastRound()) {
                this.pause();
            } else {
                this.next();
            }
        }, this.animationTime);

    }

    pause () {
        clearInterval(this.timer);
        this.isPlaying = false;
        this.update();
    }

    update () {
        const className = this.isPlaying
            ? 'pause'
            : this.checkLastRound() ? 'replay' : 'play';

        this.button
            .classed('play', className === 'play')
            .classed('pause', className === 'pause')
            .classed('replay', className === 'replay');
    }
};
