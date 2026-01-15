/* global controller */
import { Octokit } from 'https://esm.sh/@octokit/rest';
const octokit = new Octokit();

const placeElements = () => {
    const topNav = document.querySelector('#top-nav'),
        mainNav = document.querySelector('#main-nav'),
        changedSamples = document.querySelector('#changed-samples');

    mainNav.style.top = `${topNav.offsetHeight}px`;
    mainNav.style.bottom = `${changedSamples.offsetHeight}px`;
    changedSamples.style.bottom = 0;
}

window.toggleChangedSamples = () => {
    function placeElementAnimated() {
        const start = Date.now();
        function loop() {
            placeElements();
            if (Date.now() - start < 300) {
                requestAnimationFrame(loop);
            }
        }
        loop();
    }

    const changedSamples = document.querySelector('#changed-samples'),
        changedSamplesBody = document.querySelector('#changed-samples-body');
    changedSamples.classList.toggle('collapsed');

    if (changedSamples.classList.contains('collapsed')) {
        setTimeout(() => {
            // So that we can tab down from the search filter
            changedSamplesBody.classList.add('hidden');
        }, 250);
    } else {
        changedSamplesBody.classList.remove('hidden');
    }


    placeElementAnimated();

}


placeElements();
window.addEventListener('resize', placeElements);

(async () => {

    const pull = await octokit.rest.pulls.get({
  		owner: 'highcharts',
  		repo: 'highcharts',
  		head: `highcharts:${controller.server.branch}`
	});

    if (pull.data.length === 0) {
        return;
    }

    const files = pull && await octokit.rest.pulls.listFiles({
        owner: 'highcharts',
        repo: 'highcharts',
        pull_number: pull.data[0].number
    }).catch(() => null) || { data: [] };

    const arrayUnique = (arr) => { return Array.from(new Set(arr)) };

    const samples = arrayUnique(
        files.data
            .filter(f => (
                f.filename.indexOf('samples') === 0 &&
                /(config|demo)\.(html|js|css|ts)$/.test(f.filename) &&
                f.status !== 'removed'
            ))
            .map(f => f.filename
                .replace(/^samples\//, '')
                .replace(/\/[a-z0-9\-]+\.[a-z0-9]+$/, ''))
    );

    if (samples.length) {
        const div = document.querySelector('#changed-samples');
        div.classList.remove('hidden');

        div.innerHTML += `<h4>
            <a href="javascript:toggleChangedSamples()" class="toggle">
                <i class="fa fa-caret-down"></i>
                Changed in this PR
            </a>

            (<a target="_blank"
                href="https://github.com/highcharts/highcharts/pull/${pull?.data[0].number}">
                #${pull?.data[0].number}</a>)

        </h4>
        <div id="changed-samples-body"></div>`;
        samples.forEach(path => {
            const a = document.createElement('a');
            a.innerText = path;
            a.href = `/samples/view?path=${path}`;
            a.target = 'main';

            div.querySelector('#changed-samples-body').appendChild(a);
        });
    }

})();