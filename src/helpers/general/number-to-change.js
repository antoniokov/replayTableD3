export default function (number) {
    if (number > 0) {
        return `+${number}`;
    } else if (number < 0) {
        return number.toString();
    } else {
        return '';
    }
};
