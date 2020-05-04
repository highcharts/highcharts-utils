var controller = window.parent && window.parent.controller,
	$ = window.parent && window.parent.$,
	query = controller.getQueryParameters(window),
	diff,
	path = query.path,
	commentHref = '/samples/compare-comment?browser=' + controller.getBrowser() +
		'&path=' + path,
	commentFrame,
	leftSVG,
	rightSVG,
	leftVersion,
	rightVersion,
	chartWidth,
	chartHeight,
	error,
	mode = query.mode,
	sample = controller.samples[path],
	skipTest = sample.options.details.skipTest,
	isManual = sample.options.details.requiresManualTesting,
	rightcommit = query.rightcommit || false,
	isUnitTest = sample.isUnitTest(),
	previewSVG,
	diffString = window.parent.diffString,
	canvg = window.parent.canvg;

function showCommentBox(diff) {

	if (!commentFrame) {
		commentFrame = document.createElement('iframe');
		commentFrame.setAttribute('id', 'comment-iframe');
		commentFrame.setAttribute(
			'src',
			commentHref+ '&diff=' + diff + '&focus=false'
		);
		console.log(commentHref+ '&diff=' + diff + '&focus=false')
		document.getElementById('comment-placeholder').appendChild(commentFrame);
	}
}

function updateHash() {
	if (window.parent && window.parent.frames[0] && window.parent.history.pushState) {
		var hash = controller.continueBatch ? '#batch' : '#test';
		hash += '/' + path;
		if (hash !== window.parent.location.hash) {
			window.parent.history.pushState(null, null, hash);
		}
	}

}

function setUpElements() {
	var querystring = window.location.search.replace(/^\?/, '');

	// The body class
	if (isUnitTest) {
		document.body.className = 'single-col unit';
	} else if (isManual) {
		document.body.className = 'single-col manual';
	} else {
		document.body.className = 'visual';
	}

	// The body elements
	if (skipTest) {
		onIdentical('skip');
		document.getElementById('skip-test-info').style
			.display = 'block';
	} else {
		if (!isUnitTest && !isManual) {
			var leftIframe = document.createElement('iframe');
			leftIframe.id = 'iframe-left';
			leftIframe.src = "compare-iframe?which=left&" +
				querystring + "&dummy=" + Date.now();
			document.getElementById('frame-row')
				.appendChild(leftIframe);
		}
		var rightIFrame = document.createElement('iframe');
		rightIFrame.id = 'iframe-right';
		rightIFrame.src = "compare-iframe?which=right&" +
				querystring + "&dummy=" + Date.now();
		document.getElementById('frame-row')
			.appendChild(rightIFrame);
	}
}

window.addEventListener('load', function () {
	updateHash();
	setUpElements();

	// the reload button
	$('#reload', document).click(function() {
		location.reload();
	});

	$('#comment', document).click(function () {
		location.href = commentHref;
	});

	$(window).bind('keydown', parent.keyDown);

	$('#view-frame-row', document).click(function () {
		$('#frame-row', document).css({
			visibility: 'visible',
			position: 'static',
			height: '400px'
		});
	});
	$('#view-svg', document).click(function () {
		$('#svg', document).css({
			display: 'block',
			height: 'auto'
		});
	});

	controller.samples[path].setCurrent();

	if (isManual) {
		showCommentBox(diff);
	}

	if ((isUnitTest || isManual) && rightcommit) {
		report += 'Testing commit <a href="http://github.com/highcharts/highcharts/commit/' + rightcommit + '" target="_blank">' + rightcommit + '</a>';
		$('#report').css({
			color: 'gray',
			display: 'block'
		}).html(report);
	}
});



/**
 * Pad a string to a given length
 * @param {String} s
 * @param {Number} length
 */
/*
function pad(s, length, left) {
	var padding;

	if (s.length > length) {
		s = s.substring(0, length);
	}

	padding = new Array((length || 2) + 1 - s.length).join(' ');

	return left ? padding + s : s + padding;
}
*/


