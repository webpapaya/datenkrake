import {
  assertThat,
  equalTo,
  not as negate,
  hasItem,
  hasItems,
  contains,
  hasProperty,
  hasProperties,
  everyItem,
} from 'hamjest';
import { execSync } from 'child_process';

import {
  q, where, order, limit, offset,
} from '../query-builder';
import {
  eq, gt, gte, lt, lte, oneOf, like, not, asc, desc,
} from '../operators';
import * as inMemory from './in-memory';
import * as postgres from './postgres';
import * as postgrest from './postgrest';

const assertDifference = async (fn, countFn, difference) => {
  const before = await countFn();
  await fn();
  assertThat(await countFn(), equalTo(before + difference));
};

[
  {
    name: 'inMemory', adapter: inMemory, setup: () => {}, teardown: () => {},
  },
  {
    name: 'postgres',
    adapter: postgres,
    setup: ({ connection }) => connection.query(`
        create table users (
            property integer,
            text     text
        );
    `),
    teardown: () => {},
  },
  {
    name: 'postgrest',
    adapter: postgrest,
    setup: async () => {
      await postgres.withinConnection(({ connection }) => connection.query(`
          create table users (
              property integer,
              text     text
          );
        `));

      await postgrest.withinConnection(async ({ connection }) => Promise.resolve()
        .then(() => connection.get('/'))
        .then(response => !response.data.paths['/users'])
        .then(needsToRestart => needsToRestart && execSync('docker-compose restart server')));
    },
    teardown: () => postgres.withinConnection(({ connection }) => connection.query('drop table users;')),
  },
].forEach(({
  name, adapter, setup, teardown,
}) => {
  describe(name, () => {
    const { buildRepository, withinTransaction } = adapter;
    const repository = buildRepository({ resource: 'users' });
    const t = fn => () => withinTransaction(async ({ connection, rollback }) => {
      try {
        await setup({ connection });
        await fn({ connection });
      } catch (e) {
        throw e;
      } finally {
        await rollback();
        await teardown();
      }
    });

    const setupRecords = (connection, collection) =>
      collection.reduce((promise, record) => promise.then(() =>
        repository.create(connection, record)), Promise.resolve());

    describe('count', () => {
      const records = [
        { text: 'abc', property: 1 },
        { text: 'def', property: 2 },
        { text: 'ghi', property: null },
      ];

      it('returns number of records without a filter', t(async ({ connection }) => {
        await setupRecords(connection, records);
        assertThat(await repository.count(connection), equalTo(records.length));
      }));

      it('returns number of records when query given', t(async ({ connection }) => {
        await setupRecords(connection, records);
        assertThat(await repository.count(connection, q(where({ property: eq(1) }))), equalTo(1));
      }));
    });

    describe('create', () => {
      const recordToCreate = { property: 1, text: null };

      it('returns record', t(async ({ connection }) => {
        assertThat(await repository.create(connection, recordToCreate),
          equalTo(recordToCreate));
      }));

      it('adds a new record', t(({ connection }) => assertDifference(
        () => repository.create(connection, recordToCreate),
        () => repository.count(connection),
        1,
      )));
    });

    describe('destroy', () => {
      const records = [
        { text: 'abc', property: 1 },
        { text: 'def', property: 2 },
        { text: 'ghi', property: null },
      ];

      it('contains correct meta information', t(async ({ connection }) => {
        await setupRecords(connection, records);
        const result = await repository.destroy(connection, null);
        assertThat(result, hasProperties({
          total: records.length,
          limit: records.length,
          offset: 0,
        }));
      }));

      it('removes record from connection', t(async ({ connection }) => {
        await setupRecords(connection, records);
        await repository.destroy(connection, q(where({ property: eq(1) })));

        const remainingRecords = await repository.where(connection);
        assertThat(remainingRecords, negate(hasItem(records[0])));
      }));

      it('removes one record from connection', t(async ({ connection }) => {
        await setupRecords(connection, records);
        await assertDifference(
          () => repository.destroy(connection, q(where({ property: eq(1) }))),
          () => repository.count(connection),
          -1,
        );
      }));

      it('returns removed record', t(async ({ connection }) => {
        await setupRecords(connection, records);
        const removedRecords = await repository.destroy(connection, q(where({ property: eq(1) })));
        assertThat(removedRecords, hasItem(records[0]));
      }));
    });

    describe('update', () => {
      const records = [
        { text: 'abc', property: 1 },
        { text: 'def', property: 2 },
        { text: 'ghi', property: null },
      ];

      it('contains correct meta information', t(async ({ connection }) => {
        await setupRecords(connection, records);
        const result = await repository.update(connection, null, { text: 'updated' });
        assertThat(result, hasProperties({
          length: records.length,
          total: records.length,
        }));
      }));

      it('does NOT change the record count', t(async ({ connection }) => {
        await setupRecords(connection, records);
        await assertDifference(
          () => repository.update(connection, q(where({ property: eq(1) }))),
          () => repository.count(connection),
          0,
        );
      }));

      it('changes updates all values without query given', t(async ({ connection }) => {
        await setupRecords(connection, records);
        const updatedRecords = await repository.update(connection, null, { text: 'updated' });
        assertThat(updatedRecords, everyItem(hasProperty('text', 'updated')));
      }));

      it('with query given updates only updates filtered values', t(async ({ connection }) => {
        await setupRecords(connection, records);
        await repository.update(connection, q(where({ property: eq(1) })), { text: 'updated' });

        assertThat(await repository.where(connection, q(where({ property: not(eq(1)) }))),
          everyItem(negate(hasProperty('text', 'updated'))));
      }));
    });

    describe('pagination', () => {
      const records = [
        { text: 'abc', property: 1 },
        { text: 'def', property: 2 },
        { text: 'ghi', property: null },
      ];

      it('limit clause is respected', t(async ({ connection }) => {
        await setupRecords(connection, records);
        assertThat(await repository.where(connection, q(limit(1))), hasProperty('length', equalTo(1)));
      }));

      it('offset clause is respected', t(async ({ connection }) => {
        await setupRecords(connection, records);
        assertThat(await repository.where(connection, q(offset(1))), hasProperty('length', equalTo(2)));
      }));

      it('returns empty record list on high offset', t(async ({ connection }) => {
        await setupRecords(connection, records);
        assertThat(await repository.where(connection, q(offset(100))), hasProperty('length', equalTo(0)));
      }));

      it('returns pagination info', t(async ({ connection }) => {
        await setupRecords(connection, records);

        assertThat(await repository.where(connection, q(limit(1), offset(2))), hasProperties({
          total: 3,
          limit: 1,
          offset: 2,
        }));
      }));
    });

    describe('where', async () => {
      const records = [
        { text: 'abc', property: 1 },
        { text: 'def', property: 2 },
        { text: 'ghi', property: null },
      ];

      it('contains correct meta information', t(async ({ connection }) => {
        await setupRecords(connection, records);
        const result = await repository.where(connection);
        assertThat(result, hasProperties({
          length: records.length,
          total: records.length,
        }));
      }));

      describe('filters', () => {
        it('returns all records without a filter', t(async ({ connection }) => {
          await setupRecords(connection, records);
          assertThat(await repository.where(connection), equalTo(records));
        }));

        it('works with eq filter', t(async ({ connection }) => {
          await setupRecords(connection, records);
          assertThat(await repository.where(connection, q(where({ property: eq(1) }))),
            equalTo([records[0]]));
        }));

        it('works with not filter', t(async ({ connection }) => {
          await setupRecords(connection, records);
          assertThat(await repository.where(connection, q(where({ property: not(eq(1)) }))),
            negate(hasItem(records[0])));
        }));

        it('works with gt filter', t(async ({ connection }) => {
          await setupRecords(connection, records);
          assertThat(await repository.where(connection, q(where({ property: gt(1) }))),
            negate(hasItem(records[0])));
        }));

        it('works with gte filter', t(async ({ connection }) => {
          await setupRecords(connection, records);
          assertThat(await repository.where(connection, q(where({ property: gte(2) }))),
            negate(hasItem(records[0])));
        }));

        it('works with lt filter', t(async ({ connection }) => {
          await setupRecords(connection, records);
          assertThat(await repository.where(connection, q(where({ property: lt(2) }))),
            hasItem(records[0]));
        }));

        it('works with lte filter', t(async ({ connection }) => {
          await setupRecords(connection, records);
          assertThat(await repository.where(connection, q(where({ property: lte(1) }))),
            hasItem(records[0]));
        }));

        it('works with oneOf filter', t(async ({ connection }) => {
          await setupRecords(connection, records);
          assertThat(await repository.where(connection, q(where({ property: oneOf(1, 2) }))),
            hasItems(records[0], records[1]));
        }));

        it('works with like filter', t(async ({ connection }) => {
          await setupRecords(connection, records);
          assertThat(await repository.where(connection, q(where({ text: like('%b%') }))),
            hasItems(records[0]));
        }));
      });

      describe('order', () => {
        describe('asc', () => {
          it('nulls are last by default', t(async ({ connection }) => {
            await setupRecords(connection, records);
            assertThat(await repository.where(connection, q(order(asc('property')))),
              contains(records[0], records[1], records[2]));
          }));

          it('with nulls first option', t(async ({ connection }) => {
            await setupRecords(connection, records);
            assertThat(await repository.where(connection, q(order(asc('property', { nulls: 'first' })))),
              contains(records[2], records[0], records[1]));
          }));

          it('with nulls nulls last option', t(async ({ connection }) => {
            await setupRecords(connection, records);
            assertThat(await repository.where(connection, q(order(asc('property', { nulls: 'last' })))),
              contains(records[0], records[1], records[2]));
          }));
        });

        describe('desc', () => {
          it.skip('nulls are first by default', t(async ({ connection }) => {
            await setupRecords(connection, records);
            assertThat(await repository.where(connection, q(order(desc('property')))),
              contains(records[1], records[0], records[2]));
          }));

          it('with nulls first option', t(async ({ connection }) => {
            await setupRecords(connection, records);
            assertThat(await repository.where(connection, q(order(desc('property', { nulls: 'first' })))),
              contains(records[2], records[1], records[0]));
          }));

          it('with nulls nulls last option', t(async ({ connection }) => {
            await setupRecords(connection, records);
            assertThat(await repository.where(connection, q(order(desc('property', { nulls: 'last' })))),
              contains(records[1], records[0], records[2]));
          }));
        });
      });
    });
  });
});
