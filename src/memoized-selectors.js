import memoize from 'fast-memoize';
import { filterByQuery, findByQuery } from './selectors';

const memoizeWithCacheBuster = (fn) => memoize(fn, {
    serializer: ([query, records]) => {
      return [JSON.stringify(query), records]
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
              store = {}
            }

            return store[query];
          },
          set([query, records], value) {
            store.records = records
            store[query] = value
          }
        };
      }
    }
  });

export const createFilterByQuery = () => memoizeWithCacheBuster(filterByQuery);
export const createFindByQuery = () => memoizeWithCacheBuster(findByQuery);
