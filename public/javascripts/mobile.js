/* global $ */
window.onload = function () {
	$.getJSON('/samples/list-samples', function (samples) {
		// Populate the sample navigation
		var $samplesNav = $('#samples-nav'),
			folder,
			lastFolder,
			sampleName;

		let $div;

		samples.forEach(function (sample) {

			folder = sample.path.split('/');
			sampleName = folder.pop();
			folder = folder.join('/');

			var folderId = folder.replace(/\//g, '-');

			if (folder !== lastFolder) {
				$('<h2>' + folder + '</h2>')
					.click(function () {
						document.getElementById(folderId).style.display = 'block';
					})
					.appendTo($samplesNav);
				lastFolder = folder;

				$div = $('<div class="folder-contents" id="' + folderId + '">')
					.appendTo($samplesNav);
			}

			$('<a>' + sampleName + '</a>').attr({
				href: '/samples/view?path=' + sample.path + '&mobile=true',
				'class': 'button'
			}).appendTo($div);
		});
	});
}