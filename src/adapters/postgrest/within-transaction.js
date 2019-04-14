import { rethrowError } from 'promise-frites';
import { withinConnection } from './connection';

const withinTransaction = (connectionOrFn, fnOrUndefined) => {
  const connectionGiven = !!fnOrUndefined;
  const fn = connectionGiven ? fnOrUndefined : connectionOrFn;
  const connectionMaybe = connectionGiven ? connectionOrFn : undefined;

  return withinConnection(connectionMaybe, ({ connection }) => {
    const commit = () => {};
    const rollback = () => {};

    return Promise.resolve()
      .then(() => fn({ connection, commit, rollback }))
      .catch(rethrowError(() => rollback()));
  });
};

export default withinTransaction;
