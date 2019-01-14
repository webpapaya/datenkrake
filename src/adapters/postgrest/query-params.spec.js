import { assertThat, equalTo } from 'hamjest';
import {
	eq,
	oneOf,
	gt,
	gte,
	lt,
	lte,
	not,
	like,
	asc,
	desc,
} from '../../operators';

import {
	q, where, order, limit, offset,
} from '../../query-builder';
import buildQueryParams, {
	buildQueryParamsForWhere,
	buildQueryParamsForOrder,
	buildQueryParamsForLimit,
	buildQueryParamsForOffset,
} from './query-params';

describe('buildQueryParams', () => {
	[
		{ input: null, result: '' },
		{ input: undefined, result: '' },
		{ input: q(order(asc('property'))), result: '?order=property.asc' },
		{ input: q(order(asc('camelCase'))), result: '?order=camel_case.asc' },
		{ input: q(where({ property: eq(1) })), result: '?property=eq.1' },
		{ input: q(limit(1)), result: '?limit=1' },
		{ input: q(offset(1)), result: '?offset=1' },
		{
			result: '?property=eq.1&order=property.asc',
			input: q(
				order(asc('property')),
				where({ property: eq(1) }),
			),
		},
	].forEach(({ input, result }) => {
		it(`${input} results in ${result}`, () => {
			assertThat(buildQueryParams(input), equalTo(result));
		});
	});
});

describe('buildQueryParamsForWhere', () => {
	[
		{ input: {}, result: '' },
		{ input: { prop: eq(1) }, result: 'prop=eq.1' },
		{ input: { prop: eq(null) }, result: 'prop=is.null' },
		{ input: { camelCase: eq(1) }, result: 'camel_case=eq.1' },

		{ input: { prop: oneOf() }, result: 'prop=in.()' },
		{ input: { prop: oneOf(1, 2, 3) }, result: 'prop=in.(1,2,3)' },
		{ input: { prop: oneOf('Sepp', 'Huber') }, result: 'prop=in.("Sepp","Huber")' },
		{ input: { prop: gt(1) }, result: 'prop=gt.1' },
		{ input: { prop: gte(1) }, result: 'prop=gte.1' },
		{ input: { prop: like('%first%last') }, result: 'prop=like.*first*last' },

		{ input: { prop: like('%first%last', { caseSensitive: false }) }, result: 'prop=ilike.*first*last' },
		{ input: { prop: like('%first%last', { caseSensitive: true }) }, result: 'prop=like.*first*last' },

		{ input: { prop: lt(1) }, result: 'prop=lt.1' },
		{ input: { prop: lte(1) }, result: 'prop=lte.1' },
		{ input: { prop: not(eq(1)) }, result: 'prop=not.eq.1' },
		{ input: { prop1: eq(1), prop2: eq(2) }, result: 'prop1=eq.1&prop2=eq.2' },

		{ input: { prop: { operator: 'unknown', value: 1 } }, result: '' },
	].forEach(({ input, result }) => {
		it(`${JSON.stringify(input)} results in ${result}`, () => {
			assertThat(buildQueryParamsForWhere(input), equalTo(result));
		});
	});
});

describe('buildQueryParamsForOrder', () => {
	[
		{ input: [], result: '' },
		{ input: [asc('property')], result: 'order=property.asc' },
		{ input: [desc('property')], result: 'order=property.desc' },
		{ input: [asc('property1'), desc('property2')], result: 'order=property1.asc,property2.desc' },
		{ input: [asc('property', { nulls: 'first' })], result: 'order=property.asc.nullsfirst' },
		{ input: [asc('property', { nulls: 'last' })], result: 'order=property.asc.nullslast' },
		{ input: [desc('property', { nulls: 'first' })], result: 'order=property.desc.nullsfirst' },
		{ input: [desc('property', { nulls: 'last' })], result: 'order=property.desc.nullslast' },
	].forEach(({ input, result }) => {
		it(`${JSON.stringify(input)} results in ${result}`, () => {
			assertThat(buildQueryParamsForOrder(input), equalTo(result));
		});
	});
});

describe('buildQueryParamsForLimit', () => {
	[
		{ input: undefined, result: '' },
		{ input: null, result: '' },
		{ input: 1, result: 'limit=1' },
	].forEach(({ input, result }) => {
		it(`${JSON.stringify(order)} results in ${result}`, () => {
			assertThat(buildQueryParamsForLimit(input), equalTo(result));
		});
	});
});

describe('buildQueryParamsForOffset', () => {
	[
		{ input: undefined, result: '' },
		{ input: null, result: '' },
		{ input: 1, result: 'offset=1' },
	].forEach(({ input, result }) => {
		it(`${JSON.stringify(order)} results in ${result}`, () => {
			assertThat(buildQueryParamsForOffset(input), equalTo(result));
		});
	});
});
