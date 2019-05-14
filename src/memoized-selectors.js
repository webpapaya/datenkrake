import memoize from 'fast-memoize';
import { pathOr } from 'ramda';
import { filterByQuery, findByQuery } from './selectors';
const EMPTY_ARRAY = [];

const memoizeWithCacheBuster = fn => memoize(fn, {
  serializer: ([query, records, options]) => {
    const scopedRecords = pathOr([], options.path, records);
    return [JSON.stringify(query), scopedRecords];
  },
  cache: {
    create() {
      let store = {};
      return {
        has([query]) {
          return (query in store);
        },
        get([query, records]) {
          if (store.records !== records) {
            store = {};
          }
          return store[query];
        },
        set([query, records], value) {
          store.records = records;
          store[query] = value;
        },
      };
    },
  },
});


export const createFilterByQuery = ({ path = [] } = {}) => {
  const cache = memoizeWithCacheBuster((query, records) =>
    filterByQuery(query, pathOr([], path, records)));

  return (query, records) => cache(query, records, { path });
}


export const createFindByQuery = ({ path = [] } = {}) => {
  const cache = memoizeWithCacheBuster((query, records) =>
    findByQuery(query, pathOr([], path, records)));

  return (query, records) => cache(query, records, { path });
}