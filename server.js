const http = require('http');
const httpProxy = require('http-proxy');
const colors = require('colors');
const hostile = require('hostile');
const exitHook = require('async-exit-hook');
const argv = require('yargs').argv;

const topDomain = argv.topdomain || 'local';


// Start utils.highcharts.local
require('./bin/www');

// Start code.highcharts.local
require('./app-code');


// Set up the proxy server
const proxy = httpProxy.createProxy();
const redirects = {
  'utils.highcharts.*': 'http://localhost:3000',
  'code.highcharts.*': 'http://localhost:3001'
}
http.createServer((req, res) => {
	host = req.headers.host.replace(/\.[a-z]+$/, '.*');
  	proxy.web(req, res, {
    	target: redirects[host]
  	});
}).listen(80);

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


console.log(`
Servers:
- Utils server: ${domains[0]} or http://localhost:3000.
- Code server: ${domains[1]} or http://localhost:3001.

Parameters:
--topdomain
  Defaults to "local", defines the top domain for utils.highcharts.* and
  code.highcharts.* for debugging over network and virtual machines.
`.green);

