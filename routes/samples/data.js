import express from 'express';
import fs from 'fs';
import path, { join } from 'path';
import { samplesDir } from '../../lib/arguments.js';

const router = express.Router();

router.get(/[a-z\/\-\.0-9]+\.([a-z]+)$/, function(req, res) {

    const extname = path.extname(req.path).replace(/^./, '');

    let file = join(samplesDir, 'data', req.path);

    if (!['gpx', 'mjs', 'js', 'json', 'csv', 'ttf', 'xml'].includes(extname)) {
        res.status(403).send(`
            File type not allowed in the utils: ${extname}.<br>
            Update the allow-list in <code>routes/samples/data.js</code>.
        `);
        return;
    }

    if (!fs.existsSync(file)) {
        res.status(404).send(`File not found: ${file}`);
        return;
    }
    if (extname === 'js') {
        res.setHeader('Content-Type', 'text/javascript');
    }
    if (extname === 'json') {
        res.setHeader('Content-Type', 'application/json');
    }
    if (extname === 'xml' || extname === 'gpx') {
        res.setHeader('Content-Type', 'application/xml');
    }
    if (/\/es-modules\/|\.mjs$/.test(req.path)) {
        res.setHeader('Content-Type', 'application/javascript+module');
    }
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.sendFile(file);
});

export default router;
