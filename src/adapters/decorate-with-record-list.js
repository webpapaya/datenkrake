import { toRecordList } from './record-list';


const decorateWithRecordList = buildReporitoryFn => (...args) => {
  const repository = buildReporitoryFn(...args);

  return {
    ...repository,

    update: (connection, query, record) => repository.update(connection, query, record)
      .then(records => toRecordList(records, {
        total: records.length,
        limit: (query || {}).limit,
        offset: (query || {}).offset,
      })),

    destroy: (connection, query) => repository.destroy(connection, query)
      .then(records => toRecordList(records, {
        total: records.length,
        limit: (query || {}).limit,
        offset: (query || {}).offset,
      })),

    where: (connection, query) => Promise.all([
      repository.where(connection, query),
      repository.count(connection, { ...query, limit: undefined, offset: 0 }),
    ]).then(([records, total]) => toRecordList(records, {
      total,
      limit: (query || {}).limit,
      offset: (query || {}).offset,
    })),
  };
};

export default decorateWithRecordList;
