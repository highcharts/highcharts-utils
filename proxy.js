var http = require('http');
var httpProxy = require('http-proxy');

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