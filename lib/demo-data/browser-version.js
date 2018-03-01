const Config = require('../../config.json');
const FS = require('fs');
const Path = require('path');
const Request = require('request');
const CompareVersions = require('compare-versions');

const csvParser = new RegExp('(?:\\"([^\\"]+?)\\")\\,([\\d.]+)[\\r\\n]+', 'g');
// Download URL taken from http://gs.statcounter.com/browser-version-market-share
const url = 'http://gs.statcounter.com/chart.php?device=Desktop&device_hidden=desktop&multi-device=true&statType_hidden=browser_version&region_hidden=ww&granularity=monthly&statType=Browser%20Version&region=Worldwide&fromInt=201801&toInt=201801&fromMonthYear=2018-01&toMonthYear=2018-01&csv=1';

module.exports = function () {
    return new Promise((resolve, reject) => Request.get(url, {},
        (error, response, body) => {

            let json = {},
                match = null;

            csvParser.lastIndex = 0;

            while ((match = csvParser.exec(body)) !== null) {

                let browser = match[1],
                    share = parseFloat(match[2]),
                    version = browser.substr(browser.lastIndexOf(' ') + 1);

                if (version === '0') {
                    continue;
                }

                browser = (browser.substr(0, browser.lastIndexOf(' ')) || 'Other');

                if (browser === 'IE') {
                    browser = 'Internet Explorer';
                }

                if (share < 0.1) {
                    browser = 'Other';
                }

                if (!json[browser]) {
                    json[browser] = {
                        name: browser,
                        y: 0,
                        drilldown: []
                    };
                }

                json[browser].y += share;

                if (browser !== 'Other') {
                    json[browser].drilldown.push([('v' + version), share]);
                }
            }

            let finalJson = {
                series: [{
                    name: 'Browser names',
                    colorByPoint: true,
                    data: []
                }],
                drilldown: {
                    series: []
                },
                donut_categories: [],
                donut_data: []
            };

            Object
                .keys(json)
                .forEach(browser => {
                    if (
                        browser != 'Other' &&
                        (
                            json[browser].y < 1
                            || json[browser].drilldown.length < 3
                        )
                    ) {
                        json['Other'].y += (Math.round(json[browser].y * 100) / 100);
                        return;
                    }

                    json[browser].drilldown = json[browser].drilldown.sort((a, b) => {
                        return CompareVersions(b[0], a[0]);
                    });

                    finalJson.series[0].data.push({
                        name: browser,
                        y: (Math.round(json[browser].y * 100) / 100),
                        drilldown: browser
                    });

                    finalJson.drilldown.series.push({
                        name: browser,
                        id: browser,
                        data: json[browser].drilldown
                    });

                    finalJson.donut_categories.push(browser);

                    let donutData = {
                        y: (Math.round(json[browser].y * 100) / 100),
                        drilldown: {
                            name: browser,
                            categories: [],
                            data: []
                        }
                    };

                    json[browser].drilldown.forEach(versionSet => {
                        donutData.drilldown.categories.push(browser + ' ' + versionSet[0]);
                        donutData.drilldown.data.push(versionSet[1]);
                    });

                    finalJson.donut_data.push(donutData);

                    if (browser === 'Other') {
                        let tempData = finalJson.series[0].data.pop();
                        tempData.drilldown = null;
                        finalJson.series[0].data.push(tempData);

                        finalJson.drilldown.series.pop();

                        let tempData2 = finalJson.donut_data.pop();
                        tempData2.drilldown.categories.push(browser);
                        tempData2.drilldown.data.push(tempData.y)
                        finalJson.donut_data.push(tempData2);
                    }
                })

            FS.appendFile(
                Path.join(Config['highchartsDir'], 'samples/data/browser-version.json'),
                JSON.stringify(finalJson, undefined, '\t'),
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
};
