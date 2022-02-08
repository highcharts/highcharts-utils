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

				if (
					// jQuery UI
					s.indexOf("sizzle") !== -1 ||
					s.indexOf("<a href='/a'>a</a>") !== -1 ||
					s.indexOf("<input/>") !== -1 ||
					s.indexOf("<select disabled='disabled'>") ||
					s.indexOf("<textarea>x</textarea>") !== -1
				) {
					return s;
				}

				while (caller && !caller.beenThere) {
					var fnString = caller.toString();

					// Lean on fragments by jQuery. Not very robust but it works
					// for now.
					//
					// @todo: Upgrade to jQuery 4 and pass Trusted Types
					// directly, then remove this policy. Or just remove jQuery
					// altogether
					if (
						fnString.indexOf('jQuery') !== -1 ||
						fnString.indexOf("<div class='a'></div>") !== -1 ||
						fnString.indexOf("<a href='#'></a>") !== -1 ||
						fnString.indexOf("<input/>") !== -1 ||
						fnString.indexOf("<select msallowclip=''>") !== -1 ||
						fnString.indexOf("<a href='/a'>a</a>") !== -1
					) {
						return s;
					}

					caller.beenThere = true;
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