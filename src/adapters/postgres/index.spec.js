import { Pool } from 'pg';
import { assertThat, equalTo } from 'hamjest'
import { buildRepository } from './index';

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
}

describe('postgres', () => {
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

    describe.only('create', () => {
        const recordToCreate = { property: 1, text: null };
        const repository = buildRepository({ resource: 'users' });
    
        it('returns record', async () => {
            assertThat(await repository.create(connection, recordToCreate),
                equalTo(recordToCreate));
        });
    });
});