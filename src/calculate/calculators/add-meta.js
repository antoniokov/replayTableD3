export default function (data, params) {
    const enriched = data.map((round, i) => {
        return {
            meta: {
                name: round.name,
                index: i,
                items: round.results.filter(result => result.change !== null).length,
                hasOnlyOutcomes: round.results.every(result => result.outcome || result.change === null),
                biggestChange: Math.max(...round.results.map(result => Math.abs(result.change || 0))),
                sumOfChanges: round.results.reduce((sum, result) => sum + (result.change || 0), 0),
            },
            results: round.results
        }
    });

    return {
        meta: {
             lastRound: enriched
                 .filter(round => round.results.some(result => result.change !== null))
                 .reduce((maxIndex, round) => Math.max(round.meta.index, maxIndex), 0),
        },
        results: enriched
    };
};
