import { rethrowError, ignoreReturnFor } from 'promise-frites';
import { Pool } from 'pg';

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

export const buildConnection = () => pool.connect();
export const releaseConnection = connection => connection.release();
export const withinConnection = (connectionOrFn, fnOrUndefined) => {
  const connectionGiven = !!fnOrUndefined;
  const fn = connectionGiven ? fnOrUndefined : connectionOrFn;
  const con = connectionGiven ? connectionOrFn : undefined;
  let connection;

  return Promise.resolve()
    .then(() => con || buildConnection())
    .then((c) => { connection = c; })
    .then(() => fn({ connection }))
    .then((ignoreReturnFor(() => releaseConnection(connection))))
    .catch((rethrowError(() => releaseConnection(connection))));
};
