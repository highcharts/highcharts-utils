const express = require('express');
const f = require('../../lib/functions');
const https = require('https');
const moment = require('moment'); // Using dateFormat

const router = express.Router();

const BUCKET = 'https://s3.eu-central-1.amazonaws.com/staging-vis-dev.highcharts.com';

const getJSON = async (url) => new Promise ((resolve, reject) => {
    https.get(url, (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            try {
                resolve(data)
            } catch (e) {
                reject(e);
            }
        });

    }).on("error", (err) => {
        reject(err);
    });
});

const getNightlyResult = async (date) => {
    const dateString = moment(date).format('YYYY-MM-DD');
    try {
        const json = await getJSON(
            `${BUCKET}/visualtests/diffs/nightly/${dateString}/visual-test-results.json`
        );

        const compare = JSON.parse(json);
        Object.keys(compare).forEach(path => {
            if (path !== 'meta') {
                compare[path] = { diff: compare[path].toString() };
            }
        });

        // Handle
        const approvalsJSON = await getJSON('https://vrevs.highsoft.com/api/reviews/latest');
        const approvals = JSON.parse(approvalsJSON);
        Object.keys(approvals.samples).forEach(path => {
            if (path !== 'meta') {
                approvals.samples[path].forEach(approval => {
                    if (
                        compare[path].diff > 0 &&
                        compare[path].diff.toString() === approval.diff.toString()
                    ) {
                        compare[path].comment = {
                            symbol: 'check',
                            diff: approval.diff,
                            title: approval.comment
                        };
                    }
                });
            }
        });


        return JSON.stringify(compare, null, '  ');
    } catch (e) {
        console.warn(e);
    }
}

let latestReleaseDate = Date.parse(f.getLatestTag().date);
latestReleaseDate -= latestReleaseDate % (24 * 36e5); // Round down to midnight

const getResults = async () => {
    const results = {};
    const endDate = Date.now();
    const startDate = Math.max(
        latestReleaseDate + 24 * 36e5,
        endDate - 90 * 24 * 36e5
    );

    for (let date = startDate; date <= endDate; date += 24 * 36e5) {
        const data = await getNightlyResult(date).catch(console.warn);
        if (data) {
            results[date] = data;
        }
    }
    return results;
}

const getTable = (results) => {

    const header = [];
    const body = [];
    const samples = [];

    Object.keys(results).forEach(date => {
        let fails = 0;
        Object.keys(results[date]).forEach(sample => {
            if (sample !== 'meta') {
                if (samples.indexOf(sample) === -1) {
                    samples.push(sample);
                }

                if (results[date][sample] > 0) {
                    fails++;
                }
            }
        });

        const dateString = moment(Number(date)).format('D. MMM');
        header.push({
            dateString,
            fails,
        });
    });

    samples.sort().forEach(sample => {

        const tds = [];
        Object.keys(results).forEach(date => {
            const dateString = moment(Number(date)).format('YYYY-MM-DD');
            let diff = '';
            let onclick = '';
            let className = '';
            let backgroundColor = 'none';
            if (results[date][sample] !== undefined) {
                diff = results[date][sample];
                onclick = `compare('${sample}', ${date})`;
                className = 'active';

                backgroundColor = diff === 0 ?
                    '#a4edba' :
                    `rgba(241, 92, 128)`;
                if (diff > 999) {
                    diff = Math.round(diff / 1000) + 'k';
                }
            }
            tds.push({
                backgroundColor,
                className,
                dateString,
                diff,
                onclick
            });
        });
        body.push({ sample, tds });
    });

    return { header, body };
}


router.get('/', async (req, res, next) => {
    const results = await getResults(next).catch(next);

  	res.render('samples/nightly', {
        bodyClass: 'page',
        latestReleaseDate,
        scripts: [
            'https://code.highcharts.com/highcharts.js',
            '/javascripts/samples/nightly.js'
        ],
        styles: [
            '/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css',
            '/stylesheets/nightly.css'
        ],
        results: JSON.stringify(results),
        table: getTable(results, next)
    });
});

router.get('/latest.json', async (req, res, next) => {
    const json = await getNightlyResult(Date.now()).catch(next);

    res.type('application/json');
    res.send(json);

});

module.exports = router;
