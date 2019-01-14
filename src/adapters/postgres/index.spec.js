import { Pool } from 'pg';
import { assertThat, equalTo, hasItems, hasItem, not as negate } from 'hamjest'
import { buildRepository } from './index';
import { q, where, order } from '../../query-builder';
import {
	eq, gt, gte, lt, lte, oneOf, like, not, asc, desc,
} from '../../operators';

const pool = new Pool({
  host: 'localhost',
  user: 'dbuser',
  password: 'password',
  database: 'compup',
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const setupTestTable = async (connection) => {
    await connection.query(`
        create table users (
            property integer,
            text     text
        );
    `);
};

const assertDifference = async (fn, countFn, difference) => {
	const before = await countFn();
	await fn();
	assertThat(await countFn(), equalTo(before + difference));
};

describe('postgres', () => {
    const repository = buildRepository({ resource: 'users' });
    let connection;
    
    beforeEach(async () => {
        connection = await pool.connect()
        await connection.query('BEGIN')
        await setupTestTable(connection);
    });
    afterEach(async () => {
        await connection.query('ROLLBACK')
        await connection.release();
    });

    describe('where', () => {
        const records = [
            { text: 'abc', property: 1 },
            { text: 'def', property: 2 },
            { text: 'ghi', property: null },
        ];

        beforeEach(() => Promise.all(
            records.map((record) => repository.create(connection, record))));

        it('returns all records without a filter', async () => {
			assertThat(await repository.where(connection), equalTo(records));
        });
        
        it('works with eq filter', async () => {
			assertThat(await repository.where(connection, q(where({ property: eq(1) }))),
				equalTo([records[0]]));
        });
        
        it('works with gt filter', async () => {
			assertThat(await repository.where(connection, q(where({ property: gt(1) }))),
				negate(hasItem(records[0])));
		});

		it('works with gte filter', async () => {
			assertThat(await repository.where(connection, q(where({ property: gte(2) }))),
				negate(hasItem(records[0])));
		});

		it('works with lt filter', async () => {
			assertThat(await repository.where(connection, q(where({ property: lt(2) }))),
				hasItem(records[0]));
		});

		it('works with lte filter', async () => {
			assertThat(await repository.where(connection, q(where({ property: lte(1) }))),
				hasItem(records[0]));
		});

		it('works with oneOf filter', async () => {
			assertThat(await repository.where(connection, q(where({ property: oneOf(1, 2) }))),
				hasItems(records[0], records[1]));
		});

		it('works with like filter', async () => {
			assertThat(await repository.where(connection, q(where({ text: like('%b%') }))),
				hasItems(records[0]));
		});
    });

    describe('create', () => {
        const recordToCreate = { property: 1, text: null };
    
        it('returns record', async () => {
            assertThat(await repository.create(connection, recordToCreate),
                equalTo(recordToCreate));
        });

        it('adds a new record', async () => {
            await assertDifference(
                () => repository.create(connection, recordToCreate),
                () => repository.count(connection),
                1,
            );
        });
    });

    describe('count', () => {
        it('without any records, returns 0', async () => {
            assertThat(await repository.count(connection),
                equalTo(0));
        });
    })
});