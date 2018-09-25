/* global $ */
window.onload = function () {
	$.getJSON('/samples/list-samples', function (samples) {
		var i;

		// Populate the sample navigation
		var $samplesNav = $('#samples-nav'),
			folder,
			lastFolder,
			sampleName;

		for (i = 0; i < samples.length; i++) {

			folder = samples[i].path.split('/');
			sampleName = folder.pop();
			folder = folder.join('/');
			
			if (folder !== lastFolder) {
				$('<h2>' + folder + '</h2>')
					.appendTo($samplesNav);
				lastFolder = folder;
			}

			$('<a>' + sampleName + '</a>').attr({
				href: '/samples/view?path=' + samples[i].path + '&mobile=true',
				'class': 'button'
			}).appendTo($samplesNav);
		}
	});
}