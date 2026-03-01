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

function broadcastMessage(wss, message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

export function startWatchServer(server) {
    const wss = new WebSocket.Server({ server }),
        samplesDir = `${highchartsDir}/samples/`;

    let previousFiles = listAllFilesRecursively(samplesDir);

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
        if (!filename) {
            return;
        }

        if (samplesStructureChanged()) {
            broadcastMessage(wss, JSON.stringify({
                message: 'samples structure changed'
            }));
        } else {
            broadcastMessage(wss, JSON.stringify({
                message: 'ts changed'
            }));
        }
    });

    let samplesTimeout;
    fs.watch(samplesDir, {
        persistent: true,
        recursive: true
    }, (eventType, filename) => {
        if (!filename) {
            return;
        }

        clearTimeout(samplesTimeout);
        if (samplesStructureChanged()) {
            samplesTimeout = setTimeout(() => {
                broadcastMessage(wss, JSON.stringify({
                    message: 'samples structure changed'
                }));
            }, 100);
        } else {
            samplesTimeout = setTimeout(() => {
                broadcastMessage(wss, JSON.stringify({
                    message: 'samples changed'
                }));
            }, 100);
        }
    });

    fs.watch(`${highchartsDir}/css/`, {
        persistent: true,
        recursive: true
    }, () => {
        broadcastMessage(wss, JSON.stringify({
            message: 'css changed'
        }));
    });

    const libProcessFile =
        `${highchartsDir}/node_modules/_gulptasks_lib_process.json`;
    fs.watchFile(libProcessFile, () => {
        let libProcess = '';
        try {
            libProcess = fs.readFileSync(libProcessFile, 'utf8');
        } catch (e) {}

        broadcastMessage(wss, libProcess);
    });

    wss.on('connection', (ws) => {
        console.log(
            `WebSocket connection established, currently ${wss.clients.size} clients connected`
        );

        ws.on('message', (message) => {
            console.log('received: %s', message);
            ws.send(`Hello, you sent -> ${message}`);
        });
    });
};
