import Classic from './classic';

export default class Sparklines extends Classic {
    constructor (data, params) {
        super(data, params);
        console.log('Hey!');
    }
};
