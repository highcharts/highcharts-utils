import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const script = createRequire(import.meta.url).resolve('qunit');
const directory = dirname(script);
const { version } = JSON.parse(
    readFileSync(join(directory, '../package.json'), 'utf8')
);

export const qunitScript = `/javascripts/vendor/qunit-${version}.js`;
export const qunitStyle = `/stylesheets/vendor/qunit-${version}.css`;
export const qunitAssets = {
    [qunitScript]: script,
    [qunitStyle]: join(directory, 'qunit.css')
};
