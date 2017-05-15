import Skeleton from '../skeleton';
import skeletonCell from '../cell';
import numberToChange from '../../helpers/general/number-to-change';
import getItems from '../../helpers/data/get-items';
import getItemResults from '../../helpers/data/get-item-results';
import toCSS from '../../helpers/general/to-css';


export default class extends Skeleton {
    constructor (data, params) {
        const items = getItems(data.results);
        const paramsEnriched = Object.assign({}, params, {
            sparklinesData: new Map(items.map(item => [item, getItemResults(data.results, item)])),
            darkSparkColors: {
                'win': '#AAD579', //d3.color(params.sparkColors.win).darker(0.3),
                'draw': '#CCCCCC', //d3.color(params.sparkColors.draw).darker(),
                'loss': '#E89B77' //d3.color(params.sparkColors.loss).darker(),
            }
        });

        super(data, paramsEnriched);

        this.durations.scale = d3.scaleLinear()
            .domain([1, data.meta.lastRound])
            .range([this.durations.move, 1.5*this.durations.move]);
    }

    makeTable (data, className, columns) {
        const table = this.tableContainer
            .append('table')
            .attr('class', className);

        const tbody = table.append('tbody');
        const rows = tbody.selectAll('tr')
            .data(data, k => k.item)
            .enter().append('tr')
            .attr('class', className.includes('left') ? 'left' : 'right');

        const paramsEnriched = Object.assign({ currentRound: this.currentRound }, this.params);
        const cells = rows.selectAll('td')
            .data(result => columns.map(column => new Cell(column, result, paramsEnriched)))
            .enter().append('td')
            .attr('class', cell => cell.classes.join(' '))
            .each(function(cell) {
                ['color', 'backgroundColor']
                    .filter(property => cell.hasOwnProperty(property))
                    .forEach(property => d3.select(this).style(toCSS(property), cell[property]));
            })
            .text(cell => cell.text)
            .on('click', cell => {
                switch(cell.column) {
                    case 'item':
                        if (this.drilldown.item !== cell.result.item) {
                            return this.drillDown(cell.result.item);
                        } else {
                            return this.endDrillDown();
                        }
                    default:
                        return null;
                }
            });

        if (className.includes('left')) {
            this.enrichSparks(table);
        }

        return [table, rows, cells];
    }

    enrichSparks (table) {
        this.sparks = table.selectAll('td.spark')
            .filter(cell => cell.roundIndex <= this.data.meta.lastRound);

        this.sparks
            .on('mouseover', cell => this.preview(cell.roundIndex))
            .on('mouseout', cell => this.endPreview(false))
            .on('click', cell => this.endPreview(true));

        const top = d3.scaleLinear()
            .domain([1, this.data.results[0].results.length])
            .range([0, 100]);

        this.sparks
            .append('span')
            .attr('class', 'spark-position')
            .style('top', cell => `${top(cell.result.position.strict)}%`);

        this.sparks
            .append('span')
            .attr('class', 'spark-score muted')
            .text(cell => cell.result.match ? `${cell.result.match.score}:${cell.result.match.opponentScore}` : '');
    }

    makeSlider (position = 'top') {
        const slider = position === 'top'
            ? this.left.table.select('tbody').insert('tr', 'tr')
            : this.left.table.select('tbody').append('tr');

        slider
            .attr('class', `sparklines-slider ${position}`)
            .selectAll('td')
            .data(this.left.columns.slice(0, 3))
            .enter().append('td')
            .attr('colspan', (d,i) => i === 2 ? this.roundsTotalNumber: null)
            .attr('class', (d,i) => i === 2 ? 'slider-cell' : null);

        this.slider.left = `${this.slider.scale(this.currentRound)}px`;
        return slider.select('.slider-cell')
            .append('span')
            .attr('class', 'slider-toggle')
            .style('left', this.slider.left)
            .text(this.data.results[this.currentRound].meta.name)
            .call(d3.drag()
                .on("drag", () => {
                    const roundIndex = Math.round(this.slider.scale.invert(d3.event.x));
                    this.moveRightTable(roundIndex);
                    this.preview(roundIndex);
                })
                .on("end", () => this.endPreview(true))
            );
    }

    moveSlider (roundIndex, duration = 0) {
        const previous = this.slider.left;
        this.slider.left =`${this.slider.scale(roundIndex)}px`;
        [this.slider.top, this.slider.bottom].map(slider => {
            slider
                .transition()
                .duration(duration)
                .style('left', this.slider.left)
                .text(this.data.results[roundIndex].meta.name);
        });
    }

