import predefinedColumns from './predefined-columns';
import calculations from '../../calculate/calculations';
import warn from '../../helpers/warn';

const getClassesFunction = className => (item, result) => [className];

export default function (data, params) {
    const columns = [];
    params.columns.forEach(column => {
        const sampleResult = data.results[0].results.values().next().value;

        if (predefinedColumns.hasOwnProperty(column)) {
            columns.push({
                label: '',
                getText: predefinedColumns[column].getText(params),
                getClasses: predefinedColumns[column].getClasses(params)
            });
        } else if (sampleResult.hasOwnProperty(column) && calculations.hasOwnProperty(column)) {
            columns.push({
                label: column[0].toUpperCase(),
                getText: (item, result) => result[column].total,
                getClasses: getClassesFunction('calculation')
            })
        } else if (sampleResult.hasOwnProperty(column) && !calculations.hasOwnProperty(column)) {
            columns.push({
                label: column,
                getText: (item, result) => result[column],
                getClasses: getClassesFunction('extra')
            })
        } else if (sampleResult.extras.item.hasOwnProperty(column)) {
            columns.push({
                label: column,
                getText: (item, result) => result.extras.item[column],
                getClasses: getClassesFunction('extra')
            })
        } else {
            warn(`Sorry, we couldn't ${column} column anywhere. Ignoring it and moving on`)
        }

    });

    return columns;
};
