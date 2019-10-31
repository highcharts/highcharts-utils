const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
    res.render('samples/nightly-single', {
        bodyClass: 'page',
        scripts: [
            'https://code.highcharts.com/highcharts.js',
            '/javascripts/samples/nightly.js'
        ],
        styles: [
            '/stylesheets/nightly.css'
        ],
        path: req.query.path
    });
});

module.exports = router;
