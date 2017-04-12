export default {
    extract: {},
    transform: {
        transformer: 'pointsTable',
        changeToOutcome: {
            25: 'win'
        },
        insertStartRound: 'Start →'
    },
    calculate: {
        orderBy: ['total', 'wins']
    },
    visualize: {
        columns: ['position', 'item', 'change', 'total'],
        labels: {
            'round': 'Race',
            'item': 'Driver'
        }
    }
};