function proceed() {
	updateHash(); // Batch may be stopped
	if (controller.continueBatch) {
		var contentDoc = window.parent.frames[0].document,
			href,
			next,
			nextIndex = sample.index;

		if (!contentDoc || !contentDoc.getElementById('i' + sample.index)) {
			return;
		}

		while (nextIndex++) {
			next = contentDoc.getElementById('i' + nextIndex);
			if (next) {
				href = next.href;
			} else {
				window.parent.location = '/samples';
				return;
			}

			if (
				(
					!contentDoc.getElementById('i' + nextIndex) ||
					/batch/.test(
						contentDoc.getElementById('i' + nextIndex).className
					)
				) && contentDoc.getElementById('i' + nextIndex).parentNode.style.display !== 'none'

			) {
				break;
			}
		}

		href = href.replace("/view?", "/compare-view?");

		controller.batchRuns++;
		// Clear memory build-up from time to time by reloading the
		// whole thing.
		if (controller.batchRuns > 90) {
			window.top.location.hash = '#batch/' + controller.samples[nextIndex].path;
			window.top.location.reload();
		} else {
			window.location.href = href;
		}

	// Else, log the result. This is picked up when running in PhantomJS (phantomtest.js script).
	} else {
		if (typeof diff === 'function') { // leaks from jsDiff
			diff = 0;
		}
		/*
		console.log([
			'@proceed',
			pad(path, 60, false),
			diff ? pad(String(diff), 5, true) : '    .' // Only a dot when success
		].join(' '));
		*/
	}
}

function onIdentical(diff) {
	sample.setDiff(diff || 0);
	proceed();
}

function onDifferent(diff) {
	sample.setDiff(diff);
	proceed();
}

