import { isEmpty } from 'ramda'
const OPERATORS = {
    eq: (property, value) =>  `${property} = ${value}`,
    lt: (property, value) => `${property} < ${value}`,
    lte: (property, value) => `${property} <= ${value}`,
    gt: (property, value) => `${property} > ${value}`,
    gte: (property, value) => `${property} >= ${value}`,
    oneOf: (property, values) => `${property} IN (${values.join(',')})`,
    like: (property, value) => `${property} like '${value}'`
}

const toSqlString = (property, definition) => {
    const operator = OPERATORS[definition.operator];
    return operator(property, definition.value);
}

const definitionToStatement = (result, property, where) => {
    const definition = where[property];

    if (definition.operator === 'not') {
        result.push(`NOT (${toSqlString(property, definition.value)})`)
    } else {
        result.push(toSqlString(property, definition))
    }

    return result;
}

const queryToSql = (query) => {
    const where = (query || {}).where || {};
    const sqlWhereClause = Object.keys(where).reduce((result, property) => {
        return definitionToStatement(result, property, where);
    }, []);
    
    return sqlWhereClause.length > 0 
        ? `WHERE ${sqlWhereClause.join(' AND ')}`
        : '';
}


const extractDirection = ({ operator }) =>
    operator === 'desc' ? 'DESC' : 'ASC';

const extractNulls = ({ options }) =>
    options.nulls === 'first' ? 'NULLS FIRST' : 'NULLS LAST';

const orderToSql = (query = {}) => {
    const order = query.order || [];
    const orderStatement = order.map(({ operator, value, options }) => {
        const direction = extractDirection({ operator });
        const nulls = extractNulls({ options });
        return `${value} ${direction} ${nulls}`;
    }).join(', ');

    return isEmpty(orderStatement) ? '' : `ORDER BY ${orderStatement}`; 
}


export const buildRepository = ({ resource }) => {
    const where = (connection, filter = {}) => {
        
        const query = {
            text: `
                SELECT * FROM ${resource}
                 ${queryToSql(filter)}
                 ${orderToSql(filter)};
            `,
        };

        return connection.query(query)
            .then(result => result.rows);
    }

    const create = (connection, record) => {
        const query = {
            text: `
                INSERT INTO ${resource} (${Object.keys(record).join(', ')}) 
                VALUES (${Object.keys(record).map((_, index) => `$${index + 1}`).join(',')})
                RETURNING *;
            `,
            values: Object.values(record),
        };

        return connection.query(query)
            .then(result => result.rows[0]);
    }

    const count = (connection, filter) => {
        const query = {
            text: `
                SELECT count(*) as count 
                FROM ${resource}
                ${queryToSql(filter)};
            `,
        };

        return connection.query(query)
            .then((result) => parseInt(result.rows[0].count, 10));
    }

    const update = (connection, filter, record = {}) => {
        if (Object.keys(record).length === 0) return where(connection, filter);
        const query = {
            text: `
                UPDATE ${resource}
                SET ${Object.keys(record).map((key,index) => `${key}=$${index+1}`).join(', ')}
                ${queryToSql(filter)}
                RETURNING *;
            `,
            values: Object.values(record),
        };

        return connection.query(query)
            .then(result => result.rows);

    }

    const destroy = (connection, filter) => {
        const query = {
            text: `
                DELETE 
                FROM ${resource}
                ${queryToSql(filter)}
                RETURNING *;
            `,
        };

        return connection.query(query)
            .then(result => result.rows);
    }

    return { 
        update,
        where,
        count,
        create,
        destroy,
    }
}

export { buildConnection, releaseConnection } from './connection';
export { default as withinTransaction } from './within-transaction'; 