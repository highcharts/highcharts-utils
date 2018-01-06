/* global Highcharts */
var controller = window.parent && window.parent.controller,
	$ = window.parent && window.parent.$,
	query = controller.getQueryParameters(window),
	path = query.path,
	sample = controller.samples[path];

var chart,
	randomValues = [0.14102989272214472, 0.0351817375048995, 0.10094573209062219, 0.35990892769768834, 0.7690574480220675, 0.16634021210484207, 0.3944594960194081, 0.7656398438848555, 0.27706647920422256, 0.5681763959582895, 0.513730650767684, 0.26344996923580766, 0.09001278411597013, 0.2977627406362444, 0.6982127586379647, 0.9593012358527631, 0.8456065070349723, 0.26248381356708705, 0.12872424302622676, 0.25530692492611706, 0.9969052199739963, 0.09259856841526926, 0.9022860133554786, 0.3393681487068534, 0.41671016393229365, 0.10582929337397218, 0.1322793234139681, 0.595869708340615, 0.050670077092945576, 0.8613549116998911, 0.17356411134824157, 0.16447093593887985, 0.44514468451961875, 0.15736589767038822, 0.8677479331381619, 0.30932203005068004, 0.6120233973488212, 0.001859797164797783, 0.7689258102327585, 0.7421043077483773, 0.7548440918326378, 0.9667320610024035, 0.13654314493760467, 0.6277681242208928, 0.002858637133613229, 0.6877673089038581, 0.44036358245648444, 0.3101970909629017, 0.013212101766839623, 0.7115063068922609, 0.2931885647121817, 0.5031651991885155, 0.8921459852717817, 0.547999506117776, 0.010382920736446977, 0.9862914837431163, 0.9629317701328546, 0.07685352209955454, 0.2859949553385377, 0.5578324059024453, 0.7765828191768378, 0.1696563793811947, 0.34366130153648555, 0.11959927808493376, 0.8898638435639441, 0.8963573810178787, 0.332408863119781, 0.27137733018025756, 0.3066735703032464, 0.2789501305669546, 0.4567076754756272, 0.09539463231340051, 0.9158625246491283, 0.2145260546822101, 0.8913846455980092, 0.22340057184919715, 0.09033847553655505, 0.49042539740912616, 0.4070818084292114, 0.5827512110117823, 0.1993762720376253, 0.9264022477436811, 0.3290765874553472, 0.07792594563215971, 0.7663758248090744, 0.4329648329876363, 0.10257583996281028, 0.8170149670913815, 0.41387700103223324, 0.7504217880778015, 0.08603733032941818, 0.17256441875360906, 0.4064991301856935, 0.829071992309764, 0.6997416105587035, 0.2686419754754752, 0.36025605257600546, 0.6014082923065871, 0.9787689209915698, 0.016065671807155013],
	randomCursor = 0,
	which = query.which;

Math.random = function () {
	var ret = randomValues[randomCursor];
	randomCursor++;
	if (randomCursor >= randomValues.length) {
		randomCursor = 0;
	}
	return ret;
};

function compareHTML() {
	var start = + new Date(),
		interval,
		QUnit = window.QUnit;

	window.parent[which + 'Version'] = Highcharts.version;

	// If running QUnit, use the built-in callback
	if (QUnit) {
		if (navigator.userAgent.indexOf('PhantomJS') !== -1) {
			QUnit.config.notrycatch = true;
			QUnit.log(function( details ) {
				if (!details.result ) {
					var loc = details.module + ": " + details.name + ": ",
					output = "FAILED: " + loc + ( details.message ? details.message + ". " : "" );
				 
					if (details.actual) {
						output += "Expected: " + details.expected + ", actual: " + details.actual;
					}
					if (details.source) {
						output += "\n     " + details.source;
					}
					console.log( output );
				}
			});
		}

		/**
		 * Compare numbers taking in account an error.
		 * http://bumbu.me/comparing-numbers-approximately-in-qunitjs/
		 *
		 * @param  {Float} number
		 * @param  {Float} expected
		 * @param  {Float} error    Optional
		 * @param  {String} message  Optional
		 */
		QUnit.assert.close = function (number, expected, error, message) {
		    if (error === void 0 || error === null) {
		        error = 0.00001; // default error
		    }

		    var result = number === expected || (number < expected + error && number > expected - error) || false;

		    this.push(result, number, expected, message);
		};

		QUnit.done(function (e) {
			if (e.passed === e.total) {
				window.parent.onIdentical();
			} else {
				window.parent.onDifferent(e.passed + '/' + e.total);
			}
		});

	// Else, prepare for async
	} else {

		// To give Ajax some time to load, look for the chart every 50 ms for two seconds
		interval = setInterval(function() {
			chart = window.Highcharts && window.Highcharts.charts[0],
			QUnit = window.QUnit;

			// Compare chart objects
			if (chart) {
				clearInterval(interval);
				
				// Automatically click buttons with classname "autocompare"
				tryToRun(function () {
					$('.autocompare', document).click();
				});
				window.parent.onLoadTest(which, $(chart.container).html());

			// Compare renderers
			} else if (window.renderer) {
				clearInterval(interval);

				// Automatically click buttons with classname "autocompare"
				tryToRun(function () {
					$('.autocompare', document).click();
				});

				// Create a mock chart object with a getSVG method
				chart = {
					getSVG: function () {
						return window.renderer.box.parentNode.innerHTML;
					}
				};
				window.parent.onLoadTest(which, window.renderer.box.parentNode.innerHTML);

			} else if (new Date() - start > 2000) {
				clearInterval(interval);
				window.parent.proceed();

			}

		}, 50);
	}

}

