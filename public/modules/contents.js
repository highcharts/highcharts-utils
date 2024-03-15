/* global controller */
import { Octokit } from 'https://esm.sh/@octokit/rest';
const octokit = new Octokit();

(async () => {
    const pull = await octokit.rest.pulls.get({
  		owner: 'highcharts',
  		repo: 'highcharts',
  		head: `highcharts:${controller.server.branch}`
	});

    const files = await octokit.rest.pulls.listFiles({
        owner: 'highcharts',
        repo: 'highcharts',
        pull_number: pull.data[0].number
    });

    const arrayUnique = (arr) => { return Array.from(new Set(arr)) };

    const samples = arrayUnique(
        files.data
            .filter(f => (
                f.filename.indexOf('samples') === 0 &&
                /demo\.(html|js|css)$/.test(f.filename) &&
                f.status !== 'removed'
            ))
            .map(f => f.filename
                .replace(/^samples\//, '')
                .replace(/\/[a-z0-9\-]+\.[a-z0-9]+$/, ''))
    );

    if (samples.length) {
        const div = document.querySelector('#main-nav #changed-samples');
        div.classList.remove('hidden');

        div.innerHTML += `<h4>
            Changes in this PR (<a
                target="_blank"
                href="https://github.com/highcharts/highcharts/pull/${pull.data[0].number}">
                #${pull.data[0].number}</a>)
            <a class="close-icon" href="javascript:void(0)"
                onclick="document.querySelector('#changed-samples')
                    .classList.toggle('hidden')">
                <i class="fa fa-close"></i></a>
            </a>

        </h4>
        <div id="changed-samples-body"></div>`;
        samples.forEach(path => {
            const a = document.createElement('a');
            a.innerText = path;
            a.href = `/samples/view?path=${path}`;
            a.target = 'main';

            div.querySelector('#changed-samples-body').appendChild(a);
        })
    }

})();