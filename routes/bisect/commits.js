const express = require('express');
const router = express.Router();
const { highchartsDir } = require('../../lib/arguments.js');
const git = require('simple-git/promise')(highchartsDir);


router.get('/', function(req, res) {

	let tpl = {
  		scripts: [
  			'https://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js',
  			'http://code.highcharts.com/highcharts.js',
  			'/javascripts/commits.js'
  		],
  		before: req.session.before,
  		after: req.session.after,
  		alltagsChecked: req.session.alltags ? 'checked' : ''

  	};

  	git.tags()

  		// Get the tags
  		.then(tags => new Promise((resolve) => {
  			if (!tpl.after) {
  				tpl.after = tags.latest;
  			}
  			if (req.session.alltags) {
  				tpl.gitlog = tags.all.reverse().map(
  					tag => `* <br>${tag}<br><br>${tag}<br>${tag}\n`
  				);
  			}
  			resolve();
  		}))

  		// Get the commits
  		.then(() => new Promise((resolve, reject) => {

  			if (req.session.alltags) {
  				resolve();

  			} else {
	  			let cmd = ['--graph', '--format="<br>%h<br>%ci<br>%s<br>%p"'];
	  			if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(tpl.after)) {
	  				cmd.push(
	  					'--after={' + tpl.after + '}',
	  					'--before={' + tpl.before + '}'
	  				);
	  			} else {
	  				cmd.unshift(tpl.after + '..' + (tpl.before || 'HEAD'));
	  			}

	  			git.log(cmd)
					.then(gitlog => {
                        if (!gitlog.all[0]) {
                            reject('No gitlog found');
                        } else {
    						tpl.gitlog = gitlog.all[0].hash;
    						if (
    							gitlog.all[0].date &&
    							gitlog.all[0].date.indexOf('<br>') !== -1
    						) {
    							tpl.gitlog += gitlog.all[0].date;
    						}
    						resolve();
                        }
					});
			}
  		}))

  		// Get the branches
		.then(() => new Promise((resolve) => {
			git.branchLocal()
				.then(log => {

					tpl.branches = Object.keys(log.branches).map(name => ({
						name: name,
						selected: (req.session.branch || 'master') === name ?
							'selected' :
							''
					}));

					resolve();
				});
		}))
		.then(() => res.render('bisect/commits', tpl))
        .catch((e) => res.status(500).send(e.toString()));
});

module.exports = router;
