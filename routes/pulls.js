const express = require('express');
const router = express.Router();

const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
    // https://github.com/settings/tokens
    auth: process.env.GH_PERSONAL_ACCESS_TOKEN
});

const per_page = 60;
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
    } else {
        res.send('');
    }
});

router.get('/list', async (req, res) => {
    const pulls = await octokit.pulls.list({
        ...repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page
    }).catch(e => console.error(e));

    // Note: this also returns pulls
    const issues = await octokit.issues.listForRepo({
        ...repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page: 10
    }).catch(e => console.error(e));
    if (issues) {
        issues.data = issues.data.filter(issue => !issue.pull_request);
    }

    const featureRequests = await octokit.issues.listForRepo({
        ...repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        labels: 'Type: Feature Request',
        per_page: 5
    }).catch(e => console.error(e));

    res.type('text/json');
    res.send(JSON.stringify({
        pulls: pulls ? [
            ...pulls.data
                .map(p => {
                    p.pull_request = true;
                    return p;
                }),
            ...issues.data,
            ...featureRequests.data
        ].filter(p => !p.labels.find(l => l.name == 'Status: Stale')) : []
    }));
});

router.get('/list-comments/:number', async (req, res) => {
    const result = await octokit.issues.listComments({
        ...repo,
        issue_number: req.params.number
    }).catch(e => console.error(e));

    res.json({
        comments: result && result.data || {}
    });
});

router.get('/list-reviews/:number', async (req, res) => {
    const result = await octokit.pulls.listReviews({
        ...repo,
        pull_number: req.params.number
    }).catch(e => console.error(e));

    res.json({
        reviews: result && result.data || {}
    });
});

router.get('/list-review-comments/:number', async (req, res) => {
    const result = await octokit.pulls.listReviewComments({
        ...repo,
        pull_number: req.params.number
    }).catch(e => console.error(e));

    res.json({
        reviewComments: result && result.data || {}
    });
});

router.get('/list-commits/:number', async (req, res) => {
    const result = await octokit.pulls.listCommits({
        ...repo,
        pull_number: req.params.number
    }).catch(e => console.error(e));

    res.json({
        commits: result ? result.data : undefined
    });
});

router.get('/list-checks/:ref', async (req, res) => {
    // const result = await octokit.repos.listCommitStatusesForRef({
    const result = await octokit.rest.checks.listForRef({
        ...repo,
        ref: req.params.ref
    }).catch(e => console.error(e));

    res.json(result ? {
        checks: result.data
    }: {});
});


module.exports = router;



