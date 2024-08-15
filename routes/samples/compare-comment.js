import express from 'express';
import * as fs from 'node:fs';
import f from '../../lib/functions.js';
import * as path from 'node:path';

const router = express.Router();

const getSavedCompare = (req) => {
	let fileName = path.join(import.meta.dirname, '../../temp/compare.' +
			f.getBranch() + '.' + req.query.browser + '.json');
	let compare;
	
	if (fs.existsSync(fileName)) {
		let json = require(fileName);
		compare = json[req.query.path];
	}

	return compare || {};
}


router.get('/', function(req, res) {

	let compare = getSavedCompare(req);
	let comment = compare.comment;

	res.render('samples/compare-comment', {
		path: req.query.path,
		symbols: [{
			symbolName: 'check',
			selected: (comment && comment.symbol === 'check') ? 'selected' : ''
		}, {
			symbolName: 'warning',
			selected: (comment && comment.symbol === 'warning') ?
				'selected' :
				''
		}],
		commentDiff: comment && comment.diff,
		computedDiff: compare.diff,
		diff: (comment && comment.diff) || compare.diff,
		hasDiffChanged: comment && comment.diff !== compare.diff,

		title: comment && comment.title,

	});
});

export default router;
