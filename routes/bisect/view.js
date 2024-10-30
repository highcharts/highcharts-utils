import express from 'express';
import { replaceURLs } from './../../lib/functions.js';
import args from './../../lib/arguments.js';

const router = express.Router();
const { getSettings } = args;

const replaceHTML = (req) => {

	const { compileOnDemand } = getSettings(req),
		html = req.session.html || '';

	if (compileOnDemand) {
		return replaceURLs(html, '/code');
	}

	return html
		.replace(
			/https?\:\/\/code\.highcharts\.com\//g,
			`http://github.highcharts.com/${req.query.hash}/`
		)
		.replace(
			/https?\:\/\/github\.highcharts\.com\/[a-z0-9\.\-]\/mapdata\//g,
			'http://code.highcharts.com/mapdata/'
		);
}

router.get('/', function(req, res) {
  	res.render('bisect/view', {
  		html: replaceHTML(req),
  		css: req.session.css,
  		js: req.session.js,
  		hash: req.query.hash,
  		shortHash: req.query.hash.substring(0, 8)
  	});
});

export default router;
