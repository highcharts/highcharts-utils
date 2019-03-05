'use strict';

const execSync = require('child_process').execSync;

const parseAuthor = /^Author:\s+([^<]*)/m;
const parseCommit = /^commit\s+([0-9a-f]{40,})/m;
const parseDate = /^Date:\s+(.*)$/m;
const parseEmail = /^Author:\s+[^<]*<([^>]+)>/m;

module.exports = function (cwd) {

    const output = execSync('git log -n 1', {cwd}).toString().split('\n\n', 2);
    const info = output[0];
    const result = { message: (output[1] || '').trim() };

    if (parseAuthor.test(info)) {
        result.author = parseAuthor.exec(info)[1].trim();
        parseAuthor.lastIndex = 0;
    }
    if (parseCommit.test(info)) {
        result.commit = parseCommit.exec(info)[1].trim();
        parseCommit.lastIndex = 0;
    }
    if (parseDate.test(info)) {
        result.date = parseDate.exec(info)[1].trim();
        parseDate.lastIndex = 0;
    }
    if (parseEmail.test(info)) {
        result.email = parseEmail.exec(info)[1].trim();
        parseEmail.lastIndex = 0;
    }

    return result;
}
