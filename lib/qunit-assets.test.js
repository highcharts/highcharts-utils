import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { qunitAssets, qunitScript } from './qunit-assets.js';

const legacyScript = new URL(
    '../public/javascripts/vendor/qunit-2.0.1.js',
    import.meta.url
);
const assertionPlugin = readFileSync(new URL(
    '../public/javascripts/qunit-plugins.js',
    import.meta.url
), 'utf8');

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

    test(`QUnit ${version} reports custom assertion source lines`, async () => {
        const dom = new JSDOM('', { runScripts: 'outside-only' });
        const { window } = dom;
        try {
            window.scrollTo = () => {};
            window.eval(readFileSync(script, 'utf8'));
            const { QUnit } = window;
            QUnit.config.autostart = false;
            window.eval(assertionPlugin);
            await new Promise(resolve => {
                window.document.addEventListener('DOMContentLoaded', resolve);
            });

            const sources = [];
            QUnit.log(({ source }) => sources.push(source?.split('\n')[0]));
            window.eval([
                `QUnit.test('custom assertions', assert => {`,
                '    assert.close(1, 3, 0.1);',
                '    assert.lessThan(3, 2);',
                '    assert.greaterThan(1, 2);',
                '});',
                '//# sourceURL=custom-assertions-sample.js'
            ].join('\n'));
            const done = new Promise(resolve => QUnit.done(resolve));
            QUnit.start();
            assert.equal((await done).failed, 3);
            assert.equal(sources.length, 3);
            for (const [index, source] of sources.entries()) {
                assert.match(source, new RegExp(
                    `custom-assertions-sample\\.js:${index + 2}:\\d+`
                ));
            }
        } finally {
            window.close();
        }
    });
}

test('a filtered QUnit rerun preserves the full sample comparison', async () => {
    const compare = readFileSync(new URL(
        '../public/javascripts/compare-iframe.js', import.meta.url
    ), 'utf8');
    const script = readFileSync(qunitAssets[qunitScript], 'utf8');
    const reports = [];
    async function run(url) {
        const dom = new JSDOM('<div id="qunit"></div>', {
            runScripts: 'outside-only', url
        });
        const { window } = dom;
        try {
            window.scrollTo = () => {};
            window.Highcharts = { version: 'test' };
            window.controller = { getQueryParameters: () => ({ which: 'right' }) };
            window.onDifferent = result => reports.push(result);
            window.onIdentical = () => reports.push(0);
            window.eval(script);
            window.eval(compare);
            window.compareHTML();
            const { QUnit } = window;
            QUnit.config.autostart = false;
            QUnit.test('passes', assert => assert.ok(true));
            QUnit.test('fails', assert => assert.ok(false));
            const done = new Promise(resolve => QUnit.done(resolve));
            QUnit.start();
            const { total } = await done;
            const rerun = window.document.querySelector('#qunit-testresult-display a');
            return { total, url: rerun?.href };
        } finally {
            window.close();
        }
    }

    const full = await run('http://localhost/?which=right&hidepassed');
    assert.equal(full.total, 2);
    assert.deepEqual(reports, ['1/2']);
    assert.ok(new URL(full.url).searchParams.has('testId'));
    assert.equal((await run(full.url)).total, 1);
    assert.deepEqual(reports, ['1/2']);
});
