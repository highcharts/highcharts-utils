/* global timeago */
import { createOAuthAppAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-app";
import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";
import auth from '/pulls/auth';

const per_page = 20;


// Render
const renderPull = pull => {
    /*
    const comments = pull.comments.map(
        c => {
            const date = c.created_at || c.submitted_at;
            return `<div><b>@${c.user.login}:</b> ${c.body.substr(0, 80)} ${date}</div>`
        }
    ).join('');
    */
    document.getElementById('pulls').innerHTML += `
    <li class="pull list-group-item ${pull.className}">
        <a href="https://github.com/highcharts/highcharts/pull/${pull.number}"
                target="_blank">
            ${pull.title}
        </a>
        <span class="badge bg-primary rounded-pill"
            title="${pull.newInteractionsTitle}">
            ${pull.newInteractions}
        </span>
        <div style="width: 100%">
            <small class="text-muted">
                #${pull.number} opened
                <span class="timeago" datetime="${pull.created_at}"></span>
                by ${pull.user.login}
                <i class="fa fa-clock-o"></i> updated
                <span class="timeago" datetime="${pull.updated_at}"></span>
            </small>
        </div>
    </li>
    `;
    timeago().render(document.querySelectorAll('.timeago'));
}

(async () => {

    const octokit = new Octokit({
        authStrategy: createOAuthAppAuth,
        auth
    });

    const pulls = await octokit.pulls.list({
        owner: 'highcharts',
        repo: 'highcharts',
        state: 'open',
        sort: 'updated',
        direction: 'desc',
        per_page
    }).catch(e => console.error(e));

    let i = 0;
    const docTitle = document.title;
    for (let pull of pulls.data) {

        let myLastInteraction = 0;

        // Progress bar
        document.title = docTitle + ' ' +
            new Array(Math.round(i * 6 / per_page)).fill('█').join('') +
            new Array(Math.round((per_page - i) * 6 / per_page)).fill('▁').join('') +
            ' ' + i + '/' + per_page;


        const comments = await octokit.issues.listComments({
            owner: 'highcharts',
            repo: 'highcharts',
            issue_number: pull.number
        }).catch(e => console.error(e));

        const reviews = await octokit.pulls.listReviews({
            owner: 'highcharts',
            repo: 'highcharts',
            pull_number: pull.number
        }).catch(e => console.error(e));

        const reviewComments = await octokit.pulls.listReviewComments({
            owner: 'highcharts',
            repo: 'highcharts',
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
            owner: 'highcharts',
            repo: 'highcharts',
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

        console.log(pull.number, pull.title, pull);

        if (!pull.draft && pull.newInteractions > 0) {
            renderPull(pull);
        }
        i++;

        if (i === per_page) {
            document.title = docTitle;
        }
    }



})();