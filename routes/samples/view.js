/**
 * View a single sample.
 *
 * @todo
 * - Styled mode
 */

const express = require('express');
const router = express.Router();
const f = require('./../../lib/functions.js');
const fs = require('fs');
const { highchartsDir } = require('./../../lib/arguments.js');
const ip = require('ip');

const fsp = fs.promises;
const { join } = require('path');

const saveFiles = async (req) => {
    const fileName = req.body.save;

    if (typeof fileName === 'string') {
        await fsp.writeFile(
            join(highchartsDir, 'samples', req.query.path, fileName),
            req.body[fileName].replace(/\r\n/g, '\n')
        );
    }
}

const saveAsPath = async (req) => {
    const root = join(highchartsDir, 'samples'),
        path = req.body['save-as-path'],
        fullPath = join(root, path),
        fileNames = Object.keys(req.body)
            .filter(fileName => /[a-z\-]+\.[a-z]+/.test(fileName)),
        parts = path.split('/');

    if (!f.validPathRegex.test(path)) {
        return false;
    }

    let currentPath = root;
    for (let part of parts) {
        currentPath = join(currentPath, part);
        if (!fs.existsSync(currentPath)) {
            await fsp.mkdir(currentPath);
        }
    }

    for (let fileName of fileNames) {
        await fsp.writeFile(
            join(fullPath, fileName),
            req.body[fileName].replace(/\r\n/g, '\n')
        );
    }
    return true;
}

const handler = async (req, res) => {

    // Save from editor
    if (req.body['save-as-path']) {
        const savedAs = await saveAsPath(req);
        if (savedAs) {
            res.send(`<script>
                window.top.location = '/samples/#edit/${req.body['save-as-path']}';
                window.top.location.reload();
            </script>`);
        }
    } else if (req.body.save !== 'false') {
        await saveFiles(req);
    }

    let resources = f.getResources(req.query.path);

    let codePath = req.query.rightcommit ?
        'https://github.highcharts.com/' + req.query.rightcommit :
        '/code';
    fs.writeFile(join(__dirname, '../../path.txt'), req.query.path, 'utf-8', (err) => {
        if (err) {
            console.log(err);
        }
    });

    const es6Context = {};
    const js = f.getJS(req, codePath, es6Context);

    const styledMode = js.indexOf('styledMode: true') !== -1;

    const themes = await f.getThemes(req);

    const details = f.getDetails(req.query.path, req);
    const isUnitTest = (details.resources || '').toString().indexOf('qunit') !== -1;
    const config = await f.getConfig();

    let tpl = {
        title: (details && details.name) || req.query.path,
        path: req.query.path,
        mobile: req.query.mobile,
        html: f.getHTML(req, codePath),
        css: f.getCSS(req, codePath),
        js,
        es6Context,
        preJS: req.session.preJS,
        consoleClear: true,
        bodyClass: req.query.mobile ? 'mobile' : '',
        ipAddress: ip.address(),
        isUnitTest,
        branch: f.getBranch(),
        latestCommit: f.getLatestCommit(),
        isView: true,
        applyCSP: details.applyCSP !== false && !isUnitTest,
        scripts: [
            '/javascripts/trusted-types.js',
            '/javascripts/vendor/jquery-1.11.1.js',
            '/javascripts/view.js',
            '/javascripts/nav.js'
        ].concat(resources.scripts),
        styles: [
            '/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css'
        ].concat(resources.styles),
        readme: f.getReadme(req),
        testNotes: f.getTestNotes(req),
        themes,
        styledMode,
        compileOnDemand: config.find(option => option.key === 'compileOnDemand'),
    };

    res.render('samples/view', tpl);
};

router.get('/', handler);
router.post('/', handler);

module.exports = router;
