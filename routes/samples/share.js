/**
 * Share a sample
 */

import express from 'express';
import { glob }  from 'glob';
import * as f from '../../lib/functions.js';
import { promises as fs } from 'fs';
import ip from 'ip';
import { join } from 'path';
import { highchartsDir } from '../../lib/arguments.js';

const router = express.Router();

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
        )
        .replace(
            `https://github.highcharts.com/${latestCommit}/connectors/`,
            'https://code.highcharts.com/connectors/'
        );

    const jsPath = await glob(
        join(highchartsDir, 'samples', req.query.path) + '/demo.{js,ts,mjs}'
    );

    const js = jsPath.length ? await fs.readFile(jsPath[0]) : '';

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

export default router;
