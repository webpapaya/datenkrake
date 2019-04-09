class RecordList extends Array {
  constructor(items, options = {}) {
    super(...items);
    this.options = options;
    this.total = options.total;
    this.limit = options.limit || items.length;
    this.offset = options.offset || 0;
  }
}

export const toRecordList = (items, options) => {
  return new RecordList(items, options);
}

export default toRecordList;