
/* eslint-disable */
var ren,
	paths = [];

var mainFrame = window.parent.document.querySelector('frame#main'),
	mainLocation = mainFrame && mainFrame.contentWindow.location.href,
	isComparing = mainLocation && mainLocation.indexOf('view') > -1,
	colors = [
	   '#2f7ed8',
	   '#0d233a',
	   '#8bbc21',
	   '#910000',
	   '#1aadce',
	   '#492970',
	   '#f28f43',
	   '#77a1e5',
	   '#c42525',
	   '#a6c96a',
	   '#2f7ed8',
	   '#0d233a',
	   '#8bbc21',
	   '#910000',
	   '#1aadce',
	   '#492970',
	   '#f28f43',
	   '#77a1e5',
	   '#c42525',
	   '#a6c96a'
	];

// Draw the lines connecting the dots
function drawGraph() {

	const ulElement = document.getElementById('ul');
	const h = (ulElement ? ulElement.offsetHeight : 0) + 200;

	// First time
	if (!ren) {
		ren = new Highcharts.Renderer(
			document.getElementById('graph'),
			300,
			h
		);
	// Update
	} else {
		paths.forEach(function (path, i) {
			if (path && path.destroy) {
				paths[i] = path.destroy();
			}
		});
		paths.length = 0;
	}

	// */

	const parentDots = document.querySelectorAll('div.parents');
	parentDots.forEach(function (item) {
		const doffset = item.getBoundingClientRect();
		const parents = JSON.parse(item.dataset.parents || '[]');

		parents.forEach(function (parent) {
			const parentDot = document.getElementById('dot-' + parent);
			const poffset = parentDot && parentDot.getBoundingClientRect();
			let path;
			let dLeft;
			let pLeft;
			let color;

			if (doffset && poffset) {

				dLeft = Math.round(item.dataset.left || 0) + 9;
				pLeft = Math.round(parentDot.dataset.left || 0) + 9;

				// Straight line
				if (dLeft === pLeft) {
					path = ['M', dLeft, doffset.top,
						'L', pLeft, poffset.top];
					color = item.dataset.color;

				// Curve, merge
				} else if (dLeft < pLeft) {
					path = ['M', dLeft, doffset.top,
						'C', dLeft, doffset.top + 10,
						pLeft, doffset.top + 10,
						pLeft, doffset.top + 20,
						'L',
						pLeft, poffset.top];
					color = parentDot.dataset.color;

				// Curve, fork
				} else {
					path = ['M', dLeft, doffset.top,
						'L', dLeft, poffset.top - 20,
						'C', dLeft, poffset.top - 10,
						pLeft, poffset.top - 10,
						pLeft, poffset.top];
					color = item.dataset.color;
				}

				paths.push(ren.path(path)
					.attr({
						'stroke-width': 2,
						stroke: color
					})
					.add());
			}
		});
	});
};

	document.addEventListener('DOMContentLoaded', function() {
	var activeElement,
		month,
		commits,
		parentHierarchy = {},
		branchCounter = 0;

const closeBtn = document.getElementById('close');
		if (closeBtn && isComparing) {
			closeBtn.addEventListener('click', function () {
			window.parent.parent.controller.toggleBisect();
		});
	}



const log = document.getElementById('gitlog').innerHTML.trim();

		let graphs;
		const lines = log.split('\n');

		lines.forEach((line, idx) => {

		/*var commit = item.match(/commit ([a-f0-9]{40})/)[1],
			$li = $('<li>').appendTo('#ul').data({ commit: commit }),
			date = item.match(/Date:   ([^\n]+)/)[1],
			message = item.match(/     ([^\n]+)/)[1],
			dateObj = new Date(date),
			branchI = parseInt(item.indexOf('*'), 10) / 2;
			*/
		if (line === '') {
			return;
		}
		if (line.indexOf('<br>') === -1) {
			graphs.push(line);

		} else {
const lineArray = line.split('<br>');

				if (lineArray.length < 5) {
					const errorDiv = document.createElement('div');
					errorDiv.style.color = 'red';
					errorDiv.style.margin = '10px';
					errorDiv.innerHTML = '<b>Truncated log, try a shorter time interval.</b><br>' +
						'To do: find out why the log is truncated. It comes from <code>routes/bisect/commits.js</code>.';
					document.getElementById('ul').parentNode.insertBefore(errorDiv, document.getElementById('ul').nextSibling);
				return;
			}

			var graph = line[0],
				commit = line[1],
			li = document.createElement('li'),
			date = line[2],
			dateObj = new Date(
				date.substr(0, 4),
				date.substr(5, 2) - 1,
				+date.substr(8, 2),
				+date.substr(11, 2),
				date.substr(14, 2)
			),
			message = line[3],
			parents = line[4].split(' '),
			branchI = graph.indexOf('*') / 2,
			indentLevel = graph.length / 2;

		document.getElementById('ul').appendChild(li);
		li.dataset.commit = commit;
			// the previous one
			graphs = [];
			graphs.push(graph);

			if (dateObj.getMonth() !== month) {
			const h3 = document.createElement('h3');
			h3.textContent = ['January', 'February', 'March', 'April', 'May',
					'June', 'July', 'August', 'September', 'October',
					'November', 'December'][dateObj.getMonth()] +
				 ' ' + dateObj.getFullYear();
			li.appendChild(h3);
			}

			// Parents
			/*if (parentHierarchy[commit] !== undefined) {
				branchI = parentHierarchy[commit];
			} else {
				branchI = branchCounter++;
			}
			if (parentHierarchy[parents[0]] !== undefined) {
				branchCounter--;
			} else {
				parentHierarchy[parents[0]] = branchI;
			}
			if (parents[1]) {
				parentHierarchy[parents[1]] = branchCounter++;
			}*/

		const par = document.createElement('div');
		par.className = 'parents';
		par.title = 'hash: '+ commit + ', parent: ' + parents.join(', ');
		par.id = 'dot-' + commit;
		par.dataset.hash = commit;
		par.dataset.parents = JSON.stringify(parents);
		par.dataset.graphs = JSON.stringify(graphs);
		par.dataset.left = branchI * 10;
		par.dataset.color = colors[branchI];
		par.innerHTML = '<div class="disc" style="background-color: white; border: 2px solid black; margin-left:' + (branchI * 10) + 'px"></div>';
		li.appendChild(par);

		let activeElement;

		const a = document.createElement('a');
		a.href = isComparing ?
			'/samples/compare-view?path=' + window.parent.controller.getQueryParameters(mainFrame.contentWindow).path +
				'&rightcommit=' + commit :
			'view?hash='+ commit;
		a.target = 'main';
		a.className = 'message';
		a.style.marginLeft = (20 + 10 * indentLevel) + 'px';
		a.textContent = message;
		a.addEventListener('click', function() {
			if (activeElement) {
				activeElement.classList.remove('active');
				activeElement.classList.add('visited');
			}
			activeElement = this.parentElement;
			activeElement.classList.add('active');
		});
		li.appendChild(a);

		const statusTexts = {
			'status-none': 'Not inspected',
			'status-good': 'Good',
			'status-bad': 'Bad'
		};
		const status = window.parent.commits[commit] || 'status-none';

		const statusDiv = document.createElement('div');
		statusDiv.className = 'status ' + status;
		statusDiv.innerHTML =
			'<input name="status-' + commit + '" id="status-' + commit + '-none" value="status-none" ' +
			(status === 'status-none' ? 'checked' : '') + ' type="radio"/>' +
			'<label for="status-' + commit + '-none" value="status-none">N/A</label>' +
			'<input name="status-' + commit + '" id="status-' + commit + '-good" value="status-good" ' +
			(status === 'status-good' ? 'checked' : '') + ' type="radio"/>' +
			'<label for="status-' + commit + '-good" value="status-good">Good</label>' +
			'<input name="status-' + commit + '" id="status-' + commit + '-bad" value="status-bad" ' +
			(status === 'status-bad' ? 'checked' : '') + ' type="radio"/>' +
			'<label for="status-' + commit + '-bad" value="status-bad">Bad</label>';

		statusDiv.addEventListener('change', function (e) {
			const newClass = e.target.value;
			this.className = 'status ' + e.target.value;
			// Store for refresh
			window.parent.commits[li.dataset.commit] = newClass;
		});
		li.appendChild(statusDiv);

		const dateSpan = document.createElement('span');
		dateSpan.className = 'date';
		dateSpan.style.marginLeft = (20 + 10 * indentLevel) + 'px';
		dateSpan.innerHTML = '<a target="_new" href="https://github.com/highcharts/highcharts/commit/' + commit + '">' +
			commit + '</a> | ' + (date || '&nbsp;');
		li.appendChild(dateSpan);
		}
	});

	drawGraph();

	window.addEventListener('resize', drawGraph);



	var alltags = document.getElementById('alltags');
	alltags.addEventListener('change', function () {
		this.form.querySelectorAll('input, select').forEach(function (input) {
			if (input !== alltags && input.type !== 'submit') {
				input.disabled = alltags.checked;
			}
		});
	});
});