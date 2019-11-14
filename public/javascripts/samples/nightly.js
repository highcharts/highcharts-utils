/* global Highcharts, results */

const BUCKET = 'https://s3.eu-central-1.amazonaws.com/staging-vis-dev.highcharts.com';

let compareToggleInterval;
const compare = (sample, date) => { // eslint-disable-line no-unused-vars

    const dateString = Highcharts.dateFormat('%Y-%m-%d', date);
    const reference = document.getElementById('reference');
    const candidate = document.getElementById('candidate');
    const diff = window.results && results[date][sample];

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
        `${BUCKET}/visualtests/reference/latest/${sample}/reference.svg`;

    if (diff !== 0) {
        candidate.onerror = function () {
            document.getElementById('image-status').innerHTML =
                'Error loading candidate, indicating that it is identical to the reference and therefore not saved.';
            clearInterval(compareToggleInterval);
        }
        candidate.src =
            `${BUCKET}/visualtests/diffs/nightly/${dateString}/${sample}/candidate.svg`;
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

