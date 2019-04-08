import { toRecordList } from './record-list';

const decorateWithRecordList = (buildReporitoryFn) => (...args) => {
  const repository = buildReporitoryFn(...args);

  return {
    ...repository,

    update: (...args) => repository.update(...args)
      .then((records) => toRecordList(records, { total: records.length })),

    destroy: (...args) => repository.destroy(...args)
      .then((records) => toRecordList(records, { total: records.length })),

    where: (...args) => Promise.all([
      repository.where(...args),
      repository.count(...args),
    ]).then(([records, total]) => {
      return toRecordList(records, { total })
    })
  }
};

export default decorateWithRecordList;