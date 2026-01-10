import express from 'express';
import {
    getLatestTag,
    getNightlyResult
} from '../../lib/functions.js';
import moment from 'moment'; // Using dateFormat

const router = express.Router();


let latestReleaseDate = Date.parse(getLatestTag().date);
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
                    'var(--background-success)' :
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

router.get('/single', async (req, res) => {

    const path = req.query.path,
        result = await getNightlyResult(Date.now()),
        nightlyResult = JSON.parse(result)[path];

    res.render('samples/nightly-single', {
        bodyClass: 'page',
        scripts: [
            'https://code.highcharts.com/highcharts.js',
            '/javascripts/samples/nightly.js'
        ],
        styles: [
            '/stylesheets/nightly.css'
        ],
        path,
        nightlyResult
    });
});

router.get('/latest.json', async (req, res, next) => {
    const json = await getNightlyResult(Date.now()).catch(next);

    res.type('application/json');
    res.send(json);

});

export default router;
