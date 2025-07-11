import hostile from 'hostile';
import http from 'node:http';
import https from 'node:https';
import httpProxy from 'http-proxy';
import exitHook from 'async-exit-hook';
import fs from 'node:fs';
import ip from 'ip';
import path from 'node:path';
import 'colors';

import {
  apiPort,
  codePort,
  codeSecurePort,
  crtFile,
  highchartsDir,
  localOnly,
  pemFile,
  proxy as useProxy,
  topdomain as topDomain,
  utilsPort
} from './lib/arguments.js';
import * as f from './lib/functions.js';

const __filename = import.meta.filename;

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


const hcPackage = f.getLocalJSON(path.join(highchartsDir, 'package.json'));

if (hcPackage.name !== 'highcharts') {
  throw new Error(`
    Highcharts repo not found, please set "highchartsDir" in config.json or through CLI arguments.
  `);
}

// Start utils.highcharts.local
import './bin/www';

// Start code.highcharts.local
import './app-code.js';

// Start api.highcharts.local
import './app-api.js';

// Require colors
import 'colors';

// Set up the proxy server
const proxy = httpProxy.createProxy();

proxy.on('error', console.error);

const redirects = {
  'utils.highcharts.*': `http://127.0.0.1:${utilsPort}`,
  'utils.highcharts.*': `ws://127.0.0.1:${utilsPort}`,
  'utils.highcharts.*': `http://[::1]:${utilsPort}`,
  'utils.highcharts.*': `ws://[::1]:${utilsPort}`,
  'code.highcharts.*': `http://127.0.0.1:${codePort}`,
  'code.highcharts.*': `http://[::1]:${codePort}`,
  'api.highcharts.*': `http://127.0.0.1:${apiPort}`,
  'api.highcharts.*': `http://[::1]:${apiPort}`
}
if (useProxy) {

  /**
   * Upgrade handler for WebSocket connections.
   */
  function onUpgrade(req, socket, head) {
    // Replace the top-level domain with a wildcard
    const host = req.headers.host.replace(/\.[a-z]+$/, '.*');
    const target = redirects[host];
    if (target) {
      proxy.ws(req, socket, head, { target });
    } else {
      socket.destroy(); // Optional: cleanly close unknown upgrades
    }
  }

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

  server.on('upgrade', onUpgrade);

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

      const httpsServer = https.createServer(httpsOptions, (req, res) => {
        const host = req.headers.host.replace(/\.[a-z]+$/, '.*');
        proxy.web(req, res, { target: redirects[host] });
      });

      httpsServer.on('upgrade', onUpgrade);

      httpsServer.listen(443);
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


