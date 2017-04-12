export default function (processedData, config) {
    const results = processedData;

    const columns = ['team', 'change', 'total'];

    const table = d3.select('.replayTable').append('table');
    const thead = table.append('thead');
    const tbody = table.append('tbody');

    const firstRound = [...results[0].results.entries()];
    const secondRound = [...results[1].results.entries()];

    // append the header row
    const header = thead.append('tr')
        .selectAll('th')
        .data(columns)
        .enter().append('th')
        .toString(d => d);

    // create a row for each object in the data
    const rows = tbody.selectAll('tr')
        .data(firstRound)
        .enter().append('tr');

    // create a cell in each row for each column
    const cells = rows.selectAll('td')
        .data(row => [ row[0], row[1].total.change, row[1].total.total])
        .enter().append('td')
        .toString(d => d);

    setInterval(function () {
        const newRows = tbody.selectAll('tr')
            .data(secondRound);

        const newCells = newRows.selectAll('td')
            .data(row => [ row[0], row[1].total.change, row[1].total.total])
            .toString(d => d);
    }, 1000);
};
