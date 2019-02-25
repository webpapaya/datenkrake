import { isEmpty } from 'ramda';
import { oneLine as sql } from 'common-tags';
import RecordList from '../../record-list';

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

const queryToSql = (query) => {
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


export const buildRepository = ({ resource }) => {
  const count = (connection, filter) => connection.query({
    text: sql`
                SELECT count(*) as count 
                FROM ${resource}
                ${queryToSql(filter)};
            `,
  }).then(result => parseInt(result.rows[0].count, 10));


  const where = (connection, filter = {}) => Promise.all([
    connection.query({
      text: sql`
                SELECT *
                FROM ${resource}
                ${queryToSql(filter)}
                ${orderToSql(filter)};
            `,
    }),
    count(connection, filter),
  ]).then(([result, total]) => {
    const records = result.rows;
    const meta = { total, length: records.length };

    return new RecordList({ meta, records });
  });


  const create = (connection, record) => {
    const recordAsArray = toKeyValueArray(record);
    const columns = recordAsArray.map(({ key }) => key);
    const chunks = recordAsArray.map(({ index }) => `$${index + 1}`);
    const values = recordAsArray.map(({ value }) => value);

    return connection.query({
      text: sql`
                INSERT INTO ${resource} (${columns.join(', ')})
                VALUES (${chunks.join(',')})
                RETURNING *;
            `,
      values,
    }).then(result => result.rows[0]);
  };


  const update = (connection, filter, record = {}) => {
    if (isEmpty(record)) return where(connection, filter);

    const recordAsArray = toKeyValueArray(record);
    const chunks = recordAsArray.map(({ key, index }) => `${key}=$${index + 1}`);
    const values = recordAsArray.map(({ value }) => value);

    return Promise.all([
      connection.query({
        values,
        text: sql`
                  UPDATE ${resource}
                  SET ${chunks.join(', ')}
                  ${queryToSql(filter)}
                  RETURNING *;
              `,
      }),
      count(connection, filter),
    ]).then(([result, total]) => {
      const records = result.rows;
      const meta = { total, length: records.length };

      return new RecordList({ meta, records });
    });
  };

  const destroy = (connection, filter) => connection.query({
    text: sql`
                DELETE 
                FROM ${resource}
                ${queryToSql(filter)}
                RETURNING *;
            `,
  }).then((result) => {
    const records = result.rows;
    const meta = { total: 0, length: records.length };
    return new RecordList({ records, meta });
  });

  return {
    update,
    where,
    count,
    create,
    destroy,
  };
};

export { buildConnection, releaseConnection } from './connection';
export { default as withinTransaction } from './within-transaction';
