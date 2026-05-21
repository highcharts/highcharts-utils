import { afterEach, describe, mock, test } from 'node:test';
import assert from 'node:assert';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';

const originalExecFileSync = childProcess.execFileSync;
const originalExistsSync = fs.existsSync;

afterEach(() => {
    childProcess.execFileSync = originalExecFileSync;
    fs.existsSync = originalExistsSync;
    syncBuiltinESMExports();
    mock.restoreAll();
});

describe('listWorktrees', () => {
    test('parses multiple worktrees from porcelain output', async () => {
        childProcess.execFileSync = () => (
            'worktree /repo/main\0HEAD abc123\0branch refs/heads/main\0\0worktree /repo/feature\0HEAD def456\0branch refs/heads/feature/branch\0\0'
        );
        fs.existsSync = path => path !== '/repo/feature';
        syncBuiltinESMExports();

        const { listWorktrees } = await import('./worktree.js');

        const worktrees = listWorktrees('/repo/main');

        assert.strictEqual(worktrees.length, 2);
        assert.deepStrictEqual(worktrees[0], {
            path: '/repo/main',
            head: 'abc123',
            branch: 'refs/heads/main',
            branchShort: 'main',
            detached: false,
            bare: false,
            isCurrent: true,
            isValid: true
        });
        assert.deepStrictEqual(worktrees[1], {
            path: '/repo/feature',
            head: 'def456',
            branch: 'refs/heads/feature/branch',
            branchShort: 'feature/branch',
            detached: false,
            bare: false,
            isCurrent: false,
            isValid: false
        });
    });

    test('returns a single worktree when only the main worktree exists', async () => {
        childProcess.execFileSync = () => 'worktree /repo/main\0HEAD abc123\0branch refs/heads/main\0\0';
        fs.existsSync = () => true;
        syncBuiltinESMExports();

        const { listWorktrees } = await import('./worktree.js');

        const worktrees = listWorktrees('/repo/main');

        assert.strictEqual(worktrees.length, 1);
        assert.deepStrictEqual(worktrees[0], {
            path: '/repo/main',
            head: 'abc123',
            branch: 'refs/heads/main',
            branchShort: 'main',
            detached: false,
            bare: false,
            isCurrent: true,
            isValid: true
        });
    });

    test('parses detached HEAD worktrees', async () => {
        childProcess.execFileSync = () => 'worktree /repo/detached\0HEAD abc123\0detached\0\0';
        fs.existsSync = () => true;
        syncBuiltinESMExports();

        const { listWorktrees } = await import('./worktree.js');

        const worktrees = listWorktrees('/repo/detached');

        assert.strictEqual(worktrees.length, 1);
        assert.deepStrictEqual(worktrees[0], {
            path: '/repo/detached',
            head: 'abc123',
            branch: null,
            branchShort: null,
            detached: true,
            bare: false,
            isCurrent: true,
            isValid: true
        });
    });

    test('returns an empty array when git fails', async () => {
        childProcess.execFileSync = () => {
            throw new Error('git not found');
        };
        fs.existsSync = () => true;
        syncBuiltinESMExports();

        const { listWorktrees } = await import('./worktree.js');

        const worktrees = listWorktrees('/repo/main');

        assert.deepStrictEqual(worktrees, []);
    });

    test('marks stale worktree paths as invalid', async () => {
        childProcess.execFileSync = () => (
            'worktree /repo/main\0HEAD abc123\0branch refs/heads/main\0\0worktree /repo/stale\0HEAD def456\0branch refs/heads/feature/stale\0\0'
        );
        fs.existsSync = path => path !== '/repo/stale';
        syncBuiltinESMExports();

        const { listWorktrees } = await import('./worktree.js');

        const worktrees = listWorktrees('/repo/main');

        assert.strictEqual(worktrees.length, 2);
        assert.strictEqual(worktrees[1].isValid, false);
    });

    test('returns an empty array for empty output', async () => {
        childProcess.execFileSync = () => '';
        fs.existsSync = () => true;
        syncBuiltinESMExports();

        const { listWorktrees } = await import('./worktree.js');

        const worktrees = listWorktrees('/repo/main');

        assert.deepStrictEqual(worktrees, []);
    });
});
