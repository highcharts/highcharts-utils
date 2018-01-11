const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');
const hostile = require('hostile');
const exitHook = require('async-exit-hook');
const argv = require('yargs').argv;
const cfg = require('./config.json');
const fs = require('fs');
const path = require('path');

const topDomain = argv.topdomain || 'local';

const pemFile = path.join(
  __dirname,
  'certs',
  'highcharts.local.key.pem'
);
const crtFile = path.join(
  __dirname,
  'certs',
  'highcharts.local.crt'
);
const httpsOptions = {
  key: fs.existsSync(pemFile) && fs.readFileSync(pemFile, 'utf-8'),
  cert: fs.existsSync(crtFile) && fs.readFileSync(crtFile, 'utf-8')
};

// Start utils.highcharts.local
require('./bin/www');

// Start code.highcharts.local
require('./app-code');

// Require colors
require('colors');

// Set up the proxy server
const proxy = httpProxy.createProxy();

const redirects = {
  'utils.highcharts.*': `http://localhost:${cfg.utilsPort}`,
  'code.highcharts.*': `http://localhost:${cfg.codePort}`
}

let sslEnabled = false;

http.createServer((req, res) => {
	let host = req.headers.host.replace(/\.[a-z]+$/, '.*');
  	proxy.web(req, res, {
    	target: redirects[host]
  	});
}).listen(80);

if (httpsOptions.key && httpsOptions.cert) {

    sslEnabled = true;

    https.createServer(httpsOptions, (req, res) => {
        let host = req.headers.host.replace(/\.[a-z]+$/, '.*');
        proxy.web(req, res, {
            target: redirects[host]
        });
    }).listen(443);
}

// Set up the hosts file
const domains = [
	`utils.highcharts.${topDomain}`,
	`code.highcharts.${topDomain}`
];
domains.forEach(domain => {
	hostile.set('127.0.0.1', domain);
});

// Remove domains from hosts file on exit
exitHook(callback => {
	domains.forEach(domain => {
		hostile.remove('127.0.0.1', domain);
	});
	callback();
});

const protocol = sslEnabled ? 'https' : 'http';
console.log(`
Servers:
- Utils server: ${protocol}://${domains[0]} or http://localhost:${cfg.utilsPort}.
- Code server: ${protocol}://${domains[1]} or http://localhost:${cfg.codePort}.

SSL enabled: ${sslEnabled}

Parameters:
--topdomain
  Defaults to "local", defines the top domain for utils.highcharts.* and
  code.highcharts.* for debugging over network and virtual machines.
`.green);

