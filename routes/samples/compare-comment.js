import express from 'express';
import fs from 'fs';
import * as f from '../../lib/functions.js';
import path from 'path';

const router = express.Router();

const getSavedCompare = (req) => {
	let filepath = path.join(f.dirname(import.meta), '../../temp/compare.' +
			f.getBranch() + '.' + req.query.browser + '.json');
	let compare;

	if (fs.existsSync(filepath)) {
		const allCompare = f.getLocalJSON(filepath);
		compare = allCompare[req.query.path] || {};

		compare.titleDataList = [...new Set(
			Object.values(allCompare)
				.map((sample) => sample.comment?.title)
				.filter((title) => title)
				.sort()
		)];
	}

	return compare || {};
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
		titleDataList: compare.titleDataList || []

	});
});

export default router;
