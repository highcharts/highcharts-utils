if (window.console) {
	console.clear();
}

var controller = window.parent && window.parent.controller,
	sampleIndex,
	query = controller.getQueryParameters(window),
	path = query.path,
	sample = controller.samples[path],
	browser = controller.getBrowser();

(function () {

	controller.addResources(document, sample.options.details.resources);
	if (sample.isUnitTest()) { 
		controller.addResources(document, ['test-controller.js']);
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

		if (controller) {
			$('#bisect').click(controller.toggleBisect);
		}

		if (typeof Highcharts !== 'undefined') {
			$('#version').html(Highcharts.product + ' ' + Highcharts.version +
				' / ' + browser.parent);
		}

		if (window.parent.frames[0]) {

			if (window.parent.history.pushState) {
				window.parent.history.pushState(null, null, '#view/' + path);
			}
			
			var contentDoc = window.parent.frames[0].document;

			sample.setCurrent();
			sampleIndex = sample.index;

			

			// add the next button
			if (contentDoc.getElementById('i' + (sampleIndex + 1))) {
				
				$('#next').click(function() {
					next();
				});
				$('#next')[0].disabled = false;
			}
		}

		// Activate view source button
		$('#view-source').bind('click', function () {
			var checked;

			$(this).toggleClass('active');

			checked = $(this).hasClass('active')
			
			$('#source-box').css({
				width: checked ? '50%' : 0
			});
			$('#main-content').css({
				width: checked ? '50%' : '100%'
			});
			if (typeof Highcharts !== 'undefined') {
				$.each(Highcharts.charts, function () {
					this.reflow();
				});
			}

			if (checked) {
				$('<iframe>').appendTo('#source-box')
					.attr({
						src: 'view-source.php?path=' + path
					})
					.css({
						width: '100%',
						border: 'none',
						borderRight: '1px solid gray',
						height: $(document).height() - 80
					});
			} else {
				$('#source-box').html('');
			}
		});
		contentDoc = null;

	});
}());

function next() {
	var a = window.parent.frames[0].document.getElementById('i' + (sampleIndex + 1));
	if (a) {
		window.location.href = a.href;
	}
}
function previous() {
	var a = window.parent.frames[0].document.getElementById('i' + (sampleIndex - 1));
	if (a) {
		window.location.href = a.href;
	}
}

if (jQuery) {
	jQuery.readyException = function (error) {
		throw error;
	};
}
// Wrappers for recording mouse events in order to write automatic tests 

function setUp() {

	$(window).bind('keydown', parent.keyDown);
	
	/*
	var checkbox = $('#record')[0],
		pre = $('pre#recording')[0];
	if (typeof Highcharts !== 'undefined') {
		Highcharts.wrap(Highcharts.Pointer.prototype, 'onContainerMouseDown', function (proceed, e) {
			if (checkbox.checked) {
				pre.innerHTML += "chart.pointer.onContainerMouseDown({\n"+
					"	type: 'mousedown',\n" +
					"	pageX: " + e.pageX + ",\n" + 
					"	pageY: " + e.pageY + "\n" + 
					"});\n\n";
			}
			return proceed.call(this, e);
		});
		Highcharts.wrap(Highcharts.Pointer.prototype, 'onContainerMouseMove', function (proceed, e) {
			if (checkbox.checked) {
				pre.innerHTML += "chart.pointer.onContainerMouseMove({\n"+
					"	type: 'mousemove',\n" +
					"	pageX: " + e.pageX + ",\n" + 
					"	pageY: " + e.pageY + ",\n" +  
					"	target: chart.container\n" + 
					"});\n\n";
			}
			return proceed.call(this, e);
		});
		Highcharts.wrap(Highcharts.Pointer.prototype, 'onDocumentMouseUp', function (proceed, e) {
			if (checkbox.checked) {
				pre.innerHTML += "chart.pointer.onContainerMouseMove({\n"+
					"	type: 'mouseup'\n" + 
					"});\n\n";
			}
			return proceed.call(this, e);
		});

		Highcharts.setOptions({
			exporting: {
				// Avoid versioning
				// libURL: 'https://code.highcharts.com/lib'
				libURL: 'http://rawgithub.local/highcharts/vendor'
			}
		});
	}
	*/

	if (query.profile && typeof Highcharts !== 'undefined') {
		Highcharts.wrap(Highcharts.Chart.prototype, 'init', function (proceed) {
			var chart,
				start;

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
	if (query.time && typeof Highcharts !== 'undefined') {
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

	/*
	<?php if ($styled) { ?>
	var warnedAboutColors = false;
	function warnAboutColors () {
		if (!warnedAboutColors) {
			console.info('This sample uses getOtions.colors, which is ignored in Styled mode.');
			warnedAboutColors = true;
		}

		return undefined;
	}
	Highcharts.wrap(Highcharts, 'getOptions', function (proceed) {
		var options = proceed.call(Highcharts);
		if (!options.colors) {
			options.colors = [];
			for (var i = 0; i < 10; i++) {
				options.colors = {
					get 0 () { warnAboutColors(); },
					get 1 () { warnAboutColors(); },
					get 2 () { warnAboutColors(); },
					get 3 () { warnAboutColors(); }
				};
			}
		}
		return options;
	});

	<?php } ?>
	*/

	if (/\/css\//.test(path)) {
		Highcharts.Chart.prototype.callbacks.push(function (chart) {
			var svg = Highcharts.charts[0].container.innerHTML;
			var match = svg.match(/ (style|fill|stroke|stroke-width|fill-opacity)="/);
			if (match) {
				console.warn(
					'Found presentational attribute',
					match[1],
					svg.substr(match.index - 80, 250)
				);
			}
		});
	}
} // end setUp