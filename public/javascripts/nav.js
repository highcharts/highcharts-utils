window.addEventListener('bodyload', function () {
	if (window.parent === window && !document.getElementById('mobile-home')) {
		document.body.classList.add('topframe');

		if (window.location.hash.indexOf('show-chrome') !== -1) {
			[].forEach.call(
				document.querySelectorAll('.topframe-hidden'),
				function (elem) {
					elem.style.display = 'block';
				}
			);
		}
	}
});

/* global controller, Highcharts */
window.addEventListener('load', function () {

	document.querySelector('.top-bar .burger').addEventListener(
		'click',
		function() {
			[].forEach.call(
				document.querySelectorAll('.topframe-hidden'),
				function (elem) {
					if (elem.style.display === 'block') {
						elem.style.display = '';
						window.location.hash = window.location.hash
							.replace('show-chrome', '');
					} else {
						elem.style.display = 'block';
						window.location.hash = 'show-chrome';
					}
				}
			);
		}
	)

	var $ = window.$ || window.jQuery;
	if (controller) {
		$('#bisect', document).click(function () {
			controller.toggleBisect()
		});

		if (controller.frames().commits) {
			$('#bisect', document).addClass('active');
		}

		// Add the next button
		var contentsDoc = controller.frames().contents.contentDocument;
		if (
			controller.currentSample &&
			contentsDoc.getElementById('i' + (controller.currentSample.index + 1))
		) {

			$('#next', document).click(function() {
				controller.next();
			});
			$('#next', document)[0].disabled = false;
		}

	}

	// Activate view source button
	$('#view-source', document).bind('click', function () {
		var checked,
			$sourceBox = $('#source-box', document)	;

		$(this).toggleClass('active');

		checked = $(this).hasClass('active')

		$sourceBox.css({
			width: checked ? '50%' : 0
		});
		$('#main-content', document).css({
			width: checked ? '50%' : '100%'
		});

		var interval = setInterval(function () {
			if (typeof Highcharts !== 'undefined') {
				$.each(Highcharts.charts, function () {
					this.reflow();
				});
			}
		}, 25);
		setTimeout(function () {
			clearInterval(interval);
		}, 500);

		if (checked) {

			$('<iframe>', document).appendTo($sourceBox)
				.attr({
					id: 'view-source-iframe',
					src: 'view-source?path=' + window.path
				})
				.css({
					width: '100%',
					border: 'none',
					borderRight: '1px solid gray'
				});
		} else {
			$('#source-box', document).html('');
		}
	});
});