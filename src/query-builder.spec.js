import { assertThat, hasProperty, hasProperties } from 'hamjest';
import { eq, asc, desc } from './operators';
import {
  q, where, order, limit, offset,
} from './query-builder';

it('handles where correctly', () => {
  const query = q(where({ test: eq(1) }));
  assertThat(query, hasProperty('where', { test: eq(1) }));
});

it('handles offset correctly', () => {
  const query = q(offset(5));
  assertThat(query, hasProperty('offset', 5));
});

it('handles limit correctly', () => {
  const query = q(limit(5));
  assertThat(query, hasProperty('limit', 5));
});

it('handles multiple wheres correctly', () => {
  const query = q(
    where({ property1: eq(1) }),
    where({ property2: eq(2) }),
  );
  assertThat(query, hasProperty('where', { property1: eq(1), property2: eq(2) }));
});

it('handles order correctly', () => {
  const query = q(order(asc('property')));
  assertThat(query, hasProperty('order', [asc('property')]));
});

it('handles multiple order clauses correctly', () => {
  const query = q(
    order(asc('property1')),
    order(asc('property2')),
    order(desc('property1')),
  );
  assertThat(query, hasProperty('order', [asc('property2'), desc('property1')]));
});

it('multiple queries are flattened', () => {
  const query = q(
    where({ property1: eq(1) }),
    q(order(asc('property1'))),
  );
  assertThat(query, hasProperties({
    order: [asc('property1')],
    where: { property1: eq(1) },
  }));
});
