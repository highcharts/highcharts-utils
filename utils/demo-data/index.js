/**
 * Calls generators to create data for demos into the following folder:
 * ../../highcharts/samples/data
 */

const browserVersions = require('./browser-versions');
const largeDataset = require('./large-dataset');
const usCountiesUnemployment = require('./us-counties-unemployment');
const usdeur = require('./usdeur');
const worldMortality = require('./world-mortality');
const worldPopulation = require('./world-population');

Promise
    .all([
        browserVersions(),
        largeDataset(),
        usCountiesUnemployment(),
        usdeur(),
        worldMortality(),
        worldPopulation(),
    ])
    .then(successes => {
        let success = successes.every(success => success);
        if (success) {
            console.log('✅  Generating succeeded');
            process.exit(0);
        } else {
            throw new Error('Some generators failed');
        }
    })
    .catch(error => {
        console.error('❌  ' + error.message);
        console.log('❌  Generating failed');
        process.exit(1);
    });
