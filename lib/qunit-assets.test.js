import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { qunitAssets, qunitScript } from './qunit-assets.js';

const legacyScript = new URL(
    '../public/javascripts/vendor/qunit-2.0.1.js',
    import.meta.url
);

for (const [version, script] of [
    ['2.0.1', legacyScript],
    ['3.0.0', qunitAssets[qunitScript]]
]) {
    test(`QUnit ${version} safely parses query parameter names`, async () => {
        const dom = new JSDOM('<div id="qunit-fixture"></div>', {
            runScripts: 'outside-only',
            url: 'http://localhost/?%5F%5Fproto%5F%5F=first&__proto__=second&' +
                'constructor=literal&toString=text&empty=&empty=second&' +
                'repeat=one&repeat=two&flag&greeting=hello+world%21'
        });
        const { window } = dom;
        try {
            window.scrollTo = () => {};
            window.eval(readFileSync(script, 'utf8'));
            const { QUnit } = window;
            QUnit.config.autostart = false;

            assert.equal(QUnit.version, version);
            assert.equal(Object.getPrototypeOf(QUnit.urlParams), null);
            assert.deepEqual(JSON.parse(JSON.stringify(QUnit.urlParams)), {
                ['__proto__']: ['first', 'second'],
                constructor: 'literal',
                toString: 'text',
                empty: ['', 'second'],
                repeat: ['one', 'two'],
                flag: true,
                greeting: 'hello world!'
            });
            assert.deepEqual(Object.keys(window.Object.prototype), []);

            const finished = new Promise(resolve => QUnit.done(resolve));
            QUnit.test('ordinary assertions still run', assert => assert.ok(true));
            QUnit.start();
            const { passed, failed } = await finished;
            assert.deepEqual({ passed, failed }, { passed: 1, failed: 0 });
        } finally {
            window.close();
        }
    });
}
