import express from 'express';

import { extname } from 'node:path';
import { getCodeFile } from '../lib/functions.js';

export const router = express.Router();

router.get(/[a-z\/\-\.]/, async function(req, res) {
    let { content, error, path } = await getCodeFile(req.path, req);

    if (error) {
        res.status(404).end(error);
        return;
    }

    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (content) {
        const type = {
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.map': 'application/json',
            '.svg': 'image/svg+xml'
        }[extname(req.path)];
        if (type) {
            res.type(type);
        }

        res.setHeader('Content-Disposition', 'inline');
        res.send(content);

    } else {
        res.sendFile(path);
    }
});

export default router;
