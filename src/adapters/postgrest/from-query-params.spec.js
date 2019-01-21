import { assertThat, equalTo } from 'hamjest';
import { q, where, limit, order, asc, desc, offset } from '../../index';
import camelcase from 'camelcase';
import qs from 'qs';

const parseOrderOptions = (options) => {
    if (options === 'nullsfirst') { return { nulls: 'first' }; }
    else if (options === 'nullslast') { return { nulls: 'last' }; }
    return {};
}

const parseOrder = (orderParams) => {
    if (!orderParams) { return; }
    const operators = orderParams.split(',').map((orderParam) => {
        const [ property, direction, options ] = orderParam.split('.');
        const ops = parseOrderOptions(options);
        return direction === 'desc'
            ? desc(camelcase(property), ops)
            : asc(camelcase(property), ops)

    });
    return order(...operators);
}

const parseLimit = (queryParam) => {
    if (!queryParam) { return; }
    return limit(parseInt(queryParam));
}

const parseOffset = (queryParam) => {
    if (!queryParam) { return; }
    return offset(parseInt(queryParam));
}

const toQueryFromString = (queryString) => {
    const queryParams = qs.parse(queryString);
    const order = parseOrder(queryParams.order); 
    const limit = parseLimit(queryParams.limit);
    const offset = parseOffset(queryParams.offset);
    return q(order, limit, offset);
}

describe.only('toQueryFromString', () => {
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
        
    ].forEach(({ object, queryParam }) => {
        it(`${queryParam}`, () => {
            assertThat(toQueryFromString(queryParam), equalTo(object));
        });
    })
});