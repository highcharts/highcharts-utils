/**
 * Generates a large dataset of hourly temperatures since 2009 and writes the
 * results in two files:
 * ../../highcharts/samples/data/large-dataset.js
 * ../../highcharts/samples/data/large-dataset.json
 */

const FS = require('fs');
const Path = require('path');
const Request = require('request');
const { samplesDir } = require('../../lib/arguments.js');

const url = 'http://vikjavev.no/ver/history.json.php?year=';

module.exports = function () {
    let promisses = [];

    for (let year = 2009, thisYear = (new Date()).getUTCFullYear(); year < thisYear; ++year) {
        promisses.push(loadVikTemperatureForYear(year));
    }

    return Promise
        .all(promisses)
        .then(years => {
            let json = {
                pointStart: 1230764400000,
                pointInterval: 3600000,
                dataLength: 0,
                data: []
            };

            years.every(temperature => json.data = json.data.concat(temperature));

            json.dataLength = json.data.length;

            return json;
        })
        .then(json => {
            return Promise.all([
                saveAsJs(json.data),
                saveAsJson(json)
            ])
        })
        .then(successes => {
            return Promise.resolve(successes.every(success => success));
        });
};

const loadVikTemperatureForYear = function (year) {
    return new Promise((resolve, reject) => Request(url + year, {},
        (error, response, body) => {

            if (error) {
                reject(error);
                return;
            }
            else try {
                resolve(JSON.parse(body)[0].data.map(pair => { return pair[1]; }));
            }
            catch (catchedError) {
                reject(catchedError);
            }
        }
    ));
};

const saveAsJs = function (json) {
    return new Promise((resolve, reject) => {
        FS.appendFile(
            Path.join(samplesDir, 'data/large-dataset.js'),
            (
                '/* eslint no-unused-vars: 0 */\nvar temperatures = ' +
                JSON.stringify(json, undefined, '    ') +
                ';'
            ),
            { encoding: 'utf8', flag: 'w' },
            (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(true);
                }
            }
        );
    });
};

const saveAsJson = function (json) {
    return new Promise((resolve, reject) => {
        FS.appendFile(
            Path.join(samplesDir, 'data/large-dataset.json'),
            JSON.stringify(json),
            { encoding: 'utf8', flag: 'w' },
            (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(true);
                }
            }
        );
    });
};