import { rethrowError } from 'promise-frites';
import { withinConnection } from './connection';

const withinTransaction = (connectionOrFn, fnOrUndefined) => {
  const connectionGiven = !!fnOrUndefined;
  const fn = connectionGiven ? fnOrUndefined : connectionOrFn;
  const connectionMaybe = connectionGiven ? connectionOrFn : undefined;

  return withinConnection(connectionMaybe, ({ connection }) => {
    const safeState = JSON.parse(JSON.stringify(connection));
    const commit = () => connection;
    const rollback = () => Object.keys(safeState).reduce((con, key) => {
      if (!(key in safeState)) {
        delete con[key]; // eslint-disable-line no-param-reassign
      } else {
        con[key] = safeState[key]; // eslint-disable-line no-param-reassign
      }

      return con;
    }, {});

    return Promise.resolve()
      .then(() => fn({ connection, commit, rollback }))
      .catch(rethrowError(() => rollback()));
  });
};

export default withinTransaction;
