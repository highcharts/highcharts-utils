import express from 'express';
import { getHighchartsDir } from '../../lib/arguments.js';
const router = express.Router();

router.get('/', function(req, res) {
	res.render('samples/contents', {
		scripts: [

		],
		styles: [
			'/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css'
		],
		highchartsDir: getHighchartsDir()
	});
});

export default router;
