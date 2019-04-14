import { rethrowError, ignoreReturnFor } from 'promise-frites';
import { withinConnection } from './connection';

const withinTransaction = (connectionOrFn, fnOrUndefined) => {
  const connectionGiven = !!fnOrUndefined;
  const fn = connectionGiven ? fnOrUndefined : connectionOrFn;
  const connectionMaybe = connectionGiven ? connectionOrFn : undefined;

  return withinConnection(connectionMaybe, ({ connection }) => {
    let released = false;
    const execute = (action) => {
      if (released) { return; }
      released = true;
      connection.query(action);
    };
    const commit = () => execute('COMMIT');
    const rollback = () => execute('ROLLBACK');

    return Promise.resolve()
      .then(() => connection.query('BEGIN'))
      .then(() => fn({ connection, commit, rollback }))
      .then(ignoreReturnFor(() => commit()))
      .catch(rethrowError(() => rollback()));
  });
};

export default withinTransaction;
