import fs from 'fs';
import { getHighchartsDir } from './arguments.js';
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

let _wss;
let _fsWatchers = [];
let _libProcessFile = '';
let _previousFiles = new Set();
let _samplesDir = '';
let _timeout;

function initWatchers(wss) {
    // Tear down existing watchers
    for (const watcher of _fsWatchers) {
        watcher.close();
    }
    _fsWatchers = [];

    if (_libProcessFile) {
        fs.unwatchFile(_libProcessFile);
    }

    // Re-read paths from the (possibly changed) highcharts dir
    _samplesDir = `${getHighchartsDir()}/samples/`;
    _previousFiles = listAllFilesRecursively(_samplesDir);

    function samplesStructureChanged() {
        const bisectLogPath = path.join(getHighchartsDir(), '.git', 'BISECT_LOG');
        if (fs.existsSync(bisectLogPath)) {
            return false;
        }

        const currentFiles = listAllFilesRecursively(_samplesDir),
            added = [...currentFiles].filter(f => !_previousFiles.has(f)),
            removed = [..._previousFiles].filter(f => !currentFiles.has(f));

        _previousFiles = currentFiles;

        return added.length > 0 || removed.length > 0;
    }

    function handleFileChange(eventType, filename) {
        if (!filename || wss.clients.size === 0) {
            return;
        }

        clearTimeout(_timeout);
        _timeout = setTimeout(() => {
            const reload = samplesStructureChanged() ? 'top' : 'main';
            console.log(
                'file changed',
                filename,
                reload
            );
            broadcastMessage(wss, JSON.stringify({ reload }));
        }, 100);
    }

    // Add watch on the directories that affects samples
    [
        _samplesDir,
        `${getHighchartsDir()}/ts/`,
        `${getHighchartsDir()}/css/`
    ].forEach(dir => {
        if (fs.existsSync(dir)) {
            const watcher = fs.watch(dir, {
                persistent: true,
                recursive: true
            }, handleFileChange);
            _fsWatchers.push(watcher);
        }
    });

    _libProcessFile =
        `${getHighchartsDir()}/node_modules/_gulptasks_lib_process.json`;
    fs.watchFile(_libProcessFile, () => {
        let libProcess = '';
        try {
            libProcess = fs.readFileSync(_libProcessFile, 'utf8');
        } catch (e) {}

        broadcastMessage(wss, libProcess);
    });

    console.log(`File watchers initialized for ${getHighchartsDir()}`);
}

export function reinitWatchers() {
    if (_wss) {
        initWatchers(_wss);
    }
}

export function startWatchServer(server) {
    _wss = new WebSocket.Server({ server });

    _wss.on('connection', (ws) => {
        console.log(
            `WebSocket connection established, currently ${_wss.clients.size} clients connected`
        );

        ws.on('message', (message) => {
            console.log('received: %s', message);
            ws.send(`Hello, you sent -> ${message}`);
        });
    });

    initWatchers(_wss);
};
