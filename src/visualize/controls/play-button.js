export default class {
    constructor (selector, roundMeta, first, next, animationTime) {
        this.isLast = roundMeta.isLast;

        this.first = first;
        this.next = next;
        this.animationTime = animationTime;

        this.isPlaying = false;
        this.timer = null;

        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        this.update = this.update.bind(this);

        this.dispatch = d3.dispatch('play', 'pause');
        this.dispatch.on('play.button', this.play);
        this.dispatch.on('pause.button', this.pause);

        this.button = selector.append('div')
            .on('click', () => {
                if (this.isPlaying) {
                    this.dispatch.call('pause');
                } else {
                    this.dispatch.call('play');
                }
            });

        this.setClass(this.isLast ? 'replay' : 'play');
    }

    play () {
        this.isPlaying = true;
        this.setClass('pause');

        if (this.isLast) {
            this.first();
        } else {
            this.next();
        }

        this.timer = setInterval(() => {
            if (this.isLast) {
                this.dispatch.call('pause');
            } else {
                this.next();
            }
        }, this.animationTime);

    }

    pause () {
        clearInterval(this.timer);
        this.isPlaying = false;
        this.setClass(this.isLast ? 'replay' : 'play');
    }

    setClass (className) {
        this.button
            .classed('play', className === 'play')
            .classed('pause', className === 'pause')
            .classed('replay', className === 'replay');
    }

    update (roundMeta) {
        this.isLast = roundMeta.isLast;
    }
};
