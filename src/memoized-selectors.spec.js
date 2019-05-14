import { assertThat, strictlyEqualTo, not, equalTo } from 'hamjest';
import { createFilterByQuery } from './memoized-selectors';
import { gte } from './operators';
import { q } from './query-builder';

const records1 = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
];

const records2 = [
  { id: 4 },
  { id: 5 },
  { id: 6 },
];

describe.only('memoizedSelectors', () => {
  it('return the same object with same query', () => {
    const filterByQuery = createFilterByQuery();
    const query = q({ id: gte(2) });
    const first = filterByQuery(query, records1);
    const second = filterByQuery(query, records1);

    assertThat(first, strictlyEqualTo(second));
  });

  it('invalidates cache when records change', () => {
    const filterByQuery = createFilterByQuery();
    const query = q({ id: gte(2) });
    const first = filterByQuery(query, records1);
    filterByQuery(query, records2);
    const second = filterByQuery(query, records1);

    assertThat(first, not(strictlyEqualTo(second)));
  });

  describe('with path', () => {
    it('invalidates cache when records change', () => {
      const filterByQuery = createFilterByQuery({ path: ['users'] });
      const result = filterByQuery(q(), { users: records1 });

      assertThat(result, equalTo(records1));
    });
  });
});