    renderTable (data, className = 'main') {
        this.left = {};
        this.right = {};
        this.slider = {};

        const sparks = Array.from({ length: this.roundsTotalNumber }, (v, i) => `spark.${i+1}`);
        this.left.columns = ['position', 'item', ...sparks];
        this.right.columns = ['score', 'opponent', 'points.change', 'equal', 'points', 'pointsLabel'];

        [this.left.table, this.left.rows, this.left.cells] = this.makeTable(data, `${className} left`, this.left.columns);
        [this.right.table, this.right.rows, this.right.cells] = this.makeTable(data, `${className} right`, this.right.columns);

        this.moveRightTable(this.currentRound);


        const offsets = this.sparks.nodes().map(n => n.offsetLeft);
        const width = this.sparks.node().offsetWidth;
        const left = Math.min(...offsets);
        const right = Math.max(...offsets);

        this.slider.scale = d3.scaleLinear()
            .domain([1, this.data.meta.lastRound])
            .range([0, right - left])
            .clamp(true);

        this.slider.top = this.makeSlider('top');
        this.slider.bottom = this.makeSlider('bottom');


        const tables = d3.selectAll(`${this.selector} table.${className}`);
        const rows = d3.selectAll(d3.merge([this.left.rows.nodes(), this.right.rows.nodes()]));
        const cells = rows.selectAll('td');

        return [tables, rows, cells];
    }

    moveRightTable (roundIndex, duration = 0) {
        const previousValue = this.right.left;
        const spark = this.sparks.filter(cell => cell.roundIndex === roundIndex).node();
        console.log(spark.offsetLeft, spark.offsetWidth);
        this.right.left = spark.offsetLeft + spark.offsetWidth;

        if (duration) {
            this.right.table
                .transition()
                .duration(duration)
                .styleTween('left', () => d3.interpolateString(`${previousValue}px`, `${this.right.left}px`));
        } else {
            this.right.table.style('left', `${this.right.left}px`);
        }
    }

    updateRightTable (roundIndex) {
        const nextRoundResults = new Map(this.data.results[roundIndex].results.map(result => [result.item, result]));

        this.right.cells = this.right.cells
            .data(result => this.right.columns.map(column => new Cell(column, nextRoundResults.get(result.item), this.params)))
            .attr('class', cell => cell.classes.join(' '))
            .each(function(cell) {
                if (cell.color) {
                    d3.select(this).style('color', cell.color)
                }
            })
            .text(cell => cell.text);
    }

    to (roundIndex) {
        if (roundIndex < 1 || roundIndex > this.data.meta.lastRound) {
            return Promise.reject(`Sorry we can't go to round #${roundIndex}`);
        }

        if (roundIndex === this.currentRound) {
            return Promise.resolve();
        }

        const change = roundIndex - this.currentRound;
        this.dispatch.call('roundChange', this, this.data.results[roundIndex].meta);

        this.updateRightTable(roundIndex);

        const duration = this.durations.scale(Math.abs(change));
        this.moveRightTable(roundIndex, duration);
        this.moveSlider(roundIndex, duration);
        return this.move(roundIndex, 0, duration);
    }

    first () {
        return this.to(1);
    }

    preview (roundIndex) {
        if (roundIndex < 1 || roundIndex > this.data.meta.lastRound) {
            return Promise.reject(`Sorry we can't preview round #${roundIndex}`);
        }

        const previousPreviewedRound = this.previewedRound;

        if (previousPreviewedRound === roundIndex) {
            return Promise.resolve();
        }

        this.dispatch.call('roundPreview', this, this.data.results[roundIndex].meta);

        this.updateRightTable(roundIndex);
        this.moveSlider(roundIndex);

        this.sparks.filter('.current')
            .classed('current', false)
            .style('background-color', cell => this.params.sparkColors[cell.result.outcome] || 'transparent');

        this.sparks.filter(cell => cell.roundIndex === roundIndex)
            .classed('current', true)
            .style('background-color', cell => this.params.darkSparkColors[cell.result.outcome] || 'transparent');

        return Promise.resolve();
    }

    drillDown (item) {
        this.dispatch.call('drillDown', this, item);

        if (!this.drilldown.controls) {
            this.drilldown.controls = this.controls.append('div')
                .attr('class', 'drilldown-control')
                .on('click', this.endDrillDown)
                .text(this.params.allLabel);
        }

        this.sparks
            .classed('muted', cell => !cell.result.match || (cell.result.item !== item && cell.result.match.opponent !== item));

        this.sparks.selectAll('.spark-score')
            .classed('muted', cell => !cell.result.match || cell.result.item === item || cell.result.match.opponent !== item);

        return Promise.resolve();
    }

    endDrillDown () {
        this.drilldown.controls.remove();
        this.drilldown.controls = null;

        this.sparks.classed('muted', false);

        this.sparks.selectAll('.spark-score')
            .classed('muted', true);

        this.dispatch.call('endDrillDown', this, null);
        return Promise.resolve();
    }
};


class Cell extends skeletonCell {
    score (result, params) {
        this.text = result.match ? `${result.match.score}:${result.match.opponentScore}` : '';
        this.classes = ['score', 'change'];
        this.color = params.colors[result.outcome];
        return this;
    }

    opponent (result, params) {
        this.text = result.match ? result.match.opponent : '';
        this.classes = ['opponent', 'change'];
        return this;
    }

    equal (result, params) {
        this.text = result.position.strict === 1 ? '=' : '';
        this.classes = ['label', 'change'];
        return this;
    }

    pointsLabel (result, params) {
        this.text = result.position.strict === 1 ? params.pointsLabel : '';
        this.classes = ['label', 'change'];
        return this;
    }

    makeChange (column, result, params) {
        const calc = column.replace('.change', '');
        this.text = numberToChange(result[calc].change, '0');
        this.classes = ['change'];
        this.color = params.colors[result.outcome];
        return this;
    }
}
