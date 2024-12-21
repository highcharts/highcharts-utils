import express from 'express';
import ip from 'ip';

const router = express.Router();

router.get('/', function(req, res) {
	res.render('samples/mobile', {
		title: 'Highcharts Samples - Mobile',
		scripts: [
			'/javascripts/vendor/jquery-1.11.1.js',
			'/javascripts/mobile.js'
		],
		ipAddress: ip.address()
	});
});

export default router;
