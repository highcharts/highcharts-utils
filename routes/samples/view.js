/**
 * View a single sample
 */

import express from 'express';
import * as f from './../../lib/functions.js';
import fs from 'fs';
import ip from 'ip';
import { join } from 'path';

const router = express.Router();

router.get('/', async (req, res) => {
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
    const js = f.getJS(req.query.path, req, codePath, es6Context);

    const styledMode = js.indexOf('styledMode: true') !== -1;

    const themes = await f.getThemes(req);

    const details = f.getDetails(req.query.path);
    const config = await f.getConfig();

    let tpl = {
        title: (details && details.name) || req.query.path,
        path: req.query.path,
        mobile: req.query.mobile,
        html: f.getHTML(req, codePath),
        css: f.getCSS(req.query.path, codePath),
        js,
        es6Context,
        preJS: req.session.preJS,
        consoleClear: true,
        bodyClass: req.query.mobile ? 'mobile view' : 'view',
        ipAddress: ip.address(),
        branch: f.getBranch(),
        latestCommit: f.getLatestCommit(),
        isView: true,
        applyCSP: details.applyCSP !== false,
        scripts: [
            '/javascripts/trusted-types.js',
            '/javascripts/vendor/jquery-1.11.1.js',
            '/javascripts/view.js',
            '/javascripts/nav.js'
        ].concat(resources.scripts),
        styles: [
            '/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css'
        ].concat(resources.styles),
        readme: f.getReadme(req.query.path),
        testNotes: f.getTestNotes(req.query.path),
        themes,
        styledMode,
        compileOnDemand: config.find(option => option.key === 'compileOnDemand'),
    };

    res.render('samples/view', tpl);
});

export default router;
