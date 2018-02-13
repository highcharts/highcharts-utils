const usdeur = require('./usdeur');
const world_population = require('./world_population');

Promise
    .all([
        usdeur(),
        world_population(),
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
