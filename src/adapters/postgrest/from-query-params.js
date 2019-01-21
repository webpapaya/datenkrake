import camelcase from 'camelcase';
import qs from 'qs';
import {
  q, where, limit, order, asc, desc, offset,
} from '../../index';
import * as OPERATORS from '../../operators';

const removeFirstAndLastIfCharacter = (character, string) => string
  .replace(new RegExp(`^${character}`), '')
  .replace(new RegExp(`${character}$`), '');

const isNumber = n =>
  !Number.isNaN(parseFloat(n)) && Number.isFinite(parseFloat(n));

const parseValue = (n) => {
  if (n === 'null') { return null; }
  if (isNumber(n)) { return parseFloat(n); }
  return removeFirstAndLastIfCharacter('"', n);
};

const parseString = (string) => {
  const [operator, value] = string.split('.').map(parseValue);

  if (value === null) { return OPERATORS.eq(value); }
  if (operator === 'in') {
    const parsedValue = value === '()' ? [] : value.slice(1, -1).split(',').map(parseValue);
    return OPERATORS.oneOf(...parsedValue);
  }
  return OPERATORS[operator](value);
};

const parseOrderOptions = (options) => {
  if (options === 'nullsfirst') { return { nulls: 'first' }; }
  if (options === 'nullslast') { return { nulls: 'last' }; }
  return {};
};

const parseOrder = (orderParams) => {
  if (!orderParams) { return order(); }
  const operators = orderParams.split(',').map((orderParam) => {
    const [property, direction, options] = orderParam.split('.');
    const ops = parseOrderOptions(options);
    return direction === 'desc'
      ? desc(camelcase(property), ops)
      : asc(camelcase(property), ops);
  });
  return order(...operators);
};

const parseLimit = (queryParam) => {
  if (!queryParam) { return limit(); }
  return limit(parseValue(queryParam));
};

const parseOffset = (queryParam) => {
  if (!queryParam) { return offset(); }
  return offset(parseValue(queryParam));
};

const parseWhere = (queryParams) => {
  const query = Object.keys(queryParams).reduce((result, key) => {
    // eslint-disable-next-line no-param-reassign
    result[key] = parseString(queryParams[key]);
    return result;
  }, {});

  return where(query);
};

export default (queryString) => {
  const queryParams = qs.parse(queryString);
  const {
    order, limit, offset, ...rest // eslint-disable-line no-shadow
  } = queryParams;

  return q(
    parseOrder(order),
    parseLimit(limit),
    parseOffset(offset),
    parseWhere(rest),
  );
};
