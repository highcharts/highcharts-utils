const fs = require('fs'),
    { highchartsDir } = require('./arguments.js');
    WebSocket = require('ws');

function startWatchServer(server) {
    console.log('@startWatchServer')
    const wss = new WebSocket.Server({ server });
    wss.on('connection', (ws) => {

        // Connection is up, let's add a simple simple event
        ws.on('message', (message) => {

            // Log the received message and send it back to the client
            console.log('received: %s', message);
            ws.send(`Hello, you sent -> ${message}`);
        });

        fs.watch(`${highchartsDir}/ts/`, {
            persistent: true,
            recursive: true
        }, () => {
            ws.send(JSON.stringify({
                message: 'ts changed'
            }));
        });

        fs.watch(`${highchartsDir}/samples/`, {
            persistent: true,
            recursive: true
        }, () => {
            ws.send(JSON.stringify({
                message: 'samples changed'
            }));
        });

        let file = `${highchartsDir}/node_modules/_gulptasks_lib_process.json`;
        fs.watchFile(file, () => {
            let libProcess = '';
            try {
                libProcess = fs.readFileSync(file, 'utf8');
            } catch (e) {}

            ws.send(libProcess);
        });
    });
};

module.exports = {
    startWatchServer
};
