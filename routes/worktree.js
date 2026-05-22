import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listWorktrees } from '../lib/worktree.js';
import { getHighchartsDir, highchartsDir, invalidateHighchartsDirCache } from '../lib/arguments.js';
import { reinitWatchers } from '../lib/websocket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

export let onWorktreeChanged = () => {};

router.get('/', (req, res) => {
    const worktrees = listWorktrees(highchartsDir);
    const activeDir = getHighchartsDir();
    res.json({ worktrees, activeDir: path.resolve(activeDir) });
});

router.post('/select', async (req, res) => {
    const { path: selectedPath } = req.body;
    const worktrees = await listWorktrees(highchartsDir);
    const knownPaths = worktrees.map(w => w.path || w);

    const worktree = worktrees.find(w => (w.path || w) === selectedPath);
    if (!worktree || !knownPaths.includes(selectedPath)) {
        return res.status(400).json({ error: 'Invalid worktree path' });
    }
    if (worktree.isValid === false) {
        return res.status(400).json({ error: 'Worktree path is no longer valid' });
    }

    const configPath = path.join(__dirname, '..', 'temp', 'config-user.json');
    let config = {};
    try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
        // File may not exist yet
    }

    config.worktreeDir = selectedPath;
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf-8');
    } catch (e) {
        return res.status(500).json({ error: 'Failed to persist worktree selection' });
    }

    invalidateHighchartsDirCache();
    onWorktreeChanged();
    reinitWatchers();

    res.json({ ok: true, path: selectedPath });
});

export default router;
