export default {
    extract: {},
    transform: {
        transformer: 'pointsTable',
        changeToOutcome: {
            1: 'win',
            0: 'loss'
        }
    },
    calculate: {
        orderBy: ['total', 'wins']
    },
    visualize: {
        labels: {
            'season': 'Турнир',
            'round': 'Вопрос',
            'changes': 'Вопрос',
            'position': 'Место',
            'item': 'Команда',
            'total': 'Взято',
            'change': 'Вопрос'
        },
        positionWhenTied: 'range'
    }
};
