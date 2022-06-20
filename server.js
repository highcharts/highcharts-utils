
require = require("esm")(module);

const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');
const exitHook = require('async-exit-hook');
const fs = require('fs');
const ip = require('ip');
const path = require('path');
require('colors');

const {
  apiPort,
  codePort,
  codeSecurePort,
  crtFile,
  highchartsDir,
  localOnly,
  pemFile,
  proxy: useProxy,
  topdomain: topDomain,
  utilsPort
} = require('./lib/arguments.js');

let sslEnabled = false;
let utilsDomainLine = '';
let codeDomainLine = '';
let apiDomainLine = '';
let proxyError = '';

const log = () => {
  const ipAddress = ip.address();

  console.log(`
  Utils server available at:
    ${utilsDomainLine}- http://localhost:${utilsPort}
    - http://${ipAddress}:${utilsPort}
  Code server available at:
    ${codeDomainLine}- http://localhost:${codePort}
    - http://${ipAddress}:${codePort}${
    codeSecurePort ? `
    ${codeDomainLine}- https://localhost:${codeSecurePort}
    - https://${ipAddress}:${codeSecurePort}` : ''}
  API server available at:
    ${apiDomainLine}- http://localhost:${apiPort}
    - http://${ipAddress}:${apiPort}

  Proxy SSL enabled: ${sslEnabled}
  Highcharts folder: ${path.relative(process.cwd(), highchartsDir)}

  Run --help to list parameters

  Development:
  While developing highcharts-utils, run 'npm run dev' and point your
  browser to http://localhost:3030. It watches source file changes and restarts
  automatically.
  `.cyan +
  proxyError);
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
  'utils.highcharts.*': `http://127.0.0.1:${utilsPort}`,
  'utils.highcharts.*': `http://[::1]:${utilsPort}`,
  'code.highcharts.*': `http://127.0.0.1:${codePort}`,
  'code.highcharts.*': `http://[::1]:${codePort}`,
  'api.highcharts.*': `http://127.0.0.1:${apiPort}`,
  'api.highcharts.*': `http://[::1]:${apiPort}`
}
if (useProxy) {
  const server = http.createServer((req, res) => {
    const host = req.headers.host.replace(/\.[a-z]+$/, '.*');

    if (redirects[host])  {
      proxy.web(req, res, {
        target: redirects[host]
      });
    } else {
      res.writeHead(500, {
        'Content-Type': 'text/html'
      });
      res.end(`Unknown host <b>${host}</b> in <b>${__filename}</b>`);
    }
  });


  server.on('error', () => {
    proxyError = `
  Could not start proxy server, do you have another server running on port 80?
  Virtual hosts will not be available, but IP adress and localhost will work.
  `.yellow;
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

    let domainsEnabled = !localOnly;
    if (!localOnly) {
      const hostile = require('hostile');
      try {
        // Add domains to hosts file
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
      } catch (e) {
        domainsEnabled = false;
      }
    }

    if (domainsEnabled) {
      const protocol = sslEnabled ? 'https' : 'http';
      utilsDomainLine = `- ${protocol}://${domains[0]}
      `;
      codeDomainLine = `- ${protocol}://${domains[1]}
      `;
      apiDomainLine = `- ${protocol}://${domains[2]}
      `;
    }

    log();
  });

} else {
  log();
}


