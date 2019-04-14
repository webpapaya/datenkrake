import camelCaseKeys from 'camelcase-keys-deep';
import decamelCaseKeys from 'decamelize-keys-deep';
import decamelize from 'decamelize';
import buildQueryParams from './to-query-params';
import decorateWithRecordList from '../decorate-with-record-list';

const REQUESTED_RANGE_NOT_SATISFIABLE = 416;

const requiredParam = (name) => { throw Error(`${name} is a required parameter`); };
const parseContentRange = (contentRange) => {
  const [range, total] = contentRange.split('/');
  const [from, to] = range.split('-');
  return {
    total: parseInt(total || to, 10),
    from: parseInt(from, 10),
    to: parseInt(to, 10),
  };
};

const parseTotal = response =>
  parseContentRange(response.headers['content-range']).total;

const buildRepository = decorateWithRecordList(({
  resource = requiredParam('path'),
  limit = 25,
}) => {
  const url = `${decamelize(resource)}`;

  const create = (connection, values) => Promise.resolve()
    .then(() => connection.post(url, decamelCaseKeys(values)))
    .then(response => camelCaseKeys(response.data[0]));

  const where = (connection, filter = {}) => {
    const hasPaginationOverwritten = filter.limit !== undefined || filter.offset !== undefined;
    const queryString = buildQueryParams(filter);
    const headers = hasPaginationOverwritten ? {} : { Range: `0-${limit - 1}` };

    return Promise.resolve()
      .then(() => connection.get(`${url}?${queryString}`, { headers }))
      .then(response => camelCaseKeys(response.data))
      .catch((result) => {
        if (result.response.status === REQUESTED_RANGE_NOT_SATISFIABLE) {
          return [];
        }
        throw result;
      });
  };

  const update = (connection, filter, values = {}) => Promise.resolve()
    .then(() => connection.patch(`${url}?${buildQueryParams(filter)}`, decamelCaseKeys(values)))
    .then(response => camelCaseKeys(response.data));

  const destroy = (connection, filter) => Promise.resolve()
    .then(() => connection.delete(`${url}?${buildQueryParams(filter)}`))
    .then(response => camelCaseKeys(response.data));

  const count = (connection, filter = {}) => Promise.resolve()
    .then(() => connection.get(`${url}?${buildQueryParams({ ...filter, limit: 1 })}`))
    .then(response => parseTotal(response));

  return {
    create,
    where,
    update,
    destroy,
    count,
  };
});

export default buildRepository;
