const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');
const hostile = require('hostile');
const exitHook = require('async-exit-hook');
const fs = require('fs');
const ip = require('ip');
require('colors');

const {
  apiPort,
  codePort,
  crtFile,
  highchartsDir,
  pemFile,
  proxy: useProxy,
  topdomain: topDomain,
  utilsPort
} = require('./lib/arguments.js');

let sslEnabled = false;
let utilsDomainLine = '';
let codeDomainLine = '';
let apiDomainLine = '';

const log = () => {
  const ipAddress = ip.address();

  console.log(`
  Utils server available at:
    ${utilsDomainLine}- http://localhost:${utilsPort}
    - http://${ipAddress}:${utilsPort}
  Code server available at:
    ${codeDomainLine}- http://localhost:${codePort}
    - http://${ipAddress}:${codePort}
  API server available at:
    ${apiDomainLine}- http://localhost:${apiPort}
    - http://${ipAddress}:${apiPort}

  SSL enabled: ${sslEnabled}

  Parameters:
  Run --help to list parameters

  Development:
  While developing highcharts-utils, run 'nodemon ./bin/www' and point your
  browser to http://localhost:3030. It watches source file changes and restarts
  automatically.
  `.cyan);
}

const httpsOptions = {
  key: fs.existsSync(pemFile) && fs.readFileSync(pemFile, 'utf-8'),
  cert: fs.existsSync(crtFile) && fs.readFileSync(crtFile, 'utf-8')
};


let hcPackage = require(`${highchartsDir}/package.json`);
if (hcPackage.name !== 'highcharts') {
  console.error(`
    Highcharts repo not found, please set "highchartsDir" in config.json or through CLI arguments.
  `.red);
  return;
}

// Start utils.highcharts.local
require('./bin/www');

// Start code.highcharts.local
require('./app-code');

// Start api.highcharts.local
require('./app-api');

// Require colors
require('colors');

// Set up the proxy server
const proxy = httpProxy.createProxy();

proxy.on('error', console.error);

const redirects = {
  'utils.highcharts.*': `http://localhost:${utilsPort}`,
  'code.highcharts.*': `http://localhost:${codePort}`,
  'api.highcharts.*': `http://localhost:${apiPort}`
}
if (useProxy) {
  const server = http.createServer((req, res) => {
  	let host = req.headers.host.replace(/\.[a-z]+$/, '.*');
    	proxy.web(req, res, {
      	target: redirects[host]
    	});
  })


  server.on('error', () => {
    console.error(`
  Could not start proxy server, virtual hosts will not be available.
  Do you have another server running on port 80?
  `.red)
    log();
  });


  server.listen(80, () => {


    // Find out which user used sudo through the environment variable, so that
    // bisect doesn't write all files with the root user
    /*
    const uid = parseInt(process.env.SUDO_UID);
    if (uid) {
        process.setuid(uid);
    }
    */

    if (httpsOptions.key && httpsOptions.cert) {

        sslEnabled = true;

        https.createServer(httpsOptions, (req, res) => {
            let host = req.headers.host.replace(/\.[a-z]+$/, '.*');
            proxy.web(req, res, {
                target: redirects[host]
            });
        }).listen(443);
    } else {
      console.log(`  SSL key files not found, starting non-secure.
    - pemFile: ${pemFile}
    - crtFile: ${crtFile}`
        .yellow)
    }

    // Set up the hosts file
    const domains = [
      `utils.highcharts.${topDomain}`,
      `code.highcharts.${topDomain}`,
      `api.highcharts.${topDomain}`
    ];
    const protocol = sslEnabled ? 'https' : 'http';
    utilsDomainLine = `- ${protocol}://${domains[0]}
    `;
    codeDomainLine = `- ${protocol}://${domains[1]}
    `;
    apiDomainLine = `- ${protocol}://${domains[2]}
    `;
    
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
    log();
  });

} else {
  log();
}


