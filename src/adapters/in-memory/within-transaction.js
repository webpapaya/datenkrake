import { rethrowError, ignoreReturnFor } from 'promise-frites';
import { buildConnection, releaseConnection } from './connection';

const withinConnection = (con, fn) => {
    let connection = con || buildConnection();
    return Promise.resolve()
        .then(() => fn({ connection }))
        .then((ignoreReturnFor(() => releaseConnection(connection))))
        .catch((rethrowError(() => releaseConnection(connection))));
};

const withinTransaction = (connectionOrFn, fnOrUndefined) => {
    const connectionGiven = !!fnOrUndefined;
    const fn = connectionGiven ? fnOrUndefined : connectionOrFn;
    const connectionMaybe = connectionGiven ? connectionOrFn : void 0;

    return withinConnection(connectionMaybe, ({ connection }) => {
        const safeState = JSON.parse(JSON.stringify(connection));
        const commit = () => connection;
        const rollback = () => Object.keys(safeState).reduce((connection, key) => {
            if (!key in safeState) { delete connection[key]; }
            else { connection[key] = safeState[key]; }
            return connection;
        }, {});
    
        return Promise.resolve()
            .then(() => fn({ connection, commit, rollback }))
            .catch(rethrowError(() => rollback()));
    });
};

export default withinTransaction;