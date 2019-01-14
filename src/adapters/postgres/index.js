
export const buildRepository = ({ resource }) => {
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

    return { 
        create
    }
}