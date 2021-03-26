/* global timeago */
import { createOAuthAppAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-app@3";
import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";
import auth from '/pulls/auth';

const octokit = new Octokit({
    authStrategy: createOAuthAppAuth,
    auth
});

const per_page = 20;
const docTitle = document.title;

const ulDrafts = document.getElementById('drafts');
const ulPullsRead = document.getElementById('pulls-read');
const ulPulls = document.getElementById('pulls');

let lastUpdate = 0;

const repo = {
    owner: 'highcharts',
    repo: 'highcharts'
};

let nextUpdate = 60000;
let timeout;
const checkForUpdates = async () => {
    const pulls = await octokit.pulls.list({
        ...repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page: 1
    }).catch(e => console.error(e));

    // Increasingly longer intervals as time goes without action
    nextUpdate *= 1.1;
    timeout = setTimeout(checkForUpdates, nextUpdate);

    const hasUpdates = Date.parse(pulls.data[0].updated_at) > lastUpdate;
    console.log('@checkForUpdates', hasUpdates)
    if (hasUpdates) {
        await runUpdate();
    }
}

const getUl = pull => {
    if (pull.draft) {
        return ulDrafts;
    }

    if (pull.read) {
        return ulPullsRead;
    }

    return ulPulls;
}


// Render
const renderPull = pull => {
    const id = `pull-${pull.number}`;

    let li = document.getElementById(id);
    if (!li) {
        li = document.createElement('li');
        li.id = id;
        li.className = 'pull list-group-item';
        li.dataset.number = pull.number;
        li.dataset.datetime = Date.parse(pull.updated_at);
        getUl(pull).appendChild(li);
    }

    li.innerHTML = `
        <a href="https://github.com/highcharts/highcharts/pull/${pull.number}"
                target="_blank">
            ${pull.title}
        </a>
    `;

    if (pull.newInteractions) { // !undefined or > 0
        li.innerHTML += `
        <span class="badge bg-primary rounded-pill"
            title="${pull.newInteractionsTitle}">
            ${pull.newInteractions}
        </span>
    `;
    }

    li.innerHTML += `
        <div style="width: 100%">
            <small class="text-muted">
                #${pull.number} opened
                <span class="timeago" datetime="${pull.created_at}"></span>
                by ${pull.user.login}
                <i class="fa fa-clock-o"></i> updated
                <span class="timeago" datetime="${pull.updated_at}"></span>
            </small>
        </div>
    `;

    timeago().render(document.querySelectorAll('.timeago'));
}

const globalPulls = [];

const runUpdate = async () => {

    console.clear();

    document.getElementById('refresh').disabled = true;

    const pulls = await octokit.pulls.list({
        ...repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page
    }).catch(e => console.error(e));

    const dateNow = Date.now();

    let i = 0;
    for (let pull of pulls.data) {

        const existingPull = globalPulls.find(p => p.number === pull.number);
        if (!existingPull) {
            globalPulls.push(pull);
        }

        pull.read = Date.parse(pull.updated_at) <= lastUpdate;

        // Preserve decoration
        if (pull.read && existingPull) {
            pull = existingPull;
        }

        if (!pull.draft && !pull.read) {

            let myLastInteraction = 0;

            const comments = await octokit.issues.listComments({
                ...repo,
                issue_number: pull.number
            }).catch(e => console.error(e));

            const reviews = await octokit.pulls.listReviews({
                ...repo,
                pull_number: pull.number
            }).catch(e => console.error(e));

            const reviewComments = await octokit.pulls.listReviewComments({
                ...repo,
                pull_number: pull.number
            }).catch(e => console.error(e));

            pull.comments = comments.data
                .concat(reviews.data)
                .concat(reviewComments.data);
            pull.comments.sort((a, b) =>
                Date.parse(a.created_at || a.submitted_at) -
                Date.parse(b.created_at || b.submitted_at)
            );

            if (pull.comments.length) {
                pull.lastComment = pull.comments[pull.comments.length - 1];
                pull.myLastComment = pull.comments.slice().reverse()
                    .find(c => c.user.login === 'TorsteinHonsi');
                if (pull.myLastComment) {
                    myLastInteraction = Math.max(
                        myLastInteraction,
                        Date.parse(
                            pull.myLastComment.created_at ||
                            pull.myLastComment.submitted_at
                        )
                    );
                }
            }

            /*
            // Events like assigned, tagged, review_requested
            const { data: events } = await octokit.issues.listEvents({
                owner: 'highcharts',
                repo: 'highcharts',
                issue_number: pull.number
            }).catch(e => console.error(e));
            pull.events = events;
            */


            const commits = await octokit.pulls.listCommits({
                ...repo,
                pull_number: pull.number
            }).catch(e => console.error(e));
            pull.commits = commits.data;

            if (pull.commits.length) {
                pull.lastCommit = pull.commits[pull.commits.length - 1];
                pull.myLastCommit = pull.commits.slice().reverse()
                    .find(c => c.author.login === 'TorsteinHonsi');
                if (pull.myLastCommit) {
                    myLastInteraction = Math.max(
                        myLastInteraction,
                        Date.parse(pull.myLastCommit.commit.author.date)
                    );
                }
            }

            /* Must have checks:read permission
            if (pull.lastCommit) {
                const checks = await octokit.checks.listForRef({
                    ...repo,
                    ref: pull.lastCommit.sha,
                }).catch(e => console.error(e));
                pull.checks = checks.data;
            }
            */

            // Count new interactions since myLastInteraction
            let newComments =  (pull.comments || []).filter(
                c =>
                Date.parse(c.created_at || c.submitted_at) > myLastInteraction
            );
            let newCommits = (pull.commits || []).filter(
                c => Date.parse(c.commit.author.date) > myLastInteraction
            );

            pull.newInteractions = newComments.length + newCommits.length;

            pull.newInteractionsTitle =
                newComments.map(c =>
                    '@' + c.user.login + ': ' + c.body.substr(0, 60)
                ).join('\n') +
                '\n' +
                newCommits.map(c =>
                    '@' + c.author.login + ': ' + c.commit.message
                ).join('\n');

            if (pull.newInteractions === 0) {
                pull.read = true;

                // Replace the old item in globalPulls so that the `read` status
                // is picked up and the item placed in the correct column
                const index = globalPulls.findIndex(
                    p => p.number === pull.number
                );
                if (index > -1) {
                    globalPulls[index] = pull;
                }
            }
        }

        renderPull(pull);

        i++;
    }

    if (lastUpdate > 0) {
        // Loop over the visible elements. If the corresponding pull doesn't
        // exist in the data, it has been closed or drafted.

        [...document.querySelectorAll('li.pull')]
            .sort((a, b) => b.dataset.datetime - a.dataset.datetime)
            .forEach(li => {

                // If the pull is not part of the last fetch, it is closed
                if (!pulls.data.find(p => p.number == li.dataset.number)) {
                    li.remove();

                // Append to the appropriate column
                } else {
                    const pull = globalPulls.find(p =>
                        p.number == li.dataset.number
                    )
                    // Re-insert in sorted order in updated column
                    getUl(pull).appendChild(li);
                }
            });
    }

    const openPulls = document.getElementById('pulls').children.length;
    document.title = openPulls ? `${docTitle} (${openPulls})` : docTitle;

    lastUpdate = dateNow;

    clearTimeout(timeout);
    timeout = setTimeout(checkForUpdates, nextUpdate);

    document.getElementById('refresh').disabled = false;
}

(async () => {
    await runUpdate();

    document.getElementById('refresh').addEventListener('click', async () => {
        nextUpdate = 60000;
        await runUpdate();
    });
})();