const express = require('express');
const router = express.Router();

const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
    // https://github.com/settings/tokens
    auth: process.env.GH_PERSONAL_ACCESS_TOKEN
});

const per_page = 20;
const repo = {
    owner: 'highcharts',
    repo: 'highcharts'
};

router.get('/', async (req, res) => {
    res.render('pulls/main', {
        styles: [
            'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css',
            '/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css'
        ],
        scripts: [
            'https://cdnjs.cloudflare.com/ajax/libs/timeago.js/2.0.2/timeago.min.js'
        ],
        title: 'Pulls'
    });
});

/*
router.get('/auth', async (req, res) => {
    res.type('text/javascript');
    res.send(`export default {
        clientId: '${process.env.GH_CLIENT_ID}',
        clientSecret: '${process.env.GH_CLIENT_SECRET}'
    }`);
});
*/

router.get('/authenticated-user', async (req, res) => {
    const response = await octokit.users.getAuthenticated()
        .catch(e => console.error(e));

    res.type('text/json');
    res.send(JSON.stringify(response));
});

router.get('/last-update', async (req, res) => {
    const pulls = await octokit.pulls.list({
        ...repo,
        state: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 1
    }).catch(e => console.error(e));

    res.type('text/json');

    if (pulls) {
        res.send(JSON.stringify({
            updatedAt: pulls.data[0].updated_at
        }));
    } else {
        res.send('');
    }
});

router.get('/list', async (req, res, next) => {
    const result = await octokit.pulls.list({
        ...repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page
    }).catch(e => console.error(e));

    res.type('text/json');
    res.send(JSON.stringify({
        pulls: result.data
    }));
});

router.get('/list-comments/:number', async (req, res) => {
    const result = await octokit.issues.listComments({
        ...repo,
        issue_number: req.params.number
    }).catch(e => console.error(e));

    res.json({
        comments: result.data
    });
});

router.get('/list-reviews/:number', async (req, res) => {
    const result = await octokit.pulls.listReviews({
        ...repo,
        pull_number: req.params.number
    }).catch(e => console.error(e));

    res.json({
        reviews: result.data
    });
});

router.get('/list-review-comments/:number', async (req, res) => {
    const result = await octokit.pulls.listReviewComments({
        ...repo,
        pull_number: req.params.number
    }).catch(e => console.error(e));

    res.json({
        reviewComments: result.data
    });
});

router.get('/list-commits/:number', async (req, res) => {
    const result = await octokit.pulls.listCommits({
        ...repo,
        pull_number: req.params.number
    }).catch(e => console.error(e));

    res.json({
        commits: result.data
    });
});

router.get('/list-checks/:ref', async (req, res) => {
    const result = await octokit.repos.listCommitStatusesForRef({
        ...repo,
        ref: req.params.ref
    }).catch(e => console.error(e));

    res.json({
        checks: result.data
    });
});


module.exports = router;



