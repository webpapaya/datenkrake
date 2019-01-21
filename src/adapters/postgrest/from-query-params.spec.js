import { assertThat, equalTo } from 'hamjest';
import { q, where, limit, order, asc, desc, offset, eq, gt, gte, lt, lte, oneOf } from '../../index';
import fromQueryParams from './from-query-params';

describe('fromQueryParams', () => {
    [
        { object: q(), queryParam: '' },
        { object: q(order(asc('property'))), queryParam: 'order=property.asc' },
        { object: q(order(asc('prop1'), desc('prop2'))), queryParam: 'order=prop1.asc,prop2.desc' },
        { object: q(order(asc('camelCase'))), queryParam: 'order=camel_case.asc' },
        { object: q(order(asc('property', { nulls: 'first' }))), queryParam: 'order=property.asc.nullsfirst' },
        { object: q(order(asc('property', { nulls: 'last' }))), queryParam: 'order=property.asc.nullslast' },
		{ object: q(order(desc('property', { nulls: 'first' }))), queryParam: 'order=property.desc.nullsfirst' },
        { object: q(order(desc('property', { nulls: 'last' }))), queryParam: 'order=property.desc.nullslast' },
        { object: q(limit(1)), queryParam: 'limit=1' },
        { object: q(offset(1)), queryParam: 'offset=1' },

        { object: q(where({ prop: oneOf() })), queryParam: 'prop=in.()' },

        { object: q(where({ prop: oneOf(1, 2, 3) })), queryParam: 'prop=in.(1,2,3)' },
		{ object: q(where({ prop: oneOf('Sepp', 'Huber') })), queryParam: 'prop=in.("Sepp","Huber")' },
        { object: q(where({ prop: eq(1) })), queryParam: 'prop=eq.1' },
        { object: q(where({ prop: eq(null) })), queryParam: 'prop=is.null' },
        { object: q(where({ prop: gt(1) })), queryParam: 'prop=gt.1' },
        { object: q(where({ prop: gte(1) })), queryParam: 'prop=gte.1' },
        { object: q(where({ prop: lt(1) })), queryParam: 'prop=lt.1' },
		{ object: q(where({ prop: lte(1) })), queryParam: 'prop=lte.1' },
		{ object: q(where({ prop1: eq(1), prop2: eq(2) })), queryParam: 'prop1=eq.1&prop2=eq.2' },
    ].forEach(({ object, queryParam }) => {
        it(`${queryParam}`, () => {
            assertThat(fromQueryParams(queryParam), equalTo(object));
        });
    })
});