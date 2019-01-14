import { lstatSync, readdirSync } from 'fs';
import { join } from 'path';
import { assertThat, hasProperty } from 'hamjest';

const isDirectory = source => lstatSync(source).isDirectory();
const getAdapters = source => readdirSync(source).reduce((result, name) => {
	if (isDirectory(join(source, name))) { result.push(name); }
	return result;
}, []);

getAdapters(__dirname).forEach((adapterName) => {
	describe(adapterName, () => {
		const adapter = require(`./${adapterName}`); // eslint-disable-line global-require, import/no-dynamic-require

		it('exposes buildRepository', () => {
			assertThat(adapter, hasProperty('buildRepository'));
		});

		it('exposes setAuthentication', () => {
			assertThat(adapter, hasProperty('setAuthentication'));
		});

		it('exposes unsetAuthentication', () => {
			assertThat(adapter, hasProperty('unsetAuthentication'));
		});

		it('exposes buildConnection', () => {
			assertThat(adapter, hasProperty('buildConnection'));
		});
	});
});
