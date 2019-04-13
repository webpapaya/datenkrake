import memoize from 'fast-memoize';
import {
  equals as rEquals,
  where as rWhere,
  filter as rFilter,
  lt as rGt, // ramda is weired and swaps gt and lt
  lte as rGte,
  gt as rLt,
  gte as rLte,
  includes as rIncludes,
  complement as rNot,
  descend as rDescendent,
  ascend as rAscendent,
  sortWith as rSortWith,
  slice as rSlice,

  flip,
  is,
  isNil,
} from 'ramda';

export const FILTERS = {
  eq: rEquals,
  gt: rGt,
  gte: rGte,
  lt: rLt,
  lte: rLte,
  oneOf: flip(rIncludes),
  like: likeQuery => (value) => {
    const query = likeQuery.replace(/%/g, '.*');
    return is(String, value) && value.match(new RegExp(query));
  },
};

const buildSortDirection = (definition) => {
  const fetchValueToSort = (obj) => {
    const value = obj[definition.value];
    if (!isNil(value)) { return value; }
    if (definition.operator === 'asc') {
      return definition.options.nulls === 'first' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    }
    return definition.options.nulls === 'first' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  };
  return definition.operator === 'asc'
    ? rAscendent(fetchValueToSort)
    : rDescendent(fetchValueToSort);
};

const definitionToRamda = (definition) => {
  if (definition.operator === 'not') {
    return rNot(definitionToRamda(definition.value));
  }
  return FILTERS[definition.operator](definition.value);
};

const filterRecords = (query, records) => {
  const { where = {} } = query || {};
  const filter = Object.keys(where).reduce((acc, propertyName) => {
    acc[propertyName] = definitionToRamda(where[propertyName]);
    return acc;
  }, {});

  return rFilter(rWhere(filter), records);
};

const orderRecords = (query, records) => {
  const { order = [] } = query || {};
  if (order.length === 0) { return records; }
  const sortDefinition = order.map(definition => buildSortDirection(definition));
  return rSortWith(sortDefinition, records);
};

const paginateRecords = (query, records) => {
  const { limit = records.length, offset = 0 } = query || {};
  return rSlice(offset, offset + limit, records);
};

export const filterByQuery = (query, collection) => {
  const filteredRecords = filterRecords(query, collection);
  const sortedRecords = orderRecords(query, filteredRecords);
  return paginateRecords(query, sortedRecords);
};

export const findByQuery = (query, collection, defaultValue = {}) => {
  const filteredRecords = filterByQuery(query, collection);
  return filteredRecords[0] || defaultValue;
};
