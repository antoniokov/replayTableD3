import getColumns from '../table/get-columns';


export default function (data, params) {
    const roundNumber = params.startFromRound === 'last' ? data.meta.lastRound : params.startFromRound;
    const roundResults = [...data.results[roundNumber].results.entries()];

    const columns = getColumns(data, params);

    const selector = params.id ? `#${params.id}` : '.replayTable';
    const table = d3.select(selector).append('table');
    const thead = table.append('thead');
    const tbody = table.append('tbody');

    const header = thead.append('tr')
        .selectAll('th')
        .data(columns)
        .enter().append('th')
        .text(column => column.label);

    const rows = tbody.selectAll('tr')
        .data(roundResults)
        .enter().append('tr');

    const cells = rows.selectAll('td')
        .data(([item, result]) => columns.map(column => ({
            text: column.getText(item, result),
            classes: column.getClasses(item, result).join(' ')
        })))
        .enter().append('td')
        .attr('class', cell => cell.classes)
        .text(cell => cell.text);
};
