import express from 'express';
import { getConfig } from '../../lib/functions.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const options = await getConfig();

    res.render('samples/settings', {
        preJS: req.session.preJS,
        options
    });
});

export default router;
