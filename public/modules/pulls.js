/* global timeago */
// import { createOAuthAppAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-app@3";
// import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";
// import auth from '/pulls/auth';

/*
const octokit = new Octokit({
    authStrategy: createOAuthAppAuth,
    auth
});
*/

const globalPulls = [];

const docTitle = document.title;

const ulDrafts = document.getElementById('drafts');
const ulPullsRead = document.getElementById('pulls-read');
const ulPulls = document.getElementById('pulls');

let lastUpdate = 0;
let nextUpdate = 60000;
let timeout;

let authenticatedUser;


const getUser = async () => {
    const response = await fetch('/pulls/authenticated-user');
    const user = response.ok && await response.json().catch(() => {
        document.getElementById('error').innerHTML =
            `Error retrieving current user. Bad access token? Get a token
            from <a href="https://github.com/settings/tokens">https://github.com/settings/tokens</a>
            and set it as GH_PERSONAL_ACCESS_TOKEN in <code>.env</code>`;
        document.getElementById('error').style.display = 'block';
        document.getElementById('canban').style.display = 'none';
    });

    return user.data.login;

}

const checkForUpdates = async () => {
    document.getElementById('refresh').disabled = true;
    const result = await fetch('/pulls/last-update');
    const { updatedAt } = await result.json();

    // Increasingly longer intervals as time goes without action
    nextUpdate *= 1.1;
    clearTimeout(timeout);
    timeout = setTimeout(checkForUpdates, nextUpdate);

    const hasUpdates = Date.parse(updatedAt) > lastUpdate;
    console.log(
        '@checkForUpdates',
        'hasUpdates:', hasUpdates,
        'lastUpdate:', new Date(lastUpdate),
        // 'pull:', pulls.data[0]
    )
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

    let result = await fetch(`/pulls/list-comments/${pull.number}`);
    const { comments } = await result.json();
    result = await fetch(`/pulls/list-reviews/${pull.number}`);
    const { reviews } = await result.json();
    result = await fetch(`/pulls/list-review-comments/${pull.number}`);
    const { reviewComments } = await result.json();

    decoration.comments = comments
        .concat(reviews)
        .concat(reviewComments);
        decoration.comments.sort((a, b) =>
        Date.parse(a.created_at || a.submitted_at) -
        Date.parse(b.created_at || b.submitted_at)
    );

    if (decoration.comments.length) {
        decoration.lastComment = decoration.comments[decoration.comments.length - 1];
        decoration.myLastComment = decoration.comments.slice().reverse()
            .find(c => c.user.login === authenticatedUser);
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


    result = await fetch(`/pulls/list-commits/${pull.number}`);
    const { commits } = await result.json();
    decoration.commits = commits;

    if (decoration.commits.length) {
        decoration.lastCommit = decoration.commits[decoration.commits.length - 1];
        decoration.myLastCommit = decoration.commits.slice().reverse()
            .find(c => c.author && c.author.login === authenticatedUser);
        if (decoration.myLastCommit) {
            myLastInteraction = Math.max(
                myLastInteraction,
                Date.parse(decoration.myLastCommit.commit.author.date)
            );
        }
    }

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
            '@' + c.user.login + ': ' + c.body.substr(0, 60).replace(/</g, '&lt;').replace(/>/g, '&gt;')
        ).join('\n') +
        '\n' +
        newCommits.map(c =>
            '@' + c.author.login + ': ' + c.commit.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        ).join('\n');


    if (decoration.newInteractions === 0) {
        decoration.read = true;
    } else if (decoration.lastCommit) {
        result = await fetch(`/pulls/list-checks/${decoration.lastCommit.sha}`);
        const { checks } = await result.json();
        const latestChecks = checks.reduce((acc, cur) => {
            const key = cur.context;
            if (!acc[key]) {
                acc[key] = cur.state;
            }
            return acc;
        }, {});
        const values = Object.values(latestChecks);

        let state = 'pending';
        if (values.length > 0) {
            state =
                values.indexOf('failure') !== -1 ? 'failure' :
                    values.indexOf('pending') !== -1 ? 'pending' :
                        'success';
        }
        decoration.state = state;
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
        getUl(pull).appendChild(li);
    }
    li.dataset.datetime = Date.parse(pull.updated_at);

    li.innerHTML = `
        <a href="https://github.com/highcharts/highcharts/pull/${pull.number}"
                target="_blank">
            ${pull.title}
            <span class="state state-${pull.decoration?.state}"></span>
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

    const result = await fetch('/pulls/list');
    const { pulls } = await result.json();

    const dateNow = Date.now();

    // for (let pull of pulls.data) {
    pulls.forEach(pull => {
        // Add to global pulls
        const existingPull = globalPulls.find(p => p.number === pull.number);
        if (!existingPull) {
            console.log('@runUpdate', 'Added item ', pull.title);
            pull.decoration = {
                newlyLoaded: true
            };
            globalPulls.push(pull);

        // If it exists, but is updated, replace it in globalPulls
        } else if (
            Date.parse(pull.updated_at) > Date.parse(existingPull.updated_at)
        ) {
            console.log('@runUpdate', 'Updated item', pull.title);
            globalPulls[globalPulls.indexOf(existingPull)] = pull;
        }
    });

    // Remove closed pulls from globalPulls
    globalPulls.forEach((pull, i) => {
        const updatedPull = pulls.find(p => p.number === pull.number);
        if (!updatedPull) {
            console.log('@runUpdate', 'Removed item ', pull.title);
            globalPulls.splice(i, 1);
        }
    });


    // Decorate new pulls and render
    for (let pull of globalPulls) {
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
                const pull = globalPulls.find(p =>
                    p.number == li.dataset.number
                );

                // Append to the appropriate column
                if (pull) {
                    // Re-insert in sorted order in updated column
                    setTimeout(() => {
                        getUl(pull).appendChild(li);
                    }, 600);
                } else {
                    // Closed pull, squeeze out
                    li.style.height = li.offsetHeight + 'px';
                    li.style.overflow = 'hidden';
                    li.style.transition = 'height 500ms, opacity 500ms, padding-top 500ms, padding-bottom 500ms';
                    li.style.height = 0;
                    li.style.opacity = 0;
                    li.style.paddingTop = 0;
                    li.style.paddingBottom = 0;
                    setTimeout(() => {
                        li.remove();
                        updatePageTitle();
                    }, 500);
                }
            });
    }

    updatePageTitle();

    lastUpdate = dateNow;

    clearTimeout(timeout);
    timeout = setTimeout(checkForUpdates, nextUpdate);

}

(async () => {

    authenticatedUser = await getUser();

    await runUpdate();

    document.getElementById('refresh').disabled = false;

    const checkNow = async () => {
        nextUpdate = 60000;
        await checkForUpdates();
    }

    document.getElementById('refresh').addEventListener('click', checkNow);
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
            await checkNow();
        }
    });

})();