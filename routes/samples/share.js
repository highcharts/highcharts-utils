/**
 * Share a sample
 */

const express = require('express');
const router = express.Router();
const f = require('../../lib/functions.js');
const fs = require('fs').promises;
const ip = require('ip');
const { join } = require('path');
const { highchartsDir } = require('../../lib/arguments.js');

router.get('/', async (req, res) => {

    const path = req.query.path,
        latestCommit = f.getLatestCommit();
    const html = await fs
        .readFile(
            join(highchartsDir, 'samples', req.query.path, 'demo.html'),
            'utf-8'
        );
    const modifiedHtml = html
        .replace(
            /https:\/\/code.highcharts.com\//g,
            `https://github.highcharts.com/${latestCommit}/`
        )
        .replace(
            `https://github.highcharts.com/${latestCommit}/mapdata/`,
            'https://code.highcharts.com/mapdata/'
        );
    const js = await fs.readFile(
        join(highchartsDir, 'samples', req.query.path, 'demo.js')
    );
    const css = await fs.readFile(
        join(highchartsDir, 'samples', req.query.path, 'demo.css'),
        'utf-8'
    );

    const modifiedCss = css
        ?.replace(
            /https:\/\/code.highcharts.com\//g,
            `https://github.highcharts.com/${latestCommit}/`
        );

    const details = f.getDetails(req.query.path);

	res.render('samples/share', {
        title: (details && details.name) || path,
        path,
        latestCommit,
        html,
        css,
        js,
        modifiedHtml,
        modifiedCss,
        bodyClass: 'page',
        ipAddress: ip.address()
    });
});

module.exports = router;
