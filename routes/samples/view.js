/**
 * View a single sample
 */

import express from 'express';
import * as f from './../../lib/functions.js';
import fs from 'fs';
import { highchartsDir } from './../../lib/arguments.js';
import ip from 'ip';
import { getTestTemplate } from './compare-iframe.js';
import { join } from 'path';

const router = express.Router();
const fsp = fs.promises;

const chown = async (path) => {
    if (process.env.SUDO_UID && process.env.SUDO_GID) {
        await fsp.chown(
            path,
            Number(process.env.SUDO_UID),
            Number(process.env.SUDO_GID)
        );
    }
};

const saveFiles = async (req) => {
    const fileName = req.body.save;

    if (typeof fileName === 'string') {
        const filePath = join(
            highchartsDir,
            'samples',
            req.query.path,
            fileName
        );
        await fsp.writeFile(
            filePath,
            req.body[fileName].replace(/\r\n/g, '\n')
        );
        await chown(filePath);
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
            await chown(currentPath);
        }
    }

    for (let fileName of fileNames) {
        const filePath = join(fullPath, fileName);
        await fsp.writeFile(
            filePath,
            req.body[fileName].replace(/\r\n/g, '\n')
        );
        await chown(filePath);
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
    } else if (req.body.save && req.body.save !== 'false') {
        await saveFiles(req);
        // Redirect without POST data to avoid re-saving after refresh
        res.redirect(req.originalUrl);
    }

    let resources = f.getResources(req.query.path);

    let codePath = req.query.rightcommit ?
        'https://github.highcharts.com/' + req.query.rightcommit :
        '/code';

    fs.writeFile(join(f.dirname(import.meta), '../../path.txt'), req.query.path, 'utf-8', (err) => {
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

    const colorScheme = config.find(
        option => option.key === 'colorScheme'
    ).value;

    const bodyClass = [
        req.query.mobile ? 'mobile view' : 'view',
        `highcharts-${colorScheme}`
    ].join(' ');

    const tpl = {
        title: (details && details.name) || req.query.path,
        path: req.query.path,
        mobile: req.query.mobile,
        html: f.getHTML(req, codePath),
        css: f.getCSS(req, codePath),
        js,
        es6Context,
        preJS: req.session.preJS,
        consoleClear: true,
        bodyClass,
        ipAddress: ip.address(),
        isUnitTest,
        branch: f.getBranch(),
        latestCommit: f.getLatestCommit(),
        isView: true,
        applyCSP: details.applyCSP !== false && !isUnitTest,
        scripts: [
            '/javascripts/trusted-types.js',
            '/javascripts/vendor/jquery-1.11.1.js',
            '/javascripts/view.js'
        ].concat(resources.scripts),
        readme: f.getReadme(req),
        testNotes: f.getTestNotes(req),
        themes,
        styledMode,
        compileOnDemand: config.find(option => option.key === 'compileOnDemand'),
        colorScheme: {
            light: colorScheme === 'light',
            dark: colorScheme === 'dark',
            system: colorScheme === 'system'
        }
    };

    if (isUnitTest) {
        req.query.which = 'right';
        Object.assign(tpl, getTestTemplate(req));
    }
    tpl.scripts.push('/javascripts/nav.js');
    tpl.styles = [
        '/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css'
    ].concat(resources.styles);


    res.render('samples/view', tpl);
};

router.get('/', handler);
router.post('/', handler);

export default router;
