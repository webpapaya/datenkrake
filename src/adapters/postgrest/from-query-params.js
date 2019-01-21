import camelcase from 'camelcase';
import qs from 'qs';
import { q, where, limit, order, asc, desc, offset } from '../../index';
import * as OPERATORS from '../../operators';

const removeFirstAndLastIfCharacter = (character, string) => string
    .replace(new RegExp(`^${character}`), '')
    .replace(new RegExp(`${character}$`), '');

const isNumber = (n) => 
    !isNaN(parseFloat(n)) && isFinite(n);

const parseValue = (n) => {
    if (n === "null") { return null; }
    else if (isNumber(n)) { return parseFloat(n); }
    else { return removeFirstAndLastIfCharacter('"', n); }
}

const parseString = (string) => {
    const [operator, value] = string.split('.').map(parseValue);

    if (value === null) { return OPERATORS.eq(value); }
    else if (operator === 'in') {
        const parsedValue = value === '()' ? [] : value.slice(1,-1).split(',').map(parseValue);
        return OPERATORS.oneOf(...parsedValue);
    }
    else { return OPERATORS[operator](value) }
}

const parseOrderOptions = (options) => {
    if (options === 'nullsfirst') { return { nulls: 'first' }; }
    else if (options === 'nullslast') { return { nulls: 'last' }; }
    return {};
}

const parseOrder = (orderParams) => {
    if (!orderParams) { return; }
    const operators = orderParams.split(',').map((orderParam) => {
        const [ property, direction, options ] = orderParam.split('.');
        const ops = parseOrderOptions(options);
        return direction === 'desc'
            ? desc(camelcase(property), ops)
            : asc(camelcase(property), ops)

    });
    return order(...operators);
}

const parseLimit = (queryParam) => {
    if (!queryParam) { return; }
    return limit(parseInt(queryParam));
}

const parseOffset = (queryParam) => {
    if (!queryParam) { return; }
    return offset(parseInt(queryParam));
}

const parseWhere = (queryParams) => {
    const query = Object.keys(queryParams).reduce((result, key) => {
        result[key] = parseString(queryParams[key]);
        return result;
    }, {})

    return where(query);
}

export default (queryString) => {
    const queryParams = qs.parse(queryString);
    const { order, limit, offset, ...rest } = queryParams;

    return q(
        parseOrder(order), 
        parseLimit(limit), 
        parseOffset(offset),
        parseWhere(rest),
    );
}
