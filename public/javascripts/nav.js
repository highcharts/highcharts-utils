$(function () {
	if (controller) {
		$('#bisect').click(function () {
			controller.toggleBisect()
		});

		if (controller.frames().commits) {
			$('#bisect').addClass('active');
		}
	}
});