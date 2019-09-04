/* global Highcharts, latestReleaseDate */

const BUCKET = 'https://s3.eu-central-1.amazonaws.com/staging-code.highcharts.com';

let compareToggleInterval;
const compare = (sample, date) => { // eslint-disable-line no-unused-vars

    const dateString = Highcharts.dateFormat('%Y-%m-%d', date);
    const reference = document.getElementById('reference');
    const candidate = document.getElementById('candidate');
        
    let showingCandidate = false;

    const toggle = () => {
        showingCandidate = !showingCandidate;
        candidate.style.visibility =
            showingCandidate ? 'visible' : 'hidden';
        reference.style.visibility =
            showingCandidate ? 'hidden' : 'visible';
        document.getElementById('image-status').innerHTML = showingCandidate ?
            '<b>Showing candidate</b> <small>Click image to swap manually</small>' :
            '<b>Showing reference</b> <small>Click image to swap manually</small>';
        
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

    reference.src = 
        `${BUCKET}/test/visualtests/reference/latest/${sample}/reference.svg`
    candidate.src = 
        `${BUCKET}/test/visualtests/diffs/${dateString}/${sample}/candidate.svg`;


    document.getElementById('comparison-path').innerHTML = sample;
    toggle();
    
    clearInterval(compareToggleInterval); // Clear previous runs
    compareToggleInterval = setInterval(toggle, 500);

    document.getElementById('images').addEventListener('click', () => {
        clearInterval(compareToggleInterval);
        toggle();
    });


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
    
    const results = {};
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
            const dateString = Highcharts.dateFormat('%d', date);
            table += `<th>${dateString}</th>`;
        }
    }
    table += '</tr>';

    
    // Render results
    Object.keys(samples).sort().forEach(sample => {
        let tr = `
            <tr id="tr-${sample}">
                <th class="path"><span>${sample}</span></th>
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
                if (results[date][sample] !== undefined) {
                    diff = results[date][sample];
                    onclick = `compare('${sample}', ${date})`;
                    className = 'active';
                    opacity = (diff / maxDiff).toPrecision(2);
                }
                tr += `
                <td onclick="${onclick}" title="${dateString}\n${sample}\n${diff} pixels are different"
                        class="${className}" style="background-color: rgba(241, 92, 128, ${opacity}">
                    <span>${diff}</span>
                </td>`;
            }
        }
        tr += '</tr>';
        
        table += tr;
        
    });
    document.getElementById('table').innerHTML = table;
    
});
