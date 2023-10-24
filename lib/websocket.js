const fs = require('fs'),
    { highchartsDir } = require('./arguments.js');
    WebSocket = require('ws');

function startWatchServer(server) {
    const wss = new WebSocket.Server({ server });
    wss.on('connection', (ws) => {

        //connection is up, let's add a simple simple event
        ws.on('message', (message) => {

            //log the received message and send it back to the client
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
