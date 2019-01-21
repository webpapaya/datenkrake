const appendOperator = (result, definition) => {
  if (!definition) { return result; }
  /* eslint-disable no-param-reassign */
  if (definition.operator === 'where') {
    result.where = { ...result.where, ...definition.value };
  } else if (definition.operator === 'order') {
    const nextOrderProps = definition.value.map(v => v.value);
    const order = result.order.filter(o => !nextOrderProps.includes(o.value));
    result.order = [...order, ...definition.value];
  } else if (definition.operator === 'limit' && definition.value !== undefined) {
    result.limit = definition.value;
  } else if (definition.operator === 'offset' && definition.value !== undefined) {
    result.offset = definition.value;
  } else if (definition.operator === 'query') {
    Object.keys(definition).forEach((key) => {
      appendOperator(result, { operator: key, value: definition[key] });
    });
  }
  return result;
};

export const q = (...actions) => {
  const defaultQuery = {
    order: [],
    where: {},
    operator: 'query',
    limit: undefined,
    offset: undefined,
  };

  return actions.reduce(appendOperator, defaultQuery);
};

export const where = value => ({ operator: 'where', value });
export const order = (...value) => ({ operator: 'order', value });
export const limit = value => ({ operator: 'limit', value });
export const offset = value => ({ operator: 'offset', value });