function onLoadTest(which, svg) { // eslint-disable-line no-unused-vars

	chartWidth = parseInt(svg.match(/width=\"([0-9]+)\"/)[1]);
	chartHeight = parseInt(svg.match(/height=\"([0-9]+)\"/)[1]);

	if (which == 'left') {
		leftSVG = svg;
	} else {
		rightSVG = svg;
	}
	if (leftSVG && rightSVG) {
		onBothLoad();
	}
}

function wash(svg) {
	if (typeof svg === "string") {
		return svg
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/&lt;del&gt;/g, '<del>')
			.replace(/&lt;\/del&gt;/g, '</del>')
			.replace(/&lt;ins&gt;/g, '<ins>')
			.replace(/&lt;\/ins&gt;/g, '</ins>');
	} else {
		return "";
	}
}

function activateOverlayCompare(isCanvas) {

	var isCanvas = isCanvas || false,
		$button = $('button#overlay-compare', document),
		$leftImage = isCanvas ? $('#cnvLeft', document) : $('#left-image', document),
		$rightImage = isCanvas ? $('#cnvRight', document) : $('#right-image', document),
		showingRight,
		toggle = function () {

			// Initiate
			if (showingRight === undefined) {

				$('#preview', document).css({
					height: $('#preview', document).height()
				});

				$rightImage
					.css({
						left: $rightImage.offset().left,
						position: 'absolute'
					})
					.animate({
						left: 0
					}, {
						complete: function () {
							$leftImage.hide();
						}
					});

				$leftImage.css('position', 'absolute');


				$button.html('Showing right. Click to show left');
				showingRight = true;

			// Show left
			} else if (showingRight) {
				$rightImage.hide();
				$leftImage.show();
				$button.html('Showing left. Click to show right');
				showingRight = false;
			} else {
				$rightImage.show();
				$leftImage.hide();
				$button.html('Showing right. Click to show left.');
				showingRight = true;
			}
		};
	$('#preview', document).css({
		width: 2 * chartWidth + 20
	});

	$button
		.css('display', '')
		.click(toggle);
	$leftImage.click(toggle);
	$rightImage.click(toggle);
}

var report = '';
function onBothLoad() {

	var FORCE_VISUAL_COMPARE = false;

	var out,
		identical;

	if (error) {
		report += "<br/>" + error;
		$('#report', document).html(report)
			.css('background', '#f15c80');
		onDifferent('Err');
		return;
	}

	// remove identifier for each iframe
	if (leftSVG && rightSVG) {
		leftSVG = leftSVG
			.replace(/which=left/g, "")
			.replace(/Created with [a-zA-Z0-9\.@\- ]+/, "Created with ___"),

		rightSVG = rightSVG
			.replace(/which=right/g, "")
			.replace(/Created with [a-zA-Z0-9\.@\- ]+/, "Created with ___");
	}

	if (leftSVG === rightSVG && !FORCE_VISUAL_COMPARE) {
		identical = true;
		onIdentical();
	}

	if (mode === 'images') {
		var regNaN = /[^a-zA-Z]NaN[^a-zA-Z]/;
		if (regNaN.test(rightSVG)) {
			report += "<div>The generated SVG contains NaN</div>";
			var index = rightSVG.indexOf('NaN');
			report += '<pre>' + rightSVG.substr(index - 100, 200)
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;\n') + '</pre>';
			$('#report', document).html(report)
				.css('background', '#f15c80');
			onDifferent('Err');
			previewSVG = rightSVG
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;\n');

		} else if (identical && !FORCE_VISUAL_COMPARE) {
			report += "<br/>The generated SVG is identical";
			$('#report', document).html(report)
				.css('background', "#a4edba");

		} else {
			report += "<div>The generated SVG is different, checking exported images...</div>";

			$('#report', document).html(report)
				.css('background', 'gray');

			/***
				CANVAS BASED COMPARISON
			***/
			function canvasCompare(source1, canvas1, source2, canvas2) {
				var converted = [],
					canvasWidth = chartWidth || 400,
					canvasHeight = chartHeight || 300;

				// converts the svg into canvas
				//		- source: the svg string
				//		- target: the id of the canvas element to render to
				//		- callback: function to call after conversion
				//
				function convert(source, target, callback, which) {
					var useBlob,
						context = document.getElementById(target).getContext('2d'),
						image = new Image(),
						data,
						domurl,
						blob,
						svgurl;

					source = source.replace(/<foreignObject .*?<\/foreignObject>/g, '')

					// Firefox runs Blob. Safari requires the data: URL. Chrome accepts both
					// but seems to be slightly faster with data: URL.
					useBlob = ['Chrome', 'Edge', 'Firefox']
						.indexOf(controller.getBrowser()) !== -1;
					if (useBlob) {
						domurl = window.URL || window.webkitURL || window;
						blob = new Blob([source], { type: 'image/svg+xml;charset-utf-16'});
						svgurl = domurl.createObjectURL(blob);
					}

					// This is fired after the image has been created
					image.onload = function() {
						try {
							context.drawImage(image, 0, 0, canvasWidth, canvasHeight);
							data = context.getImageData(0, 0, canvasWidth, canvasHeight).data;
							if (useBlob) {
								domurl.revokeObjectURL(svgurl);
							}
							callback(data);
						} catch (e) {
							console.error(e);
							onDifferent('Err');
						}
					}
					image.onerror = function (e) {
						report += '<div>Failed painting SVG to canvas on ' + which + ' side.</div>';
						$('#report', document).html(report).css('background', '#f15c80');
						console.error(e);
						onDifferent('Err');
					}
					image.src = useBlob ?
						svgurl :
						'data:image/svg+xml,' + source;
				};

				// compares 2 canvas images
				/*
				function compare(data1, data2) {
					var	i = data1.length,
						diff = 0,
						// Tune the diff so that identical = 0 and max difference is 100. The max
						// diff can be tested by comparing a rectangle of fill rgba(0, 0, 0, 0) against
						// a rectange of fill rgba(255, 255, 255, 1).
						dividend = 4 * 255 * canvasWidth * canvasHeight / 100;
					while (i--) {
						diff += Math.abs(data1[i] - data2[i]); // loops over all reds, greens, blues and alphas
					}
					diff /= dividend;

					if (diff > 0 && diff < 0.005) {
						diff = 0;
					}
					diff = Math.round(diff * 100) / 100;
					return diff;
				}
				*/

				// compares 2 canvas images
				function compare(data1, data2) {
					var i = data1.length,
						diff = 0,
						pixels = [],
						pixel;

					// loops over all reds, greens, blues and alphas
					while (i--) {
						pixel = Math.floor(i / 4);
						if (Math.abs(data1[i] - data2[i]) !== 0 && !pixels[pixel]) {
							pixels[pixel] = true;
							diff++;
						}
					}

					return diff;
				}

				// called after converting svgs to canvases
				function startCompare(data) {
					var nightly = controller.nightly;
					converted.push(data);
					// only compare if both have been converted
					if (converted.length == 2) {
						var diff = compare(converted[0], converted[1]);

						if (diff === 0) {
							identical = true;
							report += '<div>The exported images are identical</div>';
							onIdentical();
						} else if (diff === undefined) {
							report += '<div>Canvas Comparison Failed</div>';
							onDifferent('Err');
						} else {
							report += '<div>The rasterized images are different - ' +
								'<b id="computed-diff">' + diff + '</b> changed pixels</div>';

							if (nightly[path]) {
								report +=
									'<div>Nightly: <b>' + nightly[path].diff + '</b> changed pixels. ' +
									(nightly[path].comment ? nightly[path].comment.title : '') +
									'</div>';
							} else {
								report += '<div>Nightly: No difference found</div>';
							}

							if (sample.isTolerated()) {
								report += '<div><i class="fa fa-check"></i> ' +
									'Sample is tolerated and marked green, diff is close to nightly diff</div>'
							}

							onDifferent(diff);
							showCommentBox(diff);


						}

						// lower section to overlay images to visually compare the differences
						activateOverlayCompare(true);

						$('#report', document).html(report).css('background', identical ? "#a4edba" : '#f15c80');
					}
				}

				$('#preview canvas', document)
					.attr({
						width: chartWidth,
						height: chartHeight
					})
					.css({
						width: chartWidth + 'px',
						height: chartHeight + 'px',
						display: ''
					});

				// start converting
				if (/Trident\/|MSIE /.test(navigator.userAgent)) {
					try {
						canvg(canvas1, source1, {
							scaleWidth: canvasWidth,
							scaleHeight: canvasHeight
						});
						startCompare(document.getElementById(canvas1).getContext('2d').getImageData(0, 0, canvasWidth, canvasHeight).data);
						canvg(canvas2, source2, {
							scaleWidth: canvasWidth,
							scaleHeight: canvasHeight
						});
						startCompare(document.getElementById(canvas2).getContext('2d').getImageData(0, 0, canvasWidth, canvasHeight).data);
					} catch (e) {
						onDifferent('Err');
						report += '<div>Error in canvg, try Chrome or Safari.</div>';
						$('#report', document).html(report).css('background', '#f15c80');
					}

				} else {
					convert(source1, canvas1, startCompare, 'left');
					convert(source2, canvas2, startCompare, 'right');
				}
			}

			// Browser sniffing for compare capabilities
			canvasCompare(leftSVG, 'cnvLeft', rightSVG, 'cnvRight', 400, 300);

		}
	} else {
		if (rightVersion.indexOf(leftVersion) !== 0) {
			report += '<div style="color: red; font-weight: bold">Warning: Left and right versions mismatch.</div>';
		}

		report += '<div>Left version: '+ leftVersion +'; right version: '+
			(rightcommit ? '<a href="http://github.com/highcharts/highcharts/commit/' + rightcommit + '" target="_blank">' +
				rightcommit + '</a>' : rightVersion) +
			'</div>';

		// When running in batch, first check the HTML. When running one by one,
		// do a deeper check.
		if (controller.continueBatch) {
			if (identical) {
				report += '<div>The innerHTML is identical</div>';
				if (leftVersion === rightVersion) {
					report += "<div style='color: red; font-weight: bold'>Warning: Left and right versions are identical.</div>";
				}
			} else {
				report += '<div>The innerHTML is different, testing generated SVG...</div>';
			}
		}

		$('#report', document).html(report)
			.css('background', identical ? "#a4edba" : '#f15c80');

		if (!identical || !controller.continueBatch) {
			// switch to image mode
			leftSVG = rightSVG = undefined;
			mode = 'images';
			$("#iframe-left", document)[0].contentWindow.compareSVG();
			$("#iframe-right", document)[0].contentWindow.compareSVG();
		}
	}

	// Show the diff
	if (!identical) {
		//out = diffString(wash(leftSVG), wash(rightSVG)).replace(/&gt;/g, '&gt;\n');
		try {
			out = diffString(
				leftSVG.replace(/>/g, '>\n'),
				rightSVG.replace(/>/g, '>\n')
			);
			$("#svg", document).html('<h4 style="margin:0 auto 1em 0">Generated SVG</h4>' + wash(out));
		} catch (e) {
			$("#svg", document).html(previewSVG || 'Error diffing SVG');
		}
	}

	/*report +=  '<br/>Left length: '+ leftSVG.length + '; right length: '+ rightSVG.length +
		'; Left version: '+ leftVersion +'; right version: '+ rightVersion;*/

}