window.compareSVG = function () { 
	window.parent.onLoadTest(which, (chart.getSVGForExport || chart.getSVG).call(chart));
}

function error(e) {
	if (which === 'right') {
		e = 'ERROR (' + which + ' frame): ' + (e.message || e);
		console.error(e, sample.path);
		parent.window.error = e;
		parent.window.onDifferent('Err');
	}
}

function tryToRun(proceed) {
	if (typeof QUnit !== 'undefined' && proceed) { // Let QUnit catch the error
		return proceed.apply(this, Array.prototype.slice.call(arguments, 1));
	}
	try {
		if (proceed) {
			return proceed.apply(this, Array.prototype.slice.call(arguments, 1));
		}
	} catch (e) {
		error(e);

	}
}

/**
 * Do the required overrides and options for the charts to compare 
 * nicely.
 */
window.setUpHighcharts = function () {
	if (!window.Highcharts) {
		console.warn('Highcharts is undefined');
		window.parent.proceed();

	} else if (window.parent) {
		compareHTML();
	}

	if (window.parent && window.parent.parent) {
		$(window).bind('keydown', window.parent.parent.keyDown);
	}

	// Make sure getJSON content is not cached
	$.ajaxSetup({
		type: 'POST',
		headers: { "cache-control": "no-cache" }
	});

	if (window.Highcharts) {
		var animation = sample.details && sample.details.requiresManualTesting ? 
			undefined :
			false;


		if (window.demoError) {
			parent.window.error = window.demoError;
			parent.window.onDifferent('Err');
		}

		Highcharts.setOptions({
			exporting: {
				libURL: 'https://code.highcharts.com/lib' // Avoid the '../x.y.z-modified/lib' issue to allow for testing
			},
			chart: {
				animation: animation
			},
			plotOptions: {
				series: {
					animation: animation,
					kdNow: true,
					dataLabels: {
						defer: false
					}
				}
			},
			tooltip: {
				animation: animation
			}
		});


		// Wrap constructors in order to catch JS errors
		//Highcharts.wrap(Highcharts, 'Chart', tryToRun);
		//Highcharts.wrap(Highcharts, 'StockChart', tryToRun);
		//Highcharts.wrap(Highcharts, 'Map', tryToRun);
		Highcharts.wrap(Highcharts.Chart.prototype, 'init', tryToRun);

		if (sample.options.details.compareTooltips) {
			// Start with tooltip open
			Highcharts.Chart.prototype.callbacks.push(function (chart) {
				var x = 2,
					series = chart.series,
					hoverPoint = series[0] && series[0].points[x];
				if (hoverPoint) {
					/*
					if  (chart.tooltip.options.shared) {
						pointOrPoints = [];
						Highcharts.each(series, function (s) {
							if (s.options.enableMouseTracking !== false && s.points[x]) {
								pointOrPoints.push(s.points[x]);
							}
						});
						if (pointOrPoints.length === 0) {
							pointOrPoints.push(hoverPoint);
						}
					} else {
						pointOrPoints = hoverPoint;
					}
					*/
					hoverPoint.onMouseOver();
					// Note: As of 5.0.8 onMouseOver takes care of refresh.
					//chart.tooltip.refresh(pointOrPoints);
				}
			});
		}

		if (typeof window.test === 'function') {
			Highcharts.Chart.prototype.callbacks.push(function (chart) {
				try {
					window.test(chart);
				} catch (e) {
					e = 'ERROR in test.js (' + which + ' frame): ' + e.message;
					console.error(e);
					parent.window.error = e;
					parent.window.onDifferent('Err');
				}

			});
		}
		
		if (
			sample.options.details.exportInnerHTML ||
			sample.options.details.compareTooltips
		) {
			// Bypass the export module
			Highcharts.Chart.prototype.getSVG = function () {
				return this.container.innerHTML
					.replace(/<\/svg>.*?$/, '</svg>'); // strip useHTML
			};
		}

	}

}

// Make sure deferred errors are captured by the test runner.
$.readyException = error;


window.isComparing = true;
window.alert = function () {};
window.onbeforeunload = function(){
	$(document).unbind();    //remove listeners on document
	$(document).find('*').unbind(); //remove listeners on all nodes
}
