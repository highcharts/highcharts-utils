/* global $, controller, Highcharts */
$(function () {
	if (controller) {
		$('#bisect').click(function () {
			controller.toggleBisect()
		});

		if (controller.frames().commits) {
			$('#bisect').addClass('active');
		}

		// Add the next button
		var contentsDoc = controller.frames().contents.contentDocument;
		if (contentsDoc.getElementById('i' + (controller.currentSample.index + 1))) {
			
			$('#next').click(function() {
				controller.next();
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
			width: checked ? '50%' : 0,
			'overflow-y': 'hidden'
		});
		$('#main-content').css({
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
			$('<iframe>').appendTo('#source-box')
				.attr({
					id: 'view-source-iframe',
					src: 'view-source?path=' + controller.currentSample.path
				})
				.css({
					width: '100%',
					border: 'none',
					borderRight: '1px solid gray'
				});
		} else {
			$('#source-box').html('');
		}
	});
});