class RecordList extends Array {
  constructor(items, options = {}) {
    super(...items);
    this.total = options.total;
    this.limit = options.limit || items.length;
    this.offset = options.offset || 0;
  }
  static get [Symbol.species]() {
    return Array;
  }
}

export const toRecordList = (items, options) => new RecordList(items, options);

export default toRecordList;
