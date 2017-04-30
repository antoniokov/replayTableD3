export default {
    extract: {},
    transform: {
        transformer: 'listOfMatches',
        collapseToRounds: true
    },
    calculate: {},
    visualize: {
        columns: ['position', 'item', 'points'],
        labels: ['#', 'Team', 'Points']
    }
};
