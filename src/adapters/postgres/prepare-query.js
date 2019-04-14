import { oneLine } from 'common-tags';

const toKeyValueArray = object => Object.keys(object)
  .map((key, index) => ({ key, value: object[key], index }));

const prepareQuery = ({ statement, values }) => {
  const keyValueArray = toKeyValueArray(values || {});
  const valuesToReturn = [];
  const prepared = keyValueArray.reduce((result, property) => {
    const index = valuesToReturn.length + 1;
    const nextQuery = result.replace(new RegExp(`\\$${property.key}`, 'gi'), `$${index}`);
    if (nextQuery !== result) { valuesToReturn.push(property.value); }
    return nextQuery;
  }, statement);

  return { text: oneLine(prepared), values: valuesToReturn };
};

export default prepareQuery;
