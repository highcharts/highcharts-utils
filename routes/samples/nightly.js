const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
  	res.render('samples/nightly', {
        bodyClass: 'page',
        scripts: [
            'https://code.highcharts.com/highcharts.js',
            '/javascripts/samples/nightly.js'
        ],
        styles: [
            '/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css'
        ],
    });
});

module.exports = router;
