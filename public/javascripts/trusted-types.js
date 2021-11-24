var trustedTypes = window.trustedTypes;

// Add default trusted types so that jQuery is allowed to make DOM
// modifications
if (
	trustedTypes &&
	typeof trustedTypes.createPolicy === 'function'
) {
	trustedTypes.createPolicy(
		'default', {
			createHTML: function(s) {
				var caller = arguments.callee.caller;
				while (caller) {
					if (caller.toString().indexOf(
						// Lean on a comment in jQuery. Not very robust
						// but it works for now.
						'Firefox dies'
					) !== -1) {
						return s;
					}
					caller = caller.caller;
				}

				throw new TypeError(
					'Disallowed HTML, use Trusted Types only.'
				)
			},
			createScript: function(s) {
				return s;
			},
            createScriptURL: function(s) {
                return s;
            }
		}
	);
}