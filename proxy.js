var http = require('http');
var httpProxy = require('http-proxy');
var colors = require('colors');

var proxy = httpProxy.createProxy();
var options = {  
  'utils.highcharts.*': 'http://localhost:3000',
  'code.highcharts.*': 'http://localhost:3001'
}

// Start utils.highcharts.local
require('./bin/www');
require('./app-code');

http.createServer(function(req, res) {

	host = req.headers.host.replace(/\.[a-z]+$/, '.*');
  	proxy.web(req, res, {
    	target: options[host]
  	});
}).listen(80);

console.log(`
- Started utils server on http://localhost:3000.
- Started code server on http://localhost:3001.
- For your convenience, you may add the locations to the hosts file. Make
utils.highcharts.local and code.highcharts.local (or any top domain) point to
127.0.0.1. They will be picked up by the proxy server.
`.green);
