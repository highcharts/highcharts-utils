/* global $, window */
/* eslint new-cap: 0 */
var controller = { // eslint-disable-line no-unused-vars

    // Holds all the Sample items
    samples: null,
    compare: null,

    // Set from index.html
    server: null,

    batchRuns: 0,
    compareMode: 'local',

    // How much relative difference do we tolerate between the nightly diff and
    // the local pixel diff before we mark a visual test red.
    tolerance: 0.15,

    onLoad: [function () {
        controller.samples.forEach(function (sample) {
            controller.compare[sample.path] = controller.compare[sample.path] || {};

            sample.reset(); // When switching from local to nightly
            sample.options.compare = controller.compare[sample.path];
            sample.renderList();
        });

        controller.unitTestCount = controller.samples.filter(function (sample) {
            return sample.isUnitTest();
        }).length;

        controller.loaded = true;
        controller.updateStatus()
    }],

    runLoad: function () {
        if (controller.samples && controller.compare && controller.nightly) {
            controller.onLoad.forEach(function (fn) {
                fn();
            });
        }
    },

    loadNightly: function () {
        $.getJSON('/samples/nightly/latest.json', function (nightly) {
            controller.nightly = nightly;
            controller.runLoad();
        });
    },

    loadSamples: function () {
        $.getJSON('/samples/list-samples', function (samples) {

            // Create Sample instances
            controller.samples = samples.map(function (options, i) {
                return controller.Sample(
                    options,
                    i + 1
                );
            });

            // Look up by path in addition to index
            controller.samples.forEach(function (sample) {
                controller.samples[sample.path] = sample;
            });

            controller.runLoad();
        });
    },

    loadCompare: function () {
        var url,
            error;

        if (controller.compareMode === 'nightly') {
            url = '/samples/nightly/latest.json';
            error = function (e) {
                alert('Error loading latest nightly\n' +
                    e.status + ' ' + e.statusText + '\n' +
                    url
                );
                controller.compare = {};
                controller.runLoad();
            }
        } else {
            url = '/temp/compare.' + controller.server.branch.replace('/', '-') + '.' +
                controller.getBrowser().toLowerCase() +
                '.json';
            error = function (e) {
                console.error('Error loading compare', e);
                controller.compare = {};
                controller.runLoad();
            };
        }

        $.ajax({
            dataType: 'json',
            url: url,
            success: function success (compare) {
                controller.compare = compare;
                controller.runLoad();
            },
            error: error
        });
    },

    frames: function () {
        return {
            frameset: window.parent.document.querySelector('frameset'),
            index: window,
            contents: window.parent.document.getElementById('contents'),
            commits: window.parent.document.getElementById('commits-frame'),
            main: window.parent.document.getElementById('main')
        };
    },

    toggleBisect: function (active) {
        var frames = controller.frames(),
            frame = frames.commits,
            checked,
            $button = $('#bisect', frames.main.contentDocument),
            commitsFrame;

        if (active === false) {
            $button.removeClass('active');
            checked = false;
        } else if (active === true) {
            $button.addClass('active');
            checked = true;
        } else {
            $button.toggleClass('active');
            checked = $button.hasClass('active');
        }

        if (checked) {
            window.parent.commits = {};

            if (!frame) {
                frame = window.parent.document.createElement('iframe');
                frame.setAttribute('id', 'commits-frame');
                frame.setAttribute('src', '/bisect/bisect');
            } else {
                frame.contentWindow.location.reload();
            }

            window.parent.document.body.classList.add('bisect');
            window.parent.document.getElementById('bisect-div')
                .appendChild(frame);
        } else {
            commitsFrame = window.parent.document
                .getElementById('commits-frame');
            if (commitsFrame) {
                window.parent.document.getElementById('bisect-div')
                    .removeChild(commitsFrame);
                window.parent.document.body.classList.remove('bisect');
            }
        }
    },

    testStatus: {
        success: [],
        skipped: [],
        error: []
    },

    updateStatus: function (path, status) {
        var testStatus = this.testStatus;

        if (path) {
            // Remove from others
            ['success', 'skipped', 'error'].forEach(function (coll) {
                if (coll !== status) {
                    var i = testStatus[coll].indexOf(path);
                    if (i !== -1) {
                        testStatus[coll].splice(i, 1);
                    }
                }
            });
            if (testStatus[status]) {
                if (testStatus[status].indexOf(path) === -1) {
                    testStatus[status].push(path);
                }
            }
        }

        if (controller.loaded) {

            var totalWidth = 99;
            var total = controller.samples.length - controller.unitTestCount;
            var remaining = (
                total -
                testStatus.success.length -
                testStatus.error.length
            );
            var successWidth = (
                (testStatus.success.length / total) *
                totalWidth
            );
            var errorWidth = (
                (testStatus.error.length / total) *
                totalWidth
            );
            var remainingWidth = (remaining / total) * totalWidth;
            var table = '<div class="progress">' +
                '<div class="success" style="width:' + successWidth + '%"></div>' +
                '<div class="error" style="width:' + errorWidth + '%"></div>' +
                '<div class="remaining" style="width:' + remainingWidth +'%"></div>' +
                '</div>';

            this.frames().contents.contentDocument.getElementById('test-status')
                .innerHTML =
                table +
                '<span class="success">Success: ' + testStatus.success.length + '</span>, ' +
                '<a class="' + (testStatus.error.length ? 'error' : '') +
                '" href="javascript:controller&&controller.filter(\'error\')">' +
                'Error: ' + testStatus.error.length + '</a>, ' +
                '<a class="remaining" href="javascript:controller&&controller.filter(\'remaining\')">' +
                'Remaining: ' + remaining + '</a> of ' +
                '<a href="javascript:controller&&controller.filter()">' +
                    total + '</a>';


            controller.docTitle();

        }

        // Click good or bad
        var bisectButton =
            controller.frames().commits &&
            controller.frames().commits.contentDocument &&
            controller.frames().commits.contentDocument.querySelector('input.automatic').checked &&
            controller.frames().commits.contentDocument.getElementById(
                'current-' + { success: 'good', error: 'bad' }[status]
            );

        if (bisectButton) {
            bisectButton.click();
        }
    },

    docTitle: function () {
        if (controller.continueBatch && controller.currentSample) {
            document.title =
                controller.currentSample.index + ' - ' +
                '\u2713 ' + controller.testStatus.success.length + ' - ' +
                '\u2716 ' + controller.testStatus.error.length + ' - ' +
                controller.samples.length;
        } else {
            document.title = 'Sample viewer - Highcharts'
        }
    },

    getBrowser: function () {
        var ua = window.navigator.userAgent;

        if (/MSIE/i.test(ua) && !/Opera/i.test(ua)) {
            return 'MSIE';
        }
        if (/Trident/i.test(ua)) {
            return 'MSIE';
        }
        if (/Firefox/i.test(ua)) {
            return 'Firefox';
        }
        if (/Edge/i.test(ua)) {
            return 'Edge';
        }
        if (/Chrome/i.test(ua)) {
            return 'Chrome';
        }
        if (/PhantomJS/i.test(ua)) {
            return 'PhantomJS';
        }
        if (/Safari/i.test(ua)) {
            return 'Safari';
        }
        if (/Opera/i.test(ua)) {
            return 'Opera';
        }
        if (/Netscape/i.test(ua)) {
            return 'Netscape';
        }
        return '';
    },

    /*
     * Update the contents to show only errors, or show all
     */
    filter: function (status) {
        var contentFrame = this.frames().contents,
            error = this.testStatus.error,
            success = this.testStatus.success;

        controller.samples.forEach(function (sample) {
            if (status === 'error' && error.indexOf(sample.path) === -1) {
                sample.getLi().style.display = 'none';

            } else if (
                status === 'remaining' &&
                (
                    error.indexOf(sample.path) !== -1 ||
                    success.indexOf(sample.path) !== -1 ||
                    sample.isUnitTest()
                )
            ) {
                sample.getLi().style.display = 'none';

            } else {
                sample.getLi().style.display = '';
            }
        });

        // Headers
        [].forEach.call(
            contentFrame.contentDocument.querySelectorAll('h2, h4'),
            function (h) {
                if (status === 'error' || status === 'remaining') {
                    h.style.display = 'none';
                } else {
                    h.style.display = '';
                }
            }
        );
    },

    getQueryParameters: function (win) {
        var pairs = (win || window).location.search.slice(1).split('&');

        var result = {};
        pairs.forEach(function (pair) {
            pair = pair.split('=');
            result[pair[0]] = decodeURIComponent(pair[1] || '');
        });
        return result;
    },

    addResources: function (doc, resources) {
        if (resources) {
            resources.forEach(function (res) {
                var type = res.substring(res.lastIndexOf('.') + 1);

                var elem = doc.createElement({
                    js: 'script',
                    css: 'link'
                }[type]);

                elem.setAttribute({
                    js: 'src',
                    css: 'href'
                }[type], res);

                if (type === 'css') {
                    elem.setAttribute('type', 'text/css');
                    elem.setAttribute('rel', 'stylesheet');
                }
                doc.head.appendChild(elem);
            });
        }
    },

    next: function () {
        // No + 1 because .index is 1-based
        var index = controller.currentSample.index - 1,
            nextSample;

        // Jump to the next visible item
        while (index++ && index <= controller.samples.length) {
            nextSample = controller.samples[index];
            if (nextSample.getLi().style.display !== 'none') {
                controller.frames().main.contentWindow.location.href =
                    controller.frames().main.contentWindow.location.href
                        .replace(controller.currentSample.path, nextSample.path);
                break;
            }
        }
    },

    previous: function () {
        // No + 1 because .index is 1-based
        var prevSample = controller.samples[controller.currentSample.index - 2];
        if (prevSample) {
            controller.frames().main.contentWindow.location.href =
                controller.frames().main.contentWindow.location.href
                    .replace(controller.currentSample.path, prevSample.path);
        }
    },

    batchMode: function() {
        var contentsDoc = controller.frames().contents.contentDocument;
        controller.continueBatch = true;
        $('#batch-compare', contentsDoc).hide();
        $('#batch-stop', contentsDoc).show();
        controller.docTitle();
    },

    runBatch: function() {
        controller.continueBatch = true;
        controller.frames().main.contentWindow.location.href =
            '/samples/compare-view?path=' +
            (controller.currentSample || controller.samples[0]).path;
        controller.batchMode();
    },

    proceedBatch: function () {
        if (controller.continueBatch) {
            var contentDoc = controller.frames().contents.contentDocument,
                href,
                next,
                nextIndex = controller.currentSample.index;

            while (nextIndex++) {
                next = contentDoc.getElementById('i' + nextIndex);
                if (next) {
                    href = next.href;
                } else {
                    window.parent.location = '/samples';
                    return;
                }

                // If the next sample is skipTest, just mark it yellow and
                // proceed without opening the compare view
                var nextSample = controller.samples[nextIndex];
                if (
                    nextSample &&
                    nextSample.options.details &&
                    nextSample.options.details.skipTest
                ) {
                    nextSample.setDiff('skip');
                    nextSample.setClassName();
                    continue;
                }
                // Skip unit tests in batch mode, they're only there for visual
                // debugging
                if (nextSample && nextSample.isUnitTest()) {
                    continue;
                }
                if (
                    nextSample &&
                    nextSample.options.details &&
                    nextSample.options.details.requiresManualTesting
                ) {
                    continue;
                }

                // We have a match, break out and use this sample
                if (
                    (
                        !contentDoc.getElementById('i' + nextIndex) ||
                        /batch/.test(
                            contentDoc.getElementById('i' + nextIndex).className
                        )
                    ) && contentDoc.getElementById('i' + nextIndex).parentNode.style.display !== 'none'

                ) {
                    break;
                }
            }

            href = href.replace("/view?", "/compare-view?");

            controller.batchRuns++;
            // Clear memory build-up from time to time by reloading the
            // whole thing.
            if (controller.batchRuns > 90) {
                window.top.location.hash = '#batch/' + controller.samples[nextIndex].path;
                window.top.location.reload();
            } else {
                controller.frames().main.contentWindow.location.href = href;
            }

        // Else, log the result
        } else {
            if (typeof diff === 'function') { // leaks from jsDiff
                //diff = 0;
            }
        }
    },

    stopBatch: function() {
        var contentsDoc = controller.frames().contents.contentDocument;
        controller.continueBatch = false;
        controller.docTitle();
        $('#batch-stop', contentsDoc).hide();
        $('#batch-compare', contentsDoc).show();
    },

    /**
     * Pick up calls to www.highcharts.com/samples/data and redirect to the
     * local /samples/data
     * @todo Pick up CORS calls to https://cdn.rawgit.com and www.hc.com
     */
    getJSON: function (url, callback) {

        var path = url;
        var match;


        match = url.match(
            /https:\/\/www\.highcharts\.com\/samples\/data\/(.+)\.json/
        )
        if (match) {
            path = '/samples/data/' + match[1] + '.json';
        }

        match = url.match(
            /https:\/\/cdn\.rawgit\.com\/highcharts\/highcharts\/[a-z0-9\.]+\/samples\/data\/(.+)\.json/
        )
        if (match) {
            path = '/samples/data/' + match[1] + '.json';
        }

        $.ajax({
            dataType: 'json',
            url: path,

            // Strip comments
            /*
            dataFilter: function (data) {
                if (!data) {
                    console.error(
                        '@getJSON.dataFilter',
                        'No data found',
                        url,
                        path
                    );
                }
                var filtered = (data || '').replace(
                    /\/\*.+?\*\/|\/\/.*(?=[\n\r])/g,
                    ''
                );
                if (filtered.indexOf('Date.UTC') !== -1) {
                    filtered = eval(filtered);
                    filtered = JSON.stringify(filtered);
                }
                return filtered;
            },
            */
            success: callback,
            error: function (xhr, status, e) {
                if (
                    controller.frames().main &&
                    controller.frames().main.contentWindow &&
                    controller.frames().main.contentWindow.onDifferent
                ) {
                    controller.frames().main.contentWindow.onDifferent('Err');
                }
                throw e;
            }
        });

    }

};
