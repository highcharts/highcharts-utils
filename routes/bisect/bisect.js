const express = require('express');
const router = express.Router();
const highchartsDir = require('../../config.json').highchartsDir;
const git = require('simple-git')(highchartsDir);

const parseResult = (result) => {
	return {
		commit: result.split('[')[1].split(']')[0],
		full: result,
		message: result.split('[')[1].split(']')[1].trim(),
		bisectStatus: result.split('[')[0].trim()
	};
};


router.get('/', function(req, res) {

	const handleStep = (err, result) => {

		req.session.steps.forEach((step) => {
			step.showButtons = false;
		});

		if (err) {
			throw err;

		// Bisecting...
		} else if (result.indexOf('Bisecting') === 0) {
			req.session.steps.push(parseResult(result));

			req.session.steps[req.session.steps.length - 1].showButtons = true;

		// Culprit found
		} else {
			req.session.steps.push({
				commit: result.split(' ')[0],
				message: result.split(' ')[0].substr(0, 10),
				full: result,
				className: 'culprit',
				isCulprit: true
			});

			// Reset
			delete req.session.current;
			delete req.session.good;
			delete req.session.bad;
			git.raw(['bisect', 'reset']);
		}


		tpl.steps = req.session.steps;
		res.render('bisect/bisect', tpl);
	};

	let tpl = {
		scripts: [
			'/javascripts/vendor/jquery-1.11.1.js'
		],
  		good: req.session.good,
  		bad: req.session.bad,
  		automaticChecked: req.session.automatic !== false ? 'checked' : ''
  	};

  	if (tpl.good === undefined || tpl.good.trim === '') {
  		console.log('undefined good')

  		// Use latest tag by default
  		git.tags(function (err, tags) {
  			tpl.good = tags.latest;

  			res.render('bisect/bisect', tpl);
  		});


  	// Start a new bisect
  	} else if (!req.session.current) {

  		req.session.steps = [];
  		git.raw(['bisect', 'start'], (err) => {
  			if (err) {
	  			throw err;
	  		} 

	  	});
	  	git.raw(['bisect', 'good', tpl.good], (err) => {
	  		if (err) {
	  			throw err;
	  		}
	  	});
	  	let cmd = ['bisect', 'bad'];
		if (req.session.bad) {
			cmd.push(req.session.bad);
		}
		git.raw(cmd, handleStep);

	// Mark good or bad
	} else {
		git.raw(['bisect', req.session.current], handleStep);
	}
});

router.post('/', function(req, res) {
	req.session.good = req.body.good;
	req.session.bad = req.body.bad;
	req.session.automatic = req.body.automatic ? true : false;

	delete req.session.current;
	if (req.body['current-good']) {
		req.session.current = 'good';
	} else if (req.body['current-bad']) {
		req.session.current = 'bad';
	}
	
	res.redirect('/bisect/bisect');
});

module.exports = router;
