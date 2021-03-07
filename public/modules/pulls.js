import { createOAuthAppAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-app";
import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";
import auth from '/pulls/auth';


// Render
const renderPull = pull => {
    const lastComment = pull.comments.length &&
        pull.comments[pull.comments.length - 1] || {};

    const lastCommit = pull.commits.length &&
        pull.commits[pull.commits.length - 1] || {};

    document.getElementById('pulls').innerHTML += `
    <div class="pull">
        <h4>${pull.title}</h4>
        <div class="comments">
            ${pull.comments.length} comments,
            last by ${lastComment.user.login}
        </div>
        <div class="commits">
            ${pull.commits.length} commits,
            last by ${lastCommit.author.login}
        </div>
    </div>
    `;
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
        per_page: 3
    }).catch(e => console.error(e));


    for (let pull of pulls.data) {
        const comments = await octokit.pulls.listReviewComments({
            owner: 'highcharts',
            repo: 'highcharts',
            pull_number: pull.number
        }).catch(e => console.error(e));
        pull.comments = comments.data;

        const commits = await octokit.pulls.listCommits({
            owner: 'highcharts',
            repo: 'highcharts',
            pull_number: pull.number
        }).catch(e => console.error(e));
        pull.commits = commits.data;

        renderPull(pull);
    }



})();