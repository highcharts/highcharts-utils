const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
  	res.render('samples/nightly', {
        bodyClass: 'page',
        scripts: [
            'https://code.highcharts.com/highcharts.js',
            '/javascripts/samples/nightly.js'
        ]
    });
});

module.exports = router;
