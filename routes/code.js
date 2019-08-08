const express = require('express');
const router = express.Router();
const f = require('../lib/functions');
const fs = require('fs');
const { codeWatch, highchartsDir } = require('../lib/arguments');


router.get('/poll', (req, res) => {

    let libProcess = '';
    try {
        libProcess = fs.readFileSync(`${highchartsDir}/node_modules/_gulptasks_lib_process.json`);
    } catch (e) {}

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    res.type('application/json');
    res.send(libProcess);
});

router.get(/[a-z\/\-\.]/, function(req, res) {
    let file = f.getCodeFile(req.path);

	if (file.error) {
		res.status(404).end(file.error);
		return;
	}

    let js = fs.readFileSync(file.success);

    if (codeWatch && [
        '/highcharts.js',
        '/stock/highstock.js',
        '/maps/highmaps.js'
    ].includes(req.path)) {
        js += `
        (() => {
            let isProcessing = false;
            const poll = async () => {
                try {
                    const response = await fetch('//${req.headers.host}/code/poll');
                    const data = await response.json();

                    if (data && data.isRunning) {
                        // Started processing on the server
                        if (data.isRunning['scripts-js'] && !isProcessing) {
                            Highcharts.charts.forEach(
                                chart => chart.showLoading(
                                    'Building Highcharts on server...<br>' +
                                    'Page will reload when finished'
                                )
                            );
                            isProcessing = true;
                        }

                        // Ended processing on the server
                        if (!data.isRunning['scripts-js'] && isProcessing) {
                            window.location.reload();
                        }
                    }
                } catch (e) {};
                setTimeout(poll, 1000);
            };
            setTimeout(poll, 1000);
        })();
        `;
    }

    //res.type('text/html');
	res.setHeader('Content-Disposition', 'inline');
    res.send(js);
});

module.exports = router;
