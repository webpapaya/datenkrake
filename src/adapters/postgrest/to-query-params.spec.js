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
} from './to-query-params';

describe('buildQueryParams', () => {
  [
    { object: null, queryParam: '' },
    { object: undefined, queryParam: '' },
    { object: q(order(asc('property'))), queryParam: 'order=property.asc' },
    { object: q(order(asc('camelCase'))), queryParam: 'order=camel_case.asc' },
    { object: q(where({ property: eq(1) })), queryParam: 'property=eq.1' },
    { object: q(limit(1)), queryParam: 'limit=1' },
    { object: q(offset(1)), queryParam: 'offset=1' },
    {
      queryParam: 'property=eq.1&order=property.asc',
      object: q(
        order(asc('property')),
        where({ property: eq(1) }),
      ),
    },
  ].forEach(({ object, queryParam }) => {
    it(`${object} queryParams in ${queryParam}`, () => {
      assertThat(buildQueryParams(object), equalTo(queryParam));
    });
  });
});

describe('buildQueryParamsForWhere', () => {
  [
    { object: {}, queryParam: '' },
    { object: { prop: eq(1) }, queryParam: 'prop=eq.1' },
    { object: { prop: eq(null) }, queryParam: 'prop=is.null' },
    { object: { camelCase: eq(1) }, queryParam: 'camel_case=eq.1' },

    { object: { prop: oneOf() }, queryParam: 'prop=in.()' },
    { object: { prop: oneOf(1, 2, 3) }, queryParam: 'prop=in.(1,2,3)' },
    { object: { prop: oneOf('Sepp', 'Huber') }, queryParam: 'prop=in.("Sepp","Huber")' },
    { object: { prop: gt(1) }, queryParam: 'prop=gt.1' },
    { object: { prop: gte(1) }, queryParam: 'prop=gte.1' },
    { object: { prop: like('%first%last') }, queryParam: 'prop=like.*first*last' },

    { object: { prop: like('%first%last', { caseSensitive: false }) }, queryParam: 'prop=ilike.*first*last' },
    { object: { prop: like('%first%last', { caseSensitive: true }) }, queryParam: 'prop=like.*first*last' },

    { object: { prop: lt(1) }, queryParam: 'prop=lt.1' },
    { object: { prop: lte(1) }, queryParam: 'prop=lte.1' },
    { object: { prop: not(eq(1)) }, queryParam: 'prop=not.eq.1' },
    { object: { prop1: eq(1), prop2: eq(2) }, queryParam: 'prop1=eq.1&prop2=eq.2' },

    { object: { prop: { operator: 'unknown', value: 1 } }, queryParam: '' },
  ].forEach(({ object, queryParam }) => {
    it(`${JSON.stringify(object)} queryParams in ${queryParam}`, () => {
      assertThat(buildQueryParamsForWhere(object), equalTo(queryParam));
    });
  });
});

describe('buildQueryParamsForOrder', () => {
  [
    { object: [], queryParam: '' },
    { object: [asc('property')], queryParam: 'order=property.asc' },
    { object: [desc('property')], queryParam: 'order=property.desc' },
    { object: [asc('property1'), desc('property2')], queryParam: 'order=property1.asc,property2.desc' },
    { object: [asc('property', { nulls: 'first' })], queryParam: 'order=property.asc.nullsfirst' },
    { object: [asc('property', { nulls: 'last' })], queryParam: 'order=property.asc.nullslast' },
    { object: [desc('property', { nulls: 'first' })], queryParam: 'order=property.desc.nullsfirst' },
    { object: [desc('property', { nulls: 'last' })], queryParam: 'order=property.desc.nullslast' },
  ].forEach(({ object, queryParam }) => {
    it(`${JSON.stringify(object)} queryParams in ${queryParam}`, () => {
      assertThat(buildQueryParamsForOrder(object), equalTo(queryParam));
    });
  });
});

describe('buildQueryParamsForLimit', () => {
  [
    { object: undefined, queryParam: '' },
    { object: null, queryParam: '' },
    { object: 1, queryParam: 'limit=1' },
  ].forEach(({ object, queryParam }) => {
    it(`${JSON.stringify(order)} queryParams in ${queryParam}`, () => {
      assertThat(buildQueryParamsForLimit(object), equalTo(queryParam));
    });
  });
});

describe('buildQueryParamsForOffset', () => {
  [
    { object: undefined, queryParam: '' },
    { object: null, queryParam: '' },
    { object: 1, queryParam: 'offset=1' },
  ].forEach(({ object, queryParam }) => {
    it(`${JSON.stringify(order)} queryParams in ${queryParam}`, () => {
      assertThat(buildQueryParamsForOffset(object), equalTo(queryParam));
    });
  });
});
