const express = require('express');
const router = express.Router();
const f = require('../lib/functions');
const fs = require('fs');
const path = require('path');
const { codeWatch } = require('../lib/arguments');

router.get(/[a-z\/\-\.]/, async function(req, res) {
    let file = await f.getCodeFile(req.path, req);

    if (file.error) {
        res.status(404).end(file.error);
        return;
    }

    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (codeWatch) {
        let code = fs.readFileSync(file.success);

        if ([
            '/highcharts.js',
            '/dashboards/dashboards.js',
            '/stock/highstock.js',
            '/maps/highmaps.js'
        ].includes(req.path)) {
            code += `
            (() => {
                let socket = new WebSocket("ws://${req.headers.host}");
                let isProcessing = false;

                socket.onopen = function(e) {
                    console.log("WebSocket connection established");
                };

                socket.onmessage = function(event) {
                    try {
                        const data = JSON.parse(event.data);

                        console.log('@onmessage', data, data && data.isRunning)
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
                };

                socket.onclose = function(event) {
                    if (event.wasClean) {
                        console.log('Websocket connection closed cleanly', event.code, event.reason);
                    } else {
                       console.log('Websocket connection died');
                    }
                };

                socket.onerror = function(error) {
                    console.log('Websocket Error', error.message);
                };
            })();
            `;
        }

        const type = {
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.map': 'application/json',
            '.svg': 'image/svg+xml'
        }[path.extname(file.success)];

        if (type) {
            res.type(type);
        }

        res.setHeader('Content-Disposition', 'inline');
        res.send(code);
    } else {
        if (file.js) {
            res.type('text/javascript');
            res.send(file.js);
        } else {
            res.sendFile(file.success);
        }
    }
});

module.exports = router;
