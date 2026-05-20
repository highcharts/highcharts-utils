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

const modifiedPath = 'https://github.highcharts.com/{commit}/';
// const modifiedPath = 'https://cdn.jsdelivr.net/npm/highcharts@v13.0.0-beta.1/';

router.get('/', async (req, res) => {

    const path = req.query.path,
        latestCommit = f.getLatestCommit();
    const html = await fs
        .readFile(
            join(highchartsDir, 'samples', req.query.path, 'demo.html'),
            'utf-8'
        );
    const mPath = modifiedPath.replace('{commit}', latestCommit);
    const modifiedHtml = html
        .replace(
            /https:\/\/code.highcharts.com\//g,
            mPath
        )
        .replace(
            `${mPath}mapdata/`,
            'https://code.highcharts.com/mapdata/'
        )
        .replace(
            `${mPath}connectors/`,
            'https://code.highcharts.com/connectors/'
        );

    const jsPath = await glob(
        join(highchartsDir, 'samples', req.query.path) + '/demo.{js,ts,mjs}'
    );

    const js = jsPath.length ? await fs.readFile(jsPath[0]) : '';

    const css = await fs.readFile(
        join(highchartsDir, 'samples', req.query.path, 'demo.css'),
        'utf-8'
    ).catch(() => '') || '';

    const modifiedCss = css
        ?.replace(
            /https:\/\/code.highcharts.com\//g,
            mPath
        );

    const details = f.getDetails(req.query.path);

	res.render('samples/share', {
        title: (details && details.name) || path,
        path,
        latestCommit,
        html,
        css,
        js,
        modifiedPath,
        modifiedHtml,
        modifiedCss,
        bodyClass: 'page',
        ipAddress: ip.address()
    });
});

export default router;
