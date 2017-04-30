export default {
    extract: {},
    transform: {
        transformer: 'pointsTable',
        changeToOutcome: {
            1: 'win',
            0: 'loss'
        }
    },
    calculate: {},
    visualize: {
        labels: ['#', 'Команда', 'Взятых'],
        positionWhenTied: 'range'
    }
};
