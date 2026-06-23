import express from 'express';
import ip from 'ip';

const router = express.Router();

router.get('/', function(req, res) {
	res.render('samples/mobile', {
		title: 'Highcharts Samples - Mobile',
		scripts: [
			'/javascripts/mobile.js'
		],
		ipAddress: ip.address()
	});
});

export default router;
