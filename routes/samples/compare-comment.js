const express = require('express');
const fs = require('fs');
const router = express.Router();
const f = require('../../lib/functions.js');
const path = require('path');

const getSavedCompare = (req) => {
	let fileName = path.join(__dirname, '../../temp/compare.' +
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

module.exports = router;
