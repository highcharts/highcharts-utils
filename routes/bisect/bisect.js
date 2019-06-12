/* eslint-env node,es6 */

const express = require('express');
const router = express.Router();
const { resolve } = require('path');
const highchartsDir = resolve(require('../../config.json').highchartsDir);
const { spawn } =  require('child_process');

const git = cmd => new Promise((resolve, reject) => {
	const options = {
		cwd: highchartsDir
	};

	// When running with administrator privileges, make sure we're running as
	// the normal user so that we don't have to unlock all files after.
	if (process.env.SUDO_UID) {
		options.uid = parseInt(process.env.SUDO_UID, 10);
	}

	const p = spawn('git', cmd, options);
	let data = '';

	p.stderr.on('data', reject);

	p.stdout.on('data', d => {
		data += d.toString();
	});

	p.on('close', code => {
		if (code === 0) {
			resolve(data);
		} else {
			reject(code);
		}
	});
})

const parseResult = result => ({
	commit: result.split('[')[1].split(']')[0],
	full: result,
	message: result.split('[')[1].split(']')[1].trim(),
	bisectStatus: result.split('[')[0].trim()
});

router.get('/', async (req, res, next) => {

	const reset = async () => {
		// Reset
		delete req.session.current;
		delete req.session.good;
		delete req.session.bad;
		delete req.session.cancel;
		
		await git(['bisect', 'reset']).catch(next);
	};

	const handleStep = (result) => {

		req.session.steps.forEach((step) => {
			step.showButtons = false;
		});

		// Bisecting...
		if (result.indexOf('Bisecting') === 0) {
			req.session.steps.push(parseResult(result));

			req.session.steps[req.session.steps.length - 1].showButtons = true;

		// Culprit found
		} else {
			req.session.steps.push({
				commit: result.split(' ')[0],
				message: 'Bisected to commit ' + result.split(' ')[0].substr(0, 10),
				full: result,
				className: 'culprit',
				isCulprit: true
			});

			reset();
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

  	if (req.session.cancel) {
  		reset();
  		delete tpl.good;
  		delete tpl.bad;
  		res.render('bisect/bisect', tpl);

  	} else if (req.session.skip) {
  		let result = await git(['bisect', 'skip']).catch(reset);
  		handleStep(result);


  	} else if (tpl.good === undefined || tpl.good.trim === '') {
  		console.log('undefined good')

  		// Use latest tag by default
  		let tags = await git(['tag', '-l']).catch(next);

  		if (tags) {
	  		tags = tags.trim().split(/\s/g);

	  		// Propose latest tag as the good commit
	  		tpl.good = tags.pop();
	  	}
  		
  		res.render('bisect/bisect', tpl);


  	// Start a new bisect
  	} else if (!req.session.current) {

  		req.session.steps = [];

  		await git(['bisect', 'start']).catch(next);
	  	await git(['bisect', 'good', tpl.good]).catch(next);
	  	let cmd = ['bisect', 'bad'];
		if (req.session.bad) {
			cmd.push(req.session.bad);
		}
		let result = await git(cmd).catch(next);
		handleStep(result);

	// Mark good or bad
	} else {
		let result = await git(['bisect', req.session.current]).catch(next);
		handleStep(result);
	}
});

router.post('/', function(req, res) {
	req.session.good = req.body.good;
	req.session.bad = req.body.bad;
	req.session.cancel = req.body.cancel ? true : false;
	req.session.skip = req.body.skip ? true : false;
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
