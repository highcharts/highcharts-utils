const Config = require('../../config.json');
const FS = require('fs');
const JSZip = require('jszip');
const Path = require('path');
const Request = require('request');

const url = 'http://api.worldbank.org/v2/en/indicator/SP.POP.TOTL?downloadformat=csv';
const csvParsing = new RegExp('(?:^|\\s+|\\,)(?:\\"([^\\"]*?)\\")+', 'gm');

module.exports = function () {
    return new Promise((resolve, reject) => Request.get(url, { encoding: null },
        (error, response, body) => {
            if (error) {
                reject(error);
                return;
            }
            return JSZip
                .loadAsync(body)
                .then(archive => {
                    let historyFile = archive.files['API_SP.POP.TOTL_DS2_en_csv_v2.csv'];
                    if (!historyFile) {
                        throw new Error('API_SP.POP.TOTL_DS2_en_csv_v2.csv not found');
                    }
                    return Promise.all([
                        generateWorldPopulationHistoryCsv(historyFile),
                        generateWorldPopulationHistoryJson(historyFile),
                    ]);
                })
                .then(successes => Promise.resolve(successes.every(success => { return success; })));
        }
    ));
}

const generateWorldPopulationHistoryCsv = function (zipFile) {
    return zipFile
        .async('text')
        .then(csv => {
            return new Promise((resolve, reject) => {
                FS.appendFile(
                    Path.join(Config['highchartsDir'], 'samples/data/world-population-history.csv'),
                    csv.replace(new RegExp('[\\r\\n]+\\"Last Updated Date\\"[\\d\\,\\-\\"]+'), ''),
                    { encoding: 'utf8', flag: 'w' },
                    (error) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(true);
                        }
                    }
                );
            })
        });
}

const generateWorldPopulationHistoryJson = function (zipFile) {
    return zipFile
        .async('text')
        .then(csv => {
            let json = [],
                match = null;

            csvParsing.lastIndex = 0;

            while ((match = csvParsing.exec(csv)) !== null) {
                if (match[0][0] === ',') {
                    json[json.length - 1].push(match[1]);
                }
                else {
                    json.push([match[1]]);
                }
            }

            return json;
        })
        .then(json => {
            let lastYear = parseInt(json[2][json[2].length - 1]);

            if (lastYear < 1960) {
                throw new Error('Invalid lastYear: ' + lastYear);
            }

            let finalDataSet = null,
                finalJson = {
                    info: {
                        start: 1960, end: lastYear
                    },
                    entries: []
                };

            let dataEnd = 0,
                dataParsed = 0,
                dataSet = null;

            for (let index = 3, indexEnd = json.length; index < indexEnd; ++index) {

                dataSet = json[index];
                dataEnd = dataSet.length;

                if (dataEnd < 5) {
                    continue;
                }

                finalDataSet = {
                    name: dataSet[0],
                    code3: dataSet[1],
                    data: [],
                    z: 0
                };

                for (let j = 4; j < dataEnd; ++j) {
                    dataParsed = parseInt(dataSet[j]);
                    finalDataSet.data.push(dataParsed ? dataParsed : null);
                    finalDataSet.z = (dataParsed > 0 ? dataParsed : finalDataSet.z);
                }

                finalJson.entries.push(finalDataSet);
            }

            return finalJson;
        })
        .then(json => {
            return new Promise((resolve, reject) => {
                FS.appendFile(
                    Path.join(Config['highchartsDir'], 'samples/data/world-population-history.json'),
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
            });
        });
};
