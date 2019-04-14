import { rethrowError, ignoreReturnFor } from 'promise-frites';

const noop = () => ({});

export const buildConnection = noop;
export const releaseConnection = noop;
export const withinConnection = (con, fn) => {
  const connection = con || buildConnection();
  return Promise.resolve()
    .then(() => fn({ connection }))
    .then((ignoreReturnFor(() => releaseConnection(connection))))
    .catch((rethrowError(() => releaseConnection(connection))));
};
