class RecordList extends Array {
  constructor({ meta, records }) {
    super(...records);
    this.meta = meta;
  }
}

export default RecordList;
