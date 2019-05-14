import memoize from 'fast-memoize';
import { pathOr } from 'ramda';

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

export default memoizeWithCacheBuster;
