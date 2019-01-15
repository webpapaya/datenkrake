const OPERATORS = {
    eq: '=',
    lt: '<',
    lte: '<=',
    gt: '>',
    gte: '>='
}

const queryToSql = (query = {}) => {
    const where = query.where || {};
    const sqlWhereClause = Object.keys(where).reduce((result, property) => {
        const definition = where[property];
        const operator = OPERATORS[definition.operator];

        if (operator) {
            result.push(`${property} ${operator} ${definition.value}`)
        }

        return result;
    }, []);

    return sqlWhereClause.length > 0 
        ? `WHERE ${sqlWhereClause.join(' AND ')}`
        : '';
}


export const buildRepository = ({ resource }) => {
    const where = (connection, filter = {}) => {
        const query = {
            text: `
                SELECT * FROM ${resource}
                ${queryToSql(filter)};
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
        where,
        count,
        create,
        destroy,
    }
}

export { buildConnection, releaseConnection } from './connection';
export { default as withinTransaction } from './within-transaction'; 