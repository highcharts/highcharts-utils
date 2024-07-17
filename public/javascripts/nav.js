window.addEventListener('bodyload', function () {
	if (
		window.parent === window &&
		window.location.href.indexOf('mobile=true') === -1 &&
		window.location.hash.indexOf('show-chrome') === -1
	) {
		document.body.classList.add('topframe');
	}

	if (localStorage.getItem('mobile-preview')) {
		document.body.classList.add('mobile-preview');
	}

	if (/#edit/.test(window.parent.location.hash)) {
		document.body.classList.add('edit-mode');
	}
});

/* global controller, Highcharts */
window.addEventListener('load', function () {

	document.querySelector('.top-bar .burger').addEventListener(
		'click',
		function() {
			if (document.body.classList.contains('topframe')) {
				document.body.classList.remove('topframe');
				window.location.hash = 'show-chrome';
			} else {
				document.body.classList.add('topframe');
				window.location.hash = window.location.hash
					.replace('show-chrome', '');
			}
			/*
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
			*/
		}
	);

	for (const dropdown of document.querySelectorAll('.dropdown')) {
		const anchor = document.getElementById(dropdown.dataset.anchor);
		const hide = () => {
			dropdown.style.display = 'none';
		}
		anchor.addEventListener('mouseover', () => {
			dropdown.style.display = 'inline-block';
		});
		dropdown.addEventListener('mouseleave', hide);
	}

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

	} else {
		$('#bisect', document).hide();
	}

	if (/#edit/.test(window.parent.location.hash)) {
		$('#edit', document).addClass('active');
	}

	// Activate edit button
	$('#edit', document).bind('click', function () {
		var checked;

		$(this).toggleClass('active');
		document.body.classList.toggle('edit-mode');

		checked = $(this).hasClass('active')

		$('#sidebar', window.parent.document).css({
			width: checked ? '50%' : '25%'
		});
		$('#main-div', window.parent.document).css({
			width: checked ? '50%' : '75%'
		});

		window.parent.location.hash = checked ?
			`edit/${window.path}`:
			`view/${window.path}`;

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
			if (controller) {
				controller.frames().contents.src = `edit?path=${window.path}`;
			} else {
				window.location.href = `/samples/#edit/${window.path}`;
			}
		} else {
			controller.frames().contents.src = '/samples/contents'
		}
	});

	// Activate mobile view button
	const mobilePreviewAnchor = document.getElementById('mobile-preview');
	if (localStorage.getItem('mobile-preview')) {
		mobilePreviewAnchor.classList.add('active');
	}
	mobilePreviewAnchor.addEventListener('click', () => {
		if (!document.body.classList.contains('mobile-preview')) {
			document.body.classList.add('mobile-preview');
			mobilePreviewAnchor.classList.add('active');
			localStorage.setItem('mobile-preview', 'true');
		} else {
			document.body.classList.remove('mobile-preview');
			mobilePreviewAnchor.classList.remove('active');
			localStorage.removeItem('mobile-preview');
		}
	});

	// Activate share button
	const shareButton = document.getElementById('share');
	shareButton.addEventListener('click', (e) => {
		const src = shareButton.href,
			popup = document.getElementById('popup');

		popup.style.display = 'block';
		document.getElementById('popup-body').innerHTML =
			`<iframe src="${src}"></iframe>`;
		e.preventDefault();
	});

	// Close popup
	document.getElementById('popup').addEventListener('click', () => {
		document.getElementById('popup').style.display = 'none';
	});
});
