import {
  assertThat,
  equalTo,
  not as negate,
  hasItem,
  hasItems,
  contains,
  hasProperty,
  everyItem,
} from 'hamjest';

import { q, where, order } from '../query-builder';
import {
  eq, gt, gte, lt, lte, oneOf, like, not, asc, desc,
} from '../operators';
import * as inMemory from './in-memory';
import * as postgres from './postgres';

const assertDifference = async (fn, countFn, difference) => {
  const before = await countFn();
  await fn();
  assertThat(await countFn(), equalTo(before + difference));
};

[
  { name: 'inMemory', adapter: inMemory, setup: () => {} },
  {
    name: 'postgres',
    adapter: postgres,
    setup: ({ connection }) => connection.query(`
        create table users (
            property integer,
            text     text
        );
    `),
  },
].forEach(({ name, adapter, setup }) => {
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
        const { meta } = await repository.destroy(connection, null);
        assertThat(meta, equalTo({
          length: records.length,
          total: 0,
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
        const { meta } = await repository.update(connection, null, { text: 'updated' });
        assertThat(meta, equalTo({
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

    describe('where', async () => {
      const records = [
        { text: 'abc', property: 1 },
        { text: 'def', property: 2 },
        { text: 'ghi', property: null },
      ];

      it('contains correct meta information', t(async ({ connection }) => {
        await setupRecords(connection, records);
        const { meta } = await repository.where(connection);
        assertThat(meta, equalTo({
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
          it('nulls are first by default', t(async ({ connection }) => {
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
