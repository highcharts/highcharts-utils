const express = require('express');
const router = express.Router();

const { getConfig } = require('../../lib/functions.js');

router.get('/', async (req, res) => {
    const options = await getConfig();

    res.render('samples/settings', {
        preJS: req.session.preJS,
        options
    });
});

module.exports = router;
