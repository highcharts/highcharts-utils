This utility generates fresh data for a number of Highcharts demos. Therefor
you have to specify the Highcharts directory in the config.json of the main
folder.

You can start the utility in the shell by `npm run demodata`. It should
be run only once a year, preferably on a major release. You may have to
configure some path or URL inside the generators to keep the data up-to-date.

The utility will generate the following files in your Highcharts directory:
- samples/data/browser-versions.json [1]
- samples/data/large-dataset.js
- samples/data/large-dataset.json
- samples/data/us-counties-unemployment.json
- samples/data/usdeur.js
- samples/data/usdeur.json
- samples/data/world-mortality.json [2]
- samples/data/world-population-density.json
- samples/data/world-population-history.csv
- samples/data/world-population.json

[1] Important: The content of the `browser-versions.json`, which can be deleted
after this, has to be put in a reasonable way into the following files of the
Highcharts directory:
- samples/highcharts/demo/column-drilldown/demo.js
- samples/highcharts/demo/pie-donut/demo.js
- samples/highcharts/demo/pie-drilldown/demo.js

[2] Important: Requires a local CSV file, that is generated out of an Excel
file (rows 7, 8, 12, 73, and 201 of the second sheet) provided by the WHO. The
Excel file can be downloaded from:
http://www.who.int/entity/healthinfo/global_burden_disease/GHE2015_Deaths-2015-country.xls?ua=1