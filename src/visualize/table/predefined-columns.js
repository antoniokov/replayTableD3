import numberToChange from '../../helpers/general/number-to-change';


const getClassesFunction = className => params => (item, result) => [className];

export default {
    'position': {
        label: '',
        getText: params => (item, result) => {
            switch (params.positionWhenTied) {
                case 'strict':
                    return  result.position.strict.toString();
                case 'highest':
                    return result.position.highest.toString();
                case 'range':
                    return `${result.position.highest}–${result.position.lowest}`;
                case 'average':
                    return ((result.position.highest + result.position.lowest)/2).toString();
                default:
                    return result.position.strict.toString();
            }
        },
        getClasses: getClassesFunction('position')
    },
    'item': {
        label: '',
        getText: params => (item, result) => item,
        getClasses: getClassesFunction('item')
    },
    'change': {
        label: '',
        getText: params => (item, result) => numberToChange(result.total.change),
        getClasses: getClassesFunction('change')
    },
    'total': {
        label: '',
        getText: params => (item, result) => result.total.total.toString(),
        getClasses: getClassesFunction('total')
    },
    'match': {
        label: '',
        getText: params => (item, result) => result.match ? `${result.match.score} - ${result.match.opponentScore}` : '',
        getClasses: params => (item, result) => ['match', result.outcome]
    },
    'opponent': {
        label: '',
        getText: params => (item, result) => result.match ? result.match.opponent : '',
        getClasses: params => (item, result) => ['opponent', result.outcome]
    }
};