import { rethrowError, ignoreReturnFor } from 'promise-frites';
import axios from 'axios';

const noop = () => ({});
export const buildConnection = ({ baseURL = 'http://localhost:3000' } = {}) => axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Prefer: 'return=representation,count=exact',
  },
});
export const releaseConnection = noop;

export const setAuthentication = (connection, token) => {
  connection.defaults.headers.Authorization = token // eslint-disable-line no-param-reassign
    ? `Bearer ${token}`
    : null;
};

export const unsetAuthentication = connection => setAuthentication(connection, null);
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
