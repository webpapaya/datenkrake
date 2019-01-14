const buildOperator = (operator, defaultOptions = {}) => (value, operatorOptions = {}) => {
	const options = { ...defaultOptions, ...operatorOptions };
	return { operator, value, options };
};

export const eq = buildOperator('eq');
export const gt = buildOperator('gt');
export const gte = buildOperator('gte');
export const lt = buildOperator('lt');
export const lte = buildOperator('lte');
export const not = buildOperator('not');
export const and = (...value) => ({ operator: 'and', value, options: {} });
export const like = buildOperator('like', { caseSensitive: true });
export const oneOf = (...value) => ({ operator: 'oneOf', value, options: {} });

/* Possible options
 * nulls: 'first' | 'last' | null
 */
export const asc = buildOperator('asc', { nulls: null });
export const desc = buildOperator('desc', { nulls: null });
