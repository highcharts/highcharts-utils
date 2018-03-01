const browserversion = require('./browser-version');
const largedataset = require('./large-dataset');
const uscountiesunemployment = require('./us-counties-unemployment');
const usdeur = require('./usdeur');
const worldmortality = require('./world-mortality');
const worldpopulation = require('./world-population');

Promise
    .all([
        browserversion(),
        largedataset(),
        uscountiesunemployment(),
        usdeur(),
        worldmortality(),
        worldpopulation(),
    ])
    .then(successes => {
        let success = successes.every(success => { return success; });
        if (success) {
            console.log('🎉 Generating succeeded');
            process.exit(0);
        } else {
            throw new Error('Some generators failed');
        }
    })
    .catch(error => {
        console.error(error);
        console.log('💩 Generating failed');
        process.exit(1);
    });
