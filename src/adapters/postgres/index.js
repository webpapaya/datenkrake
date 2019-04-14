import { isEmpty } from 'ramda';
import { oneLine as sql } from 'common-tags';
import decorateWithRecordList from '../decorate-with-record-list';
import prepareQuery from './prepare-query';

const toKeyValueArray = object => Object.keys(object)
  .map((key, index) => ({ key, value: object[key], index }));

const OPERATORS = {
  eq: (property, value) => `${property} = ${value}`,
  lt: (property, value) => `${property} < ${value}`,
  lte: (property, value) => `${property} <= ${value}`,
  gt: (property, value) => `${property} > ${value}`,
  gte: (property, value) => `${property} >= ${value}`,
  oneOf: (property, values) => `${property} IN (${values.join(',')})`,
  like: (property, value) => `${property} like '${value}'`,
};

const toSqlString = (property, definition) => {
  const operator = OPERATORS[definition.operator];
  return operator(property, definition.value);
};

const definitionToStatement = (result, property, where) => {
  const definition = where[property];

  if (definition.operator === 'not') {
    result.push(`NOT (${toSqlString(property, definition.value)})`);
  } else {
    result.push(toSqlString(property, definition));
  }

  return result;
};

const filterToSql = (query) => {
  const where = (query || {}).where || {};
  const sqlWhereClause = Object.keys(where)
    .reduce((result, property) => definitionToStatement(result, property, where), []);

  return sqlWhereClause.length > 0
    ? `WHERE ${sqlWhereClause.join(' AND ')}`
    : '';
};

const extractDirection = ({ operator }) =>
  (operator === 'desc' ? 'DESC' : 'ASC');

const extractNulls = ({ options }) =>
  (options.nulls === 'first' ? 'NULLS FIRST' : 'NULLS LAST');

const orderToSql = (query = {}) => {
  const order = query.order || [];
  const orderStatement = order.map(({ operator, value, options }) => {
    const direction = extractDirection({ operator });
    const nulls = extractNulls({ options });
    return `${value} ${direction} ${nulls}`;
  }).join(', ');

  return isEmpty(orderStatement) ? '' : `ORDER BY ${orderStatement}`;
};

const paginationToSql = (query = {}) => `
    ${query.limit ? 'LIMIT $limit' : ''}
    ${query.offset ? 'OFFSET $offset' : ''}
  `;

export const buildRepository = decorateWithRecordList(({ resource }) => {
  const count = (connection, filter) => {
    const query = sql`
      SELECT count(*) as count
      FROM ${resource}
      ${filterToSql(filter)};
    `;

    return connection.query({ text: query })
      .then(result => parseInt(result.rows[0].count, 10));
  }

  const where = async (connection, filter = {}) => {
    const statement = sql`
      SELECT *
      FROM ${resource}
      ${filterToSql(filter)}
      ${orderToSql(filter)}
      ${paginationToSql(filter)};
    `;

    return connection.query(prepareQuery({ statement, values: filter }))
      .then((result) => result.rows);
  };

  const create = (connection, record) => {
    const recordAsArray = toKeyValueArray(record);
    const columns = recordAsArray.map(({ key }) => key);
    const chunks = recordAsArray.map(({ index }) => `$${index + 1}`);
    const values = recordAsArray.map(({ value }) => value);

    const statement = sql`
      INSERT INTO ${resource} (${columns.join(', ')})
      VALUES (${chunks.join(',')})
      RETURNING *;
    `;

    return connection.query({ text: statement, values })
      .then(result => result.rows[0]);
  };

  const update = (connection, filter, record = {}) => {
    if (isEmpty(record)) return where(connection, filter);
    const chunks = Object.keys(record).map((key) => `${key}=$${key}`);

    const statement = sql`
      UPDATE ${resource}
      SET ${chunks.join(', ')}
      ${filterToSql(filter)}
      RETURNING *;
    `;

    return connection.query(prepareQuery({ statement, values: { ...filter, ...record } }))
      .then(result => result.rows);
  };

  const destroy = (connection, filter) => {
    const statement = sql`
      DELETE
      FROM ${resource}
      ${filterToSql(filter)}
      RETURNING *;
    `;

    return connection.query(prepareQuery({ statement, values: filter }))
      .then(result => result.rows);
  };

  return {
    update,
    where,
    count,
    create,
    destroy,
  };
});

export { buildConnection, releaseConnection, withinConnection } from './connection';
export { default as withinTransaction } from './within-transaction';
