/* global window */
window.onload = function () {
	fetch('/samples/list-samples')
		.then(response => response.json())
		.then(samples => {
			// Populate the sample navigation
			const samplesNav = document.getElementById('samples-nav');
			let folder;
			let lastFolder;
			let sampleName;
			let div;

			samples.forEach(function (sample) {
				folder = sample.path.split('/');
				sampleName = folder.pop();
				folder = folder.join('/');

				const folderId = folder.replace(/\//g, '-');

				if (folder !== lastFolder) {
					const h2 = document.createElement('h2');
					h2.textContent = folder;
					h2.addEventListener('click', function () {
						document.getElementById(folderId).style.display = 'block';
					});
					samplesNav.appendChild(h2);
					lastFolder = folder;

					div = document.createElement('div');
					div.className = 'folder-contents';
					div.id = folderId;
					samplesNav.appendChild(div);
				}

				const a = document.createElement('a');
				a.textContent = sampleName;
				a.href = '/samples/view?path=' + sample.path + '&mobile=true';
				a.className = 'button';
				div.appendChild(a);
			});
		});
}