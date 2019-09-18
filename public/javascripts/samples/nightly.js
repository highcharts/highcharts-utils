/* global Highcharts, latestReleaseDate */

const BUCKET = 'https://s3.eu-central-1.amazonaws.com/staging-code.highcharts.com';
const results = {};

let compareToggleInterval;
const compare = (sample, date) => { // eslint-disable-line no-unused-vars

    const dateString = Highcharts.dateFormat('%Y-%m-%d', date);
    const reference = document.getElementById('reference');
    const candidate = document.getElementById('candidate');
    const diff = results[date][sample];

    let showingCandidate = true;

    const toggle = () => {
        let innerHTML;
        showingCandidate = !showingCandidate;
        candidate.style.visibility =
            showingCandidate ? 'visible' : 'hidden';
        reference.style.visibility =
            showingCandidate ? 'hidden' : 'visible';

        if (diff === 0) {
            innerHTML = '<b style="color:green">Reference and candidate are identical</b>';
        } else if (showingCandidate) {
            innerHTML = '<b>Showing candidate</b> <small>Click image to swap manually</small>';
        } else {
            innerHTML = '<b>Showing reference</b> <small>Click image to swap manually</small>';
        }
        document.getElementById('image-status').innerHTML = innerHTML;
        
    }

    const openPopup = () => {
        document.getElementById('comparison').style.display = 'block';


        document.querySelectorAll('tr.active').forEach((tr) => 
            tr.classList.remove('active')
        );
        document.getElementById(`tr-${sample}`).classList.add('active');
    }

    const closePopup = () => {
        document.getElementById('comparison').style.display = 'none';
        document.getElementById(`tr-${sample}`).classList.remove('active');
    }

    reference.onload = candidate.onload = function () {
        document.getElementById('images').style.height =
            `${this.naturalHeight}px`;
    }

    reference.src = 
        `${BUCKET}/test/visualtests/reference/latest/${sample}/reference.svg`;

    if (diff !== 0) {
        candidate.src = 
            `${BUCKET}/test/visualtests/diffs/${dateString}/${sample}/candidate.svg`;
    }


    document.getElementById('comparison-path').innerHTML = sample;
    toggle();
    
    clearInterval(compareToggleInterval); // Clear previous runs

    if (diff !== 0) {
        compareToggleInterval = setInterval(toggle, 500);

        document.getElementById('images').addEventListener('click', () => {
            clearInterval(compareToggleInterval);
            toggle();
        });
    }


    // Open window
    openPopup();

    // Bind close button
    document.getElementById('close-comparison').onclick = () => {
        closePopup();
        clearInterval(compareToggleInterval);
    }

};

document.addEventListener('DOMContentLoaded', async () => {
    const endDate = Date.now();
    const startDate = Math.max(
        latestReleaseDate + 24 * 36e5,
        endDate - 90 * 24 * 36e5
    );
    
    const samples = {};
    for (let date = startDate; date <= endDate; date += 24 * 36e5) {
        const dateString = Highcharts.dateFormat('%Y-%m-%d', date);

        try {
            const result = await fetch(
                `${BUCKET}/test/visualtests/diffs/${dateString}/visual-test-results.json`
            );
            const data = await result.json();
            results[date] = data;
            Object.keys(data).forEach(key => {
                if (key !== 'meta') {
                    samples[key] = true
                }
            });
        } catch (e) {
            console.warn(`Failed loading ${dateString}`, e);
        }
    }
    
    // Render header
    let table = `<tr><th></th>`;
    for (let date = startDate; date <= endDate; date += 24 * 36e5) {
        if (results[date]) {
            const dateString = Highcharts.dateFormat('%e', date);
            table += `<th>${dateString}</th>`;
        }
    }
    table += '</tr>';

    
    // Render results
    Object.keys(samples).sort().forEach(sample => {
        let tr = `
            <tr id="tr-${sample}">
                <th class="path">
                    <span>${sample}</span>
                    <a href="/samples/view?path=${sample}" title="View this sample"
                            target="main">
                        <i class="fa fa-eye"></i>
                    </a>
                </th>
        `;
        let maxDiff = 0;
        for (let date = startDate; date <= endDate; date += 24 * 36e5) {
            if (results[date] && typeof results[date][sample] === 'number') {
                maxDiff = Math.max(maxDiff, results[date][sample]);
            }
        }
        for (let date = startDate; date <= endDate; date += 24 * 36e5) {
            if (results[date]) {
                const dateString = Highcharts.dateFormat('%Y-%m-%d', date);
                let diff = '';
                let onclick = '';
                let className = '';
                let opacity = 0;
                let backgroundColor = 'none';
                if (results[date][sample] !== undefined) {
                    diff = results[date][sample];
                    onclick = `compare('${sample}', ${date})`;
                    className = 'active';
                    opacity = (diff / maxDiff).toPrecision(2);

                    backgroundColor = diff === 0 ?
                        '#a4edba' :
                        `rgba(241, 92, 128, ${opacity})`;
                    if (diff > 999) {
                        diff = Math.round(diff / 1000) + 'k';
                    }
                }
                tr += `
                <td onclick="${onclick}" title="${dateString}\n${sample}\n${diff} pixels are different"
                        class="${className}" style="background-color: ${backgroundColor}">
                    <span>${diff}</span>
                </td>`;
            }
        }
        tr += '</tr>';
        
        table += tr;
        
    });
    document.getElementById('table').innerHTML = table;
    
});
