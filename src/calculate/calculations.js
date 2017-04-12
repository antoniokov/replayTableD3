const checkingFunctions = {
    alwaysTrue: transformedData => true,

    hasOutcome: outcome => transformedData =>
        transformedData.some(round => round.results.some(result => result.outcome === outcome)),

    hasMatches: transformedData =>
        transformedData.some(round => round.results.some(result => result.match))
};


export default {
    'total': {
        check: checkingFunctions.alwaysTrue,
        calculate: result => result.change || 0
    },
    'rounds': {
        check: checkingFunctions.alwaysTrue,
        calculate: result => result.change === null ? 0 : 1
    },


    'wins': {
        check: checkingFunctions.hasOutcome('win'),
        calculate: result => result.outcome === 'win' ? 1 : 0
    },
    'losses': {
        check: checkingFunctions.hasOutcome('loss'),
        calculate: result => result.outcome === 'loss' ? 1 : 0
    },
    'draws': {
        check: checkingFunctions.hasOutcome('draw'),
        calculate: result => result.outcome === 'draw' ? 1 : 0
    },


    'goalsFor': {
        check: checkingFunctions.hasMatches,
        calculate: result => result.match ? result.match.score : 0
    },
    'goalsAgainst': {
        check: checkingFunctions.hasMatches,
        calculate: result => result.match ? result.match.opponentScore : 0
    },
};