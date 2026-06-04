import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

// List git worktrees for a repository directory.
export function listWorktrees(repoDir) {
    const resolvedRepoDir = resolve(repoDir);

    let output = '';

    try {
        output = execFileSync('git', ['worktree', 'list', '--porcelain', '-z'], {
            cwd: repoDir,
            encoding: 'utf8'
        });
    } catch {
        return [];
    }

    if (!output) {
        return [];
    }

    const worktrees = [];
    let current = null;

    const pushCurrent = () => {
        if (!current?.path) {
            return;
        }

        worktrees.push({
            path: current.path,
            head: current.head ?? null,
            branch: current.branch ?? null,
            branchShort: current.branchShort ?? null,
            detached: !!current.detached,
            bare: !!current.bare,
            isCurrent: resolve(current.path) === resolvedRepoDir,
            isValid: existsSync(current.path)
        });
    };

    for (const record of output.split('\0')) {
        if (!record) {
            pushCurrent();
            current = null;
            continue;
        }

        const [key, ...rest] = record.split(' ');
        const value = rest.join(' ');

        if (key === 'worktree') {
            pushCurrent();
            current = { path: value };
            continue;
        }

        if (!current) {
            continue;
        }

        if (key === 'HEAD') {
            current.head = value || null;
        } else if (key === 'branch') {
            current.branch = value || null;
            current.branchShort = value ? value.replace(/^refs\/heads\//, '') : null;
        } else if (key === 'detached') {
            current.detached = true;
        } else if (key === 'bare') {
            current.bare = true;
        }
    }

    pushCurrent();

    return worktrees;
}
