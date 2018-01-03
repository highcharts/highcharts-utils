$(function () {
	if (controller) {
		$('#bisect').click(function () {
			controller.toggleBisect()
		});

		if (controller.frames().commits) {
			$('#bisect').addClass('active');
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
					src: 'view-source?path=' + path
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
});