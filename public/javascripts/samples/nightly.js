/* global Highcharts */

const BUCKET = 'https://s3.eu-central-1.amazonaws.com/staging-code.highcharts.com';

let compareToggleInterval;
const compare = (sample, date) => { // eslint-disable-line no-unused-vars

    const dateString = Highcharts.dateFormat('%Y-%m-%d', date);
        
    let showingCandidate = false;
    const toggle = () => {
        showingCandidate = !showingCandidate;
        document.getElementById('candidate').style.opacity = showingCandidate ? 1 : 0.001;
        document.getElementById('image-status').innerHTML = showingCandidate ?
            '<b>Showing candidate</b> <small>Click image to swap manually</small>' :
            '<b>Showing reference</b> <small>Click image to swap manually</small>';
        
    }

    document.getElementById('reference').src = 
        `${BUCKET}/test/visualtests/reference/latest/${sample}/reference.svg`
    document.getElementById('candidate').src = 
        `${BUCKET}/test/visualtests/diffs/${dateString}/${sample}/candidate.svg`;
    toggle();
    
    clearInterval(compareToggleInterval); // Clear previous runs
    compareToggleInterval = setInterval(toggle, 500);

    document.getElementById('comparison').style.display = 'block';
    document.getElementById('images').addEventListener('click', () => {
        clearInterval(compareToggleInterval);
        toggle();
    });


    // Bind close button
    document.getElementById('close-comparison').onclick = () => {
        document.getElementById('comparison').style.display = 'none';
        clearInterval(compareToggleInterval);
    }

};

(async () => {
    const endDate = Date.now();
    const startDate = Math.max(Date.UTC(2019, 7, 15), endDate - 90 * 24 * 36e5);
    
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
    let tr = `<tr><th></th>`;
    for (let date = startDate; date <= endDate; date += 24 * 36e5) {
        if (results[date]) {
            const dateString = Highcharts.dateFormat('%d', date);
            tr += `<th>${dateString}</th>`;
        }
    }
    tr += '</tr>';

    document.getElementById('table').innerHTML = tr;
    
    // Render results
    Object.keys(samples).sort().forEach(sample => {
        let tr = `
            <tr>
                <th>${sample}</th>
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
                <td onclick="${onclick}" title="${dateString}\n${sample}"
                        class="${className}" style="background-color: rgba(241, 92, 128, ${opacity}">
                    ${diff}
                </td>`;
            }
        }
        tr += '</tr>';
        
        document.getElementById('table').innerHTML += tr;
    });
    
})();