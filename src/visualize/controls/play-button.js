export default class {
    constructor (selector, animationTime, checkLastRound, goToNextRound) {
        this.animationTime = animationTime;
        this.checkLastRound = checkLastRound;
        this.goToNextRound = goToNextRound;

        this.isPlaying = false;
        this.timer = null;

        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        this.setClass = this.setClass.bind(this);

        this.button = selector.append('div')
            .on('click', () => {
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
            });

        this.setClass();
    }

    play () {
        this.isPlaying = true;
        this.setClass();
        this.goToNextRound();

        this.timer = setInterval(() => {
            if (this.checkLastRound()) {
                this.pause();
            } else {
                this.goToNextRound();
            }
        }, this.animationTime);

    }

    pause () {
        clearInterval(this.timer);
        this.isPlaying = false;
        this.setClass();
    }

    setClass () {
        const className = this.isPlaying
            ? 'pause'
            : this.checkLastRound() ? 'replay' : 'play';

        this.button
            .classed('play', className === 'play')
            .classed('pause', className === 'pause')
            .classed('replay', className === 'replay');
    }
};
