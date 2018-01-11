# Highcharts Utilities

Visual testing and debugging tools for Highcharts.

### Usage
`sudo node server`

This will start a proxy server on port 80, start servers on `localhost:3030` and
`localhost:3031` (configurable ports) and set up virtual hosts for
`utils.highcharts.local` and `code.highcharts.local` respectively.

#### Unobtrusive utils
If you don't want to block port 80 and don't need the virtual hosts, run
`npm start` and open `http://localhost:3030`.

### Debugging the utils application
Run `npm start` and open `http://localhost:3030`.


## Using with HTTPS

Enabling HTTPS makes it easier to test things on 3rd party pages that use SSL.

### OSX

Run `cd certs && chmod osx.create.ssl.certs.sh && osx.create.ssl.certs.sh` from the project directory. Requires that homebrew is installed.

Note that Chrome will auto-block self-signed certs, so when you start the server,
you should visit [https://utils.highcharts.local](https://utils.highcharts.local) and [https://code.highcharts.local/](https://code.highcharts.local), and whitelist them for the session.
