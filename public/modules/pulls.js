/* global timeago */
import { createOAuthAppAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-app@3";
import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";
import auth from '/pulls/auth';

const octokit = new Octokit({
    authStrategy: createOAuthAppAuth,
    auth
});

const globalPulls = [];

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
    document.getElementById('refresh').disabled = false;
}

const getUl = pull => {
    if (pull.draft) {
        return ulDrafts;
    }

    if (pull.decoration?.read) {
        return ulPullsRead;
    }

    return ulPulls;
}

const decoratePull = async (pull) => {
    console.log('@decoratePull', pull.title);
    const decoration = {};

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

    decoration.comments = comments.data
        .concat(reviews.data)
        .concat(reviewComments.data);
        decoration.comments.sort((a, b) =>
        Date.parse(a.created_at || a.submitted_at) -
        Date.parse(b.created_at || b.submitted_at)
    );

    if (decoration.comments.length) {
        decoration.lastComment = decoration.comments[decoration.comments.length - 1];
        decoration.myLastComment = decoration.comments.slice().reverse()
            .find(c => c.user.login === 'TorsteinHonsi');
        if (decoration.myLastComment) {
            myLastInteraction = Math.max(
                myLastInteraction,
                Date.parse(
                    decoration.myLastComment.created_at ||
                    decoration.myLastComment.submitted_at
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
    decoration.commits = commits.data;

    if (decoration.commits.length) {
        decoration.lastCommit = decoration.commits[decoration.commits.length - 1];
        decoration.myLastCommit = decoration.commits.slice().reverse()
            .find(c => c.author.login === 'TorsteinHonsi');
        if (decoration.myLastCommit) {
            myLastInteraction = Math.max(
                myLastInteraction,
                Date.parse(decoration.myLastCommit.commit.author.date)
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
    let newComments =  (decoration.comments || []).filter(
        c =>
        Date.parse(c.created_at || c.submitted_at) > myLastInteraction
    );
    let newCommits = (decoration.commits || []).filter(
        c => Date.parse(c.commit.author.date) > myLastInteraction
    );

    decoration.newInteractions = newComments.length + newCommits.length;

    decoration.newInteractionsTitle =
        newComments.map(c =>
            '@' + c.user.login + ': ' + c.body.substr(0, 60)
        ).join('\n') +
        '\n' +
        newCommits.map(c =>
            '@' + c.author.login + ': ' + c.commit.message
        ).join('\n');

    if (decoration.newInteractions === 0) {
        decoration.read = true;
    }
    pull.decoration = decoration;
}

const updatePageTitle = () => {
    // Update page status
    const openPulls = document.getElementById('pulls').children.length;
    document.title = openPulls ? `${docTitle} (${openPulls})` : docTitle;
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

    if (pull.decoration?.newInteractions) { // !undefined or > 0
        li.innerHTML += `
        <span class="badge bg-primary rounded-pill"
            title="${pull.decoration.newInteractionsTitle}">
            ${pull.decoration.newInteractions}
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

    updatePageTitle();
}

const runUpdate = async () => {

    document.getElementById('refresh').disabled = true;

    const pulls = await octokit.pulls.list({
        ...repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page
    }).catch(e => console.error(e));

    const dateNow = Date.now();

    // for (let pull of pulls.data) {
    pulls.data.forEach(pull => {
        // Add to global pulls
        const existingPull = globalPulls.find(p => p.number === pull.number);
        if (!existingPull) {
            console.log('@runUpdate', 'Added item ', pull.title);
            pull.decoration = {
                newlyLoaded: true
            };
            globalPulls.push(pull);
        }

        /*
        pull.read = Date.parse(pull.updated_at) <= lastUpdate;

        // Preserve decoration
        if (pull.read && existingPull) {
            pull = existingPull;
        }

        if (!pull.draft && !pull.read) {
            decoratePull(pull);
        }

        renderPull(pull);

        i++;
        */
    });

    // Remove closed pulls from globalPulls
    globalPulls.forEach((pull, i) => {
        const updatedPull = pulls.data.find(p => p.number === pull.number);
        if (!updatedPull) {
            console.log('@runUpdate', 'Removed item ', pull.title);
            globalPulls.splice(i, 1);
        }
    });


    // Decorate new pulls and render
    for (let pull of globalPulls) {
        if (Date.parse(pull.updated_at) > lastUpdate) {
            console.log('@runUpdate', 'Updated item', pull.title);
        }
        if (pull.draft) {
            delete pull.decoration;

        } else if (
            pull.decoration?.newlyLoaded ||
            Date.parse(pull.updated_at) > lastUpdate
        ) {
            await decoratePull(pull);
        }

        renderPull(pull);
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

    updatePageTitle();

    lastUpdate = dateNow;

    clearTimeout(timeout);
    timeout = setTimeout(checkForUpdates, nextUpdate);

    document.getElementById('refresh').disabled = false;
}

(async () => {
    await runUpdate();

    document.getElementById('refresh').addEventListener('click', async () => {
        nextUpdate = 60000;
        await checkForUpdates();
    });
})();