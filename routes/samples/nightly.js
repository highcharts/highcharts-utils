const express = require('express');
const f = require('../../lib/functions');

const router = express.Router();

let latestReleaseDate = Date.parse(f.getLatestTag().date);
latestReleaseDate -= latestReleaseDate % (24 * 36e5); // Round down to midnight

router.get('/', function(req, res) {
  	res.render('samples/nightly', {
        bodyClass: 'page',
        latestReleaseDate,
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
