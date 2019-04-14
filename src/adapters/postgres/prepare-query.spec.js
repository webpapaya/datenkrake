import { assertThat, hasProperties, equalTo } from 'hamjest';
import prepareQuery from './prepare-query';

describe('prepareStatement', () => {
  [
    {
      statement: 'select * from events LIMIT $limit AND $offset', record: { limit: 1, offset: 2 }, prepared: 'select * from events LIMIT $1 AND $2', values: [1, 2],
    },
    {
      statement: 'select * from events LIMIT $limit AND $limit', record: { limit: 1 }, prepared: 'select * from events LIMIT $1 AND $1', values: [1],
    },
    {
      statement: 'select * from events LIMIT $limit AND $limit', record: { limit: 1, offset: 2 }, prepared: 'select * from events LIMIT $1 AND $1', values: [1],
    },
  ].forEach(({
    statement, record, prepared, values,
  }) => {
    it(`'${statement}' with values ${JSON.stringify(record)} prepared correctly`, () => {
      assertThat(prepareQuery({ statement, values: record }), hasProperties({
        values: equalTo(values),
        text: equalTo(prepared),
      }));
    });
  });
});
