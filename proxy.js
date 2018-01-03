var http = require('http');
var httpProxy = require('http-proxy');

var proxy = httpProxy.createProxy();
var options = {  
  'utils.highcharts.local': 'http://localhost:3000',
  'code.highcharts.local': 'http://localhost:3001'
}

// Start utils.highcharts.local
require('./bin/www');
require('./app-code');

http.createServer(function(req, res) {
  	proxy.web(req, res, {
    	target: options[req.headers.host]
  	});
}).listen(80);