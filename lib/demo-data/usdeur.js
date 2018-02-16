const Config = require('../../config.json');
const FS = require('fs');
const Path = require('path');
const Request = require('request');
const Xml2Json = require('xml2json');

const url = 'https://sdw-wsrest.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?startPeriod=2007-01-01&endPeriod=2017-12-31&detail=dataonly';

module.exports = function () {
    return new Promise((resolve, reject) => Request.get(url, { encoding: null },
        (error, response, body) => {

            if (error) {
                reject(error);
                return;
            }

            try {
                let json = Xml2Json.toJson(body.toString(), { object: true });
                let data = json['message:GenericData']['message:DataSet']['generic:Series']['generic:Obs'];

                Promise
                    .all([
                        generateUsdEurJs(data),
                        generateUsdEurJson(data)
                    ])
                    .then(successes => Promise.resolve(successes.every(success => { return success; })))
                    .catch(reject);
            }
            catch (error) {
                reject(error);
            }
        }
    ));
}

const generateUsdEurJs = function (data) {
    return new Promise((resolve, reject) => {
        try {
            let currentDate = null,
                currentValue = NaN,
                lastValue = 0.7537,
                js = ['/* eslint no-unused-vars: 0 */\nvar usdeur = ['];

            data.forEach(dataSet => {
                currentDate = new Date(Date.parse(dataSet['generic:ObsDimension'].value));
                currentValue = parseAndSwitchRate(dataSet['generic:ObsValue'].value);

                if (js.length > 1) {
                    js[js.length - 1] += ',';
                }

                js.push(
                    '\t[Date.UTC(' +
                    currentDate.getUTCFullYear() +
                    ', ' +
                    currentDate.getUTCMonth() +
                    ', ' +
                    currentDate.getUTCDate() +
                    '), ' +
                    (currentValue || lastValue) +
                    ']'
                );

                if (currentValue) {
                    lastValue = currentValue;
                }
            });

            js.push('];');

            FS.appendFile(
                Path.join(Config['highchartsDir'], 'samples/data/usdeur.js'),
                js.join('\n'),
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
        catch (error) {
            reject(error);
        }
    });
};

const generateUsdEurJson = function (data) {
    return new Promise((resolve, reject) => {
        try {
            let currentDate = null,
                currentValue = NaN,
                lastValue = 0.7537,
                json = [];

            data.forEach(dataSet => {
                currentDate = Date.parse(dataSet['generic:ObsDimension'].value);
                currentValue = parseAndSwitchRate(dataSet['generic:ObsValue'].value);

                json.push([currentDate, (currentValue || lastValue)]);

                if (currentValue) {
                    lastValue = currentValue;
                }
            });

            FS.appendFile(
                Path.join(Config['highchartsDir'], 'samples/data/usdeur.json'),
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
        catch (error) {
            reject(error);
        }
    });
};

const parseAndSwitchRate = function (rate) {
    return (Math.round(((1 / parseFloat(rate)) + 0.0001) * 10000) / 10000);
};
