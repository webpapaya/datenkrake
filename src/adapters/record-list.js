class RecordList extends Array {
  constructor(items, options = {}) {
    super(...items);
    this.options = options;
  }
}

export const toRecordList = (items, options) => {
  return new RecordList(items, options);
}

export default toRecordList;