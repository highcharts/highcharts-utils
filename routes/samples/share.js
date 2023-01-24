/**
 * Share a sample
 */

const express = require('express');
const router = express.Router();
const f = require('../../lib/functions.js');
const fs = require('fs').promises;
const { join } = require('path');
const { highchartsDir } = require('../../lib/arguments.js');

router.get('/', async (req, res) => {

    const path = req.query.path,
        latestCommit = f.getLatestCommit();
    let html = await fs
        .readFile(
            join(highchartsDir, 'samples', req.query.path, 'demo.html'),
            'utf-8'
        );
    html = html
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
        join(highchartsDir, 'samples', req.query.path, 'demo.css')
    );

    const details = f.getDetails(req.query.path);

	res.render('samples/share', {
        title: (details && details.name) || path,
        path,
        latestCommit,
        html,
        css,
        js,
        bodyClass: 'page'
    });
});

module.exports = router;
