/* global Highcharts */
const compare = (sample, date) => { // eslint-disable-line no-unused-vars

    const dateString = Highcharts.dateFormat('%Y-%m-%d', date);
    const folder = sample.split('/')[2];
    document.getElementById('reference').src = 
        `https://s3.eu-central-1.amazonaws.com/staging-code.highcharts.com/test/visualtests/reference/latest/${folder}/reference.svg`
    document.getElementById('candidate').src = 
        `https://s3.eu-central-1.amazonaws.com/staging-code.highcharts.com/test/visualtests/diffs/${dateString}/${folder}/candidate.svg`;
        
        
    let showingCandidate = false;
    const toggle = () => {
        showingCandidate = !showingCandidate;
        document.getElementById('candidate').style.opacity = showingCandidate ? 1 : 0.001;
        document.getElementById('image-status').innerHTML = showingCandidate ?
            '<h4>Showing candidate</h4><small>Click image to show reference</small>' :
            '<h4>Showing reference</h4><small>Click image to show candidate</small>';
        
    }
    toggle();
    document.getElementById('candidate').addEventListener('click', toggle);

};

(async () => {
    const startDate = Date.UTC(2019, 7, 8);
    const endDate = Date.UTC(2019, 7, 9);
    const results = {};
    const samples = {};
    for (let date = startDate; date <= endDate; date += 24 * 36e5) {
        const dateString = Highcharts.dateFormat('%Y-%m-%d', date);
        const result = await fetch(`https://s3.eu-central-1.amazonaws.com/staging-code.highcharts.com/test/visualtests/diffs/${dateString}/visual-test-results.json`);
        const data = await result.json();
        results[date] = data;
        Object.keys(data).forEach(key => {
            if (key !== 'meta') {
                samples[key] = true
            }
        });
    }
    
    // Render header
    let tr = `<tr><th></th>`;
    for (let date = startDate; date <= endDate; date += 24 * 36e5) {
        const dateString = Highcharts.dateFormat('%Y-%m-%d', date);
        tr += `<th>${dateString}</th>`; 
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
            let diff = results[date][sample];
            if (diff > 0) {
                diff = `<a href="javascript:compare('${sample}', ${date})">${diff}</a>`;
            }
            tr += `<td>${diff}</td>`;   
        }
        tr += '</tr>';
        
        document.getElementById('table').innerHTML += tr;
    });
    
})();