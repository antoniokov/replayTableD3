export default {
    extract: {},
    transform: {
        transformer: 'listOfMatches',
        collapseToRounds: true
    },
    calculate: {},
    visualize: {
        columns: ['position', 'item', 'points', 'outcome'],
        labels: ['#', 'Team', 'P', ' ']
    }
};
