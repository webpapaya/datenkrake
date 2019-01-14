import { filterByQuery } from '../../selectors';

const promisify = (object) => Object.keys(object).reduce((result, key) => {
	result[key] = (...args) => Promise.resolve(object[key](...args))
	return result;
}, {});

const buildRepository = ({ resource }) => {
	const persist = (connection, records) => {
		connection[resource] = records; // eslint-disable-line no-param-reassign
	};

	const where = (connection, query) => {
		const records = connection[resource];
		return filterByQuery(query, records);
	};

	const destroy = (connection, query) => {
		const destroyedRecords = where(connection, query);
		persist(connection, connection[resource].filter(record => !destroyedRecords.includes(record)));
		return destroyedRecords;
	};

	const create = (connection, record) => {
		persist(connection, [...connection[resource], record]);
		return record;
	};

	const update = (connection, query, values) => {
		const recordsToUpdate = where(connection, query);
		const recordsToReturn = [];

		// There is room for performance improvements here =)
		const nextRecords = connection[resource].map((record) => {
			if (!recordsToUpdate.includes(record)) { return record; }
			const updatedRecord = { ...record, ...values };
			recordsToReturn.push(updatedRecord);
			return updatedRecord;
		});
		persist(connection, nextRecords);
		return recordsToReturn;
	};

	const count = (connection, query) => where(connection, query).length;

	return promisify({
		count,
		where,
		create,
		destroy,
		update,
	});
};

export default buildRepository;
