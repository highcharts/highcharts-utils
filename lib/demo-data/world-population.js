const Config = require('../../config.json');
const FS = require('fs');
const JSZip = require('jszip');
const Path = require('path');
const Request = require('request');

const csvParser = new RegExp('(?:^|\\s+|\\,)(?:\\"([^\\"]*?)\\")+', 'gm');
const landUrl = 'http://api.worldbank.org/v2/en/indicator/AG.LND.TOTL.K2?downloadformat=csv';
const populationUrl = 'http://api.worldbank.org/v2/en/indicator/SP.POP.TOTL?downloadformat=csv';

module.exports = function () {
    return new Promise((resolve, reject) => Request.get(populationUrl, { encoding: null },
        (error, response, body) => {
            if (error) {
                reject(error);
                return;
            }
            return JSZip
                .loadAsync(body)
                .then(zipFile => {
                    let historyFile = zipFile.files['API_SP.POP.TOTL_DS2_en_csv_v2.csv'];
                    if (!historyFile) {
                        throw new Error('API_SP.POP.TOTL_DS2_en_csv_v2.csv not found');
                    }
                    return Promise.all([
                        generateWorldPopulationDensityJson(historyFile),
                        generateWorldPopulationHistoryCsv(historyFile),
                        //generateWorldPopulationHistoryJson(historyFile),
                        generateWorldPopulationJson(historyFile),
                    ]);
                })
                .then(successes => Promise.resolve(successes.every(success => { return success; })))
                .catch(reject);
        }
    ));
}

const generateWorldPopulationDensityJson = function (fileInZip) {
    return fileInZip
        .async('text')
        .then(csv => {
            let json = [],
                match = null;

            csvParser.lastIndex = 0;

            while ((match = csvParser.exec(csv)) !== null) {
                if (match[0][0] === ',') {
                    json[json.length - 1].push(match[1]);
                }
                else {
                    json.push([match[1]]);
                }
            }

            return Promise.all([
                loadWorldLandJson(),
                Promise.resolve(json),
            ]);
        })
        .then(jsons => {
            let landJson = jsons[0];
            let populationJson = jsons[1];

            let lastYear = parseInt(populationJson[2][populationJson[2].length - 1]);

            if (lastYear < 1960) {
                throw new Error('Invalid lastYear: ' + lastYear);
            }

            let finalDataSet = null,
                finalJson = [];

            let dataEnd = 0,
                dataParsed = 0,
                dataSet = null;

            for (let index = 3, indexEnd = populationJson.length; index < indexEnd; ++index) {

                dataSet = populationJson[index];
                dataEnd = dataSet.length;

                if (dataEnd < 5) {
                    continue;
                }

                finalDataSet = {
                    code3: dataSet[1],
                    name: dataSet[0],
                    value: 0,
                };

                if (!landJson[finalDataSet.code3]) {
                    continue;
                }

                dataParsed = parseFloat(dataSet[dataSet.length - 1] || dataSet[dataSet.length - 2]);

                if (!dataParsed) {
                    continue;
                }

                finalDataSet.value = Math.round(dataParsed / landJson[dataSet[1]].value);

                finalJson.push(finalDataSet);
            }

            return finalJson;
        })
        .then(json => {
            return new Promise((resolve, reject) => {
                FS.appendFile(
                    Path.join(Config['highchartsDir'], 'samples/data/world-population-density.json'),
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

/* not in use by any demo
const generateWorldPopulationHistoryJson = function (fileInZip) {
    return fileInZip
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
                    z: 0,
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
// */

const generateWorldPopulationJson = function (fileInZip) {
    return fileInZip
        .async('text')
        .then(csv => {
            let json = [],
                match = null;

            csvParser.lastIndex = 0;

            while ((match = csvParser.exec(csv)) !== null) {
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
                finalJson = [];

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
                    code3: dataSet[1],
                    z: 0,
                };

                for (let j = 4; j < dataEnd; ++j) {
                    dataParsed = parseInt(dataSet[j]);
                    finalDataSet.z = (dataParsed > 0 ? Math.round(dataParsed / 1000) : finalDataSet.z);
                }

                finalJson.push(finalDataSet);
            }

            return finalJson;
        })
        .then(json => {
            return new Promise((resolve, reject) => {
                FS.appendFile(
                    Path.join(Config['highchartsDir'], 'samples/data/world-population.json'),
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

const loadWorldLandJson = function () {
    return new Promise((resolve, reject) => Request.get(landUrl, { encoding: null },
        (error, response, body) => {
            if (error) {
                reject(error);
                return;
            }
            JSZip
                .loadAsync(body)
                .then(archive => {
                    let historyFile = archive.files['API_AG.LND.TOTL.K2_DS2_en_csv_v2.csv'];
                    if (!historyFile) {
                        throw new Error('API_AG.LND.TOTL.K2_DS2_en_csv_v2.csv not found');
                    }
                    return historyFile.async('text');
                })
                .then(csv => {
                    let json = [],
                        match = null;

                    csvParser.lastIndex = 0;

                    while ((match = csvParser.exec(csv)) !== null) {
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
                        finalJson = {};

                    let dataEnd = 0,
                        dataParsed = 0,
                        dataSet = null;

                    for (let index = 3, indexEnd = json.length; index < indexEnd; ++index) {

                        dataSet = json[index];
                        dataEnd = dataSet.length;

                        if (dataEnd < 5) {
                            continue;
                        }

                        dataParsed = parseInt(dataSet[dataSet.length - 1]);

                        if (!dataParsed) {
                            continue;
                        }

                        finalDataSet = {
                            code3: dataSet[1],
                            name: dataSet[0],
                            value: dataParsed,
                        };

                        finalJson[finalDataSet.code3] = finalDataSet;
                    }

                    resolve(finalJson);
                })
                .catch(reject);
        }
    ));
};
