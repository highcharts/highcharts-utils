import fs from 'fs';
import { highchartsDir } from './arguments.js';
import path from 'path';
import WebSocket from 'ws';

function listAllFilesRecursively(dir) {
    const result = new Set();

    function walk(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile()) {
                result.add(fullPath);
            }
        }
    }

    walk(dir);
    return result;
}

export function startWatchServer(server) {
    const wss = new WebSocket.Server({ server }),
        samplesDir = `${highchartsDir}/samples/`;

    let previousFiles = listAllFilesRecursively(samplesDir),
        currentWS = null;

    function samplesStructureChanged() {
        const bisectLogPath = path.join(highchartsDir, '.git', 'BISECT_LOG');
        if (fs.existsSync(bisectLogPath)) {
            return false;
        }

        const currentFiles = listAllFilesRecursively(samplesDir),
            added = [...currentFiles].filter(f => !previousFiles.has(f)),
            removed = [...previousFiles].filter(f => !currentFiles.has(f));

        previousFiles = currentFiles;

        return added.length > 0 || removed.length > 0;
    }

    fs.watch(`${highchartsDir}/ts/`, {
        persistent: true,
        recursive: true
    }, (eventType, filename) => {
        if (!filename || !currentWS) {
            return;
        }

        if (samplesStructureChanged()) {
            currentWS.send(JSON.stringify({
                message: 'samples structure changed'
            }));

        } else {
            currentWS.send(JSON.stringify({
                message: 'ts changed'
            }));
        }

        currentWS = null;
    });

    fs.watch(samplesDir, {
        persistent: true,
        recursive: true
    }, (eventType, filename) => {
        if (!filename || !currentWS) {
            return;
        }

        if (samplesStructureChanged()) {
            currentWS.send(JSON.stringify({
                message: 'samples structure changed'
            }));
        } else {
            currentWS.send(JSON.stringify({
                message: 'samples changed'
            }));
        }
        currentWS = null;
    });

    fs.watch(`${highchartsDir}/css/`, {
        persistent: true,
        recursive: true
    }, () => {
        currentWS?.send(JSON.stringify({
            message: 'css changed'
        }));
        currentWS = null;
    });

    const libProcessFile =
        `${highchartsDir}/node_modules/_gulptasks_lib_process.json`;
    fs.watchFile(libProcessFile, () => {
        let libProcess = '';
        try {
            libProcess = fs.readFileSync(libProcessFile, 'utf8');
        } catch (e) {}

        currentWS?.send(libProcess);
    });

    wss.on('connection', (ws) => {

        console.log('WebSocket connection established');

        // Connection is up, let's add a simple simple event
        ws.on('message', (message) => {

            // Log the received message and send it back to the client
            console.log('received: %s', message);
            ws.send(`Hello, you sent -> ${message}`);
        });

        currentWS = ws;
    });
};
