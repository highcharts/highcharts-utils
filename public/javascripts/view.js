/* global $, jQuery, Highcharts */
if (window.console) {
//	console.clear();
}

var controller = window.parent && window.parent.controller,
	query = controller && controller.getQueryParameters(window),
	path = query && query.path,
	sample = controller && controller.samples[path];

(function () {
	var $ = jQuery;
	if (!controller) {

		function getQueryParameters (win) {
	        var pairs = (win || window).location.search.slice(1).split('&');

	        var result = {},
	        	i = 0,
	        	pair;
	        for (i = 0; i < pairs.length; i++) {
	        	pair = pairs[i];
	            pair = pair.split('=');
	            result[pair[0]] = decodeURIComponent(pair[1] || '');
	        }
	        return result;
	    };
	    path = getQueryParameters(window).path;

		$.getJSON('/samples/list-samples', function (samples) {
			var i;

			// Activate the next button
			for (i = 0; i < samples.length; i++) {
				if (samples[i].path === path && samples[i + 1]) {
					$('#next').attr({
						href: window.location.href.replace(
							path,
							samples[i + 1].path
						),
						disabled: false
					});
					break;
				}
			}

			// Populate the sample navigation
			/*
			var folder = path.split('/'),
				$samplesNav = $('#samples-nav'),
				active;

			folder.pop();
			folder = folder.join('/');

			for (i = 0; i < samples.length; i++) {
				if (samples[i].path.indexOf(folder) === 0) {
					active = samples[i].path === path ? ' active' : ' ';
					$('<a>' + samples[i].path.replace(folder + '/', '') + '</a>').attr({
						href: window.location.href.replace(
							path,
							samples[i].path
						),
						'class': 'button' + active
					}).appendTo($samplesNav);
				}
			}
			*/
		});
		return;
	}

	controller.addResources(document, sample.options.details.resources);
	if (sample.isUnitTest()) {
		controller.addResources(document, ['test-controller.js']);
		controller.addResources(document, ['test-template.js']);
		//controller.addResources(document, ['test-templates/highcharts/scatter.js']);
		controller.addResources(document, ['test-utilities.js']);
	}

	if (typeof $ === 'undefined') {
		window.onload = function () {
			document.getElementById('container').innerHTML =
				'<div style="margin-top: 150px; text-align: center"><h3 style="font-size: 2em; color: red">' +
				'jQuery is missing</h3><p>Check your settings in <code>settings.php</code>.</div>';
		};
		return;
	}


	$(function() {

		if (typeof Highcharts === 'undefined' && !document.getElementById('container')) {
			window.onload = function () {
				document.body.innerHTML =
					'<div style="margin-top: 150px; text-align: center"><h3 style="font-size: 2em; color: red">' +
					'Highcharts and container are missing</h3><p>Most likely this sample does not exist.</div>';
			};
			return;
		}

		if (typeof Highcharts !== 'undefined') {
			$('#version').html('Version: ' + Highcharts.product + ' ' +
				Highcharts.version +
				' / Branch: ' + controller.server.branch);
		}

		if (window.parent.frames[0]) {

			if (window.parent.history.pushState) {
				window.parent.history.pushState(null, null, '#view/' + path);
			}

			sample.setCurrent();
		}

	});
}());

if ($) {
	$.readyException = function (error) {
		throw error;
	};
}
// Wrappers for recording mouse events in order to write automatic tests

window.setUp = function () {

	var $ = jQuery;
	$(window).bind('keydown', parent.keyDown);


	if (typeof Highcharts !== 'undefined') {
		Highcharts.setOptions({
			exporting: {
				// Avoid versioning
				// libURL: 'https://code.highcharts.com/lib'
				libURL: '/code/lib'
			},
			stockTools: {
				gui: {
					iconsURL: '/code/gfx/stock-icons/'
				}
			}
		});
	}

	if (query && query.profile && typeof Highcharts !== 'undefined') {
		Highcharts.wrap(Highcharts.Chart.prototype, 'init', function (proceed) {
			var chart;

			// Start profile
			if (window.console && console.profileEnd) {
				console.profile(sample.path);
			}

			chart = proceed.apply(this, Array.prototype.slice.call(arguments, 1));

			if (window.console && console.profileEnd) {
		 		console.profileEnd(sample.path);
		 	}

		 	return chart;

		});
	}
	if (query && query.time && typeof Highcharts !== 'undefined') {
		Highcharts.wrap(Highcharts.Chart.prototype, 'init', function (proceed) {
			var chart,
				start;

			// Start profile
			if (window.console && console.time) {
				console.time(sample.path);
			} else {
				start = +new Date();
			}


			chart = proceed.apply(this, Array.prototype.slice.call(arguments, 1));

			if (window.console && console.time) {
				console.timeEnd(sample.path);
			} else if (window.console) {
				console.log(sample.path + ': ' + (new Date() - start) + 'ms');
			}

		 	return chart;

		});
	}


	// Start checking styled mode. This whole code block can be pasted into
	// jsFiddle in order to check styled mode on a setup.
	(function () {
		var container;
		var notified = {};
		var checkStyledMode = function () {

			if (!Highcharts.charts[0]) {
				return;
			}

			container = Highcharts.charts[0].container;
			var blacklist = [
				'fill',
				'fill-opacity',
				//'opacity', // To do: check this in HC7
				'stroke',
				'stroke-width',
				'style'
			];

			if (
				(new RegExp(' (' + blacklist.join('|') + ')="', 'g')).test(
					container.innerHTML
				)
			) {
				blacklist.forEach(function (attr) {
					[].forEach.call(
						container.querySelectorAll('*[' + attr + ']'),
						function (elem) {
							var key = [attr, elem.nodeName, elem.getAttribute('class')].join(',');
							if (!notified[key]) {
								console.log(
									'⚠️ Found presentational attribute in styled mode:',
									attr,
									elem
								);
							}
							notified[key] = true;
						}
					);
				});

			}
		};
		if (typeof Highcharts !== 'undefined') {
			Highcharts.addEvent(Highcharts.Chart, 'load', function () {

				if (this.styledMode) {
					checkStyledMode();

					// Observe for dynamic things like tooltip
					var observer = new MutationObserver(checkStyledMode);

					// Start observing the target node for configured mutations
					observer.observe(
						container,
						{ attributes: true, childList: true, subtree: true }
					);
				}
			});
		}
	}());
	// End checking styled mode


} // end setUp