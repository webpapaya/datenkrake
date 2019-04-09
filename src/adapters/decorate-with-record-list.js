import { toRecordList } from './record-list';

const decorateWithRecordList = (buildReporitoryFn) => (...args) => {
  const repository = buildReporitoryFn(...args);

  return {
    ...repository,

    update: (...args) => repository.update(...args)
      .then((records) => toRecordList(records, { total: records.length })),

    destroy: (...args) => repository.destroy(...args)
      .then((records) => toRecordList(records, { total: records.length })),

    where: (connection, query = {}) => Promise.all([
      repository.where(connection, query),
      repository.count(connection, {}),
    ]).then(([records, total]) => {
      return toRecordList(records, { total, limit: query.limit, offset: query.offset })
    })
  }
};

export default decorateWithRecordList;