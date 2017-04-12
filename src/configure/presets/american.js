export default {
    extract: {},
    transform: {
        transformer: 'listOfMatches',
        changeToOutcome: {
            1: 'win',
            0: 'loss'
        }
    },
    calculate: {
        orderBy: ['winningPercentage']
    },
    visualize: {
        visualizer: 'classic-american',
        columns: ['position', 'item', 'rounds', 'wins', 'losses', 'match', 'opponent']
    }
};
