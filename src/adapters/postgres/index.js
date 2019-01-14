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
        queryToSql(filter)
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

    const count = (connection) => {
        const query = {
            text: `
                SELECT count(*) as count 
                FROM ${resource} 
            `,
        };

        return connection.query(query)
            .then((result) => parseInt(result.rows[0].count, 10));
    }

    return { 
        where,
        count,
        create
    }
}