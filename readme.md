# Highcharts Utilities

Visual testing and debugging tools for Highcharts.

## Installation

Run `npm install`

## Start server

- OSX: `sudo node server`
- Windows: Open a CLI with administrator priviliges and run `node server`

This will start a proxy server on port 80, start servers on `localhost:3030` and
`localhost:3031` (configurable ports) and set up virtual hosts for
`utils.highcharts.local` and `code.highcharts.local` respectively.

#### Unobtrusive utils

If you don't want to block port 80 and don't need the virtual hosts, run
`npm start` and open `http://localhost:3030`.

#### Debugging the utils application

Run `nodemon ./bin/www` and open `http://localhost:3030`.

## Usage

The default settings for these options are specified
in the [config.json](config.json) file. For a detailed explanation of these
options, refer to the [settings-help](lib/settings-help.js) file. To change the
options at the runtime use "Session settings" menu (the gear icon) on the
"View samples" subpage. The options that are handled at the runtime:

- codeWatch
- compileOnDemand
- emulateKarma
- useESModules
- useMinifiedCode

CLI arguments are available for preview with `npx highcharts-utils --help`,
or an equivalent command. The options that are handled at the runtime set
through "Session settings" (explained above) have precedence over
the CLI arguments.

See [highcharts/samples](https://github.com/highcharts/highcharts/tree/master/samples)
for description of how the samples are set up and how to use the utils.

The server `code.highcharts.local` is serving files locally from the `/code`
folder in your highcharts repository. The folder `/code` is created by running
`gulp` in the root folder of the Highcharts repo. See [config.json](config.json)
for pointing to the location of your cloned Highcharts repo.

### Worktree support

Utils can switch between Highcharts Git worktrees at runtime from the sample
page top bar (`🌲` selector).

How it works:

- `highchartsDir` in [config.json](config.json) remains the default base repo.
- Available entries come from `git worktree list` for `highchartsDir`.
- The selected worktree is stored in `temp/config-user.json` as `worktreeDir`.
- Runtime paths (samples, API and compile-on-demand) are resolved dynamically
  from the active directory.
- Worktree selection is constrained to the parent scope of `highchartsDir`
  (sibling worktrees), and invalid selections are rejected.

Notes:

- `/api/worktree` can include stale entries with `isValid: false`; the UI hides
  those entries and `/api/worktree/select` rejects them.
- If no valid alternative worktree is available, the worktree selector is hidden.
- If `worktreeDir` is missing, invalid, or out of allowed scope, utils falls
  back to `highchartsDir`.
- When a previously selected worktree path no longer exists, `worktreeDir` is
  cleared from `temp/config-user.json`.
- File watchers are reinitialized on explicit worktree switch
  (`/api/worktree/select`).

## Optional: Using with HTTPS

Enabling HTTPS makes it easier to test things on 3rd party pages that use SSL.

#### OSX

Run `cd certs && chmod 755 osx.create.ssl.certs.sh && ./osx.create.ssl.certs.sh`
from the project directory. Requires that homebrew is installed.

Next you need to whitelist the certificate. Open the `/certs` folder, and
double click the `highcharts.local.csr`. For the Keychain (nøkkelring) option,
select _System_, then Add. Note that the change only takes effect after
the next system login.

If you're having problems running the secure server on the Mac, see
[this Stack Overflow question](https://stackoverflow.com/questions/58802767/no-proceed-anyway-option-on-neterr-cert-invalid-in-chrome-on-macos).

#### Windows

Run `cd certs && ./win.create.ssl.certs.sh` from the project directory.
Requires that OpenSSL is installed. Press `Enter` to use the suggested default
values for the certificate.

Next you need to install the certificate to whitelist it. Open the cert folder,
and double click the `highcharts.local.csr`, select "Install Certficate...",
and select "Next" until finished to let Windows choose the default settings.
Note that the change only takes effect after the next system login.
