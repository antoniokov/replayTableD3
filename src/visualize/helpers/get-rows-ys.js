export default function (rows) {
    return new Map(rows.nodes().map(n => [n.__data__.item, n.getBoundingClientRect().top]));
};
