/* global Highcharts */

const BUCKET = 'https://s3.eu-central-1.amazonaws.com/staging-code.highcharts.com';


const compare = (sample, date) => { // eslint-disable-line no-unused-vars

    const dateString = Highcharts.dateFormat('%Y-%m-%d', date);
    document.getElementById('reference').src = 
        `${BUCKET}/test/visualtests/reference/latest/${sample}/reference.svg`
    document.getElementById('candidate').src = 
        `${BUCKET}/test/visualtests/diffs/${dateString}/${sample}/candidate.svg`;
        
        
    let showingCandidate = false;
    const toggle = () => {
        showingCandidate = !showingCandidate;
        document.getElementById('candidate').style.opacity = showingCandidate ? 1 : 0.001;
        document.getElementById('image-status').innerHTML = showingCandidate ?
            '<h4>Showing candidate</h4><small>Click image to show reference</small>' :
            '<h4>Showing reference</h4><small>Click image to show candidate</small>';
        
    }
    
    let interval = setInterval(toggle, 500);

    document.getElementById('candidate').addEventListener('click', () => {
        clearInterval(interval);
        toggle();
    });

};

(async () => {
    const startDate = Date.UTC(2019, 7, 8);
    const endDate = Date.UTC(2019, 7, 12);
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
            const dateString = Highcharts.dateFormat('%Y-%m-%d', date);
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
        for (let date = startDate; date <= endDate; date += 24 * 36e5) {
            if (results[date]) {
                let diff = results[date][sample];
                if (diff > 0) {
                    diff = `<a href="javascript:compare('${sample}', ${date})">${diff}</a>`;
                }
                tr += `<td>${diff}</td>`;
            }
        }
        tr += '</tr>';
        
        document.getElementById('table').innerHTML += tr;
    });
    
})();