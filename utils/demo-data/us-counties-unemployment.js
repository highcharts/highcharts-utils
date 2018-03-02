const Config = require('../../config.json');
const FS = require('fs');
const Path = require('path');
const Request = require('request');

const txtParser = new RegExp('(\\w+)\\s\\|\\s+(\\d+)\\s+\\|\\s+(\\d+)\\s+\\|\\s+([\\s\\w]+)\\,\\s(\\w{2,2})\\s+\\|\\s+(\\w\\w\\w)-(\\d\\d)\\s+\\|\\s+([\\d\\,]+)\\s+\\|\\s+([\\d\\,]+)\\s+\\|\\s+([\\d\\,]+)\\s+\\|\\s+([\\d\\.]+)', 'gm');
const url = 'https://www.bls.gov/web/metro/laucntycur14.txt';

module.exports = function () {
    return new Promise((resolve, reject) => Request.get(url, {},
        (error, response, body) => {

            if (error) {
                reject(error);
                return;
            }

            let json = [],
                match = null;

            txtParser.lastIndex = 0;

            while ((match = txtParser.exec(body)) !== null)
            {
                json.push({
                    code: ('us-' + match[5].toLowerCase() + '-' + match[3]),
                    name: (match[4] + ', ' + match[5]),
                    value: match[11]
                })
            }

            FS.appendFile(
                Path.join(Config['highchartsDir'], 'samples/data/us-counties-unemployment.json'),
                JSON.stringify(json, undefined, '\t'),
                { encoding: 'utf8', flag: 'w' },
                (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(true);
                    }
                }
            );
        }
    ));
}