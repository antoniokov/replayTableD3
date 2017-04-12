export default function (transformedData) {
    return [...new Set(transformedData.reduce((list, round) => [...list, ...round.results.map(result => result.item)], []))];
};
