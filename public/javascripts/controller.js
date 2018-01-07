/* global $, window */
/* eslint new-cap: 0 */
var controller = { // eslint-disable-line no-unused-vars

    // Holds all the Sample items
    samples: null,
    compare: null,

    // Set from index.html
    server: null,

    batchRuns: 0,

    onLoad: [function () {
        controller.samples.forEach(function (sample) {
            sample.options.compare = controller.compare[sample.path];
            sample.renderList();
        });

        controller.loaded = true;
        controller.updateStatus()
    }],

    runLoad: function () {
        if (controller.samples && controller.compare) {
            controller.onLoad.forEach(function (fn) {
                fn();
            });
        }
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
        $.ajax({
            dataType: 'json',
            url: '/temp/compare.' + controller.server.branch + '.' +
                controller.getBrowser().toLowerCase() +
                '.json',
            success: function (compare) {
                controller.compare = compare;
                controller.runLoad();
            },
            error: function () {
                controller.compare = {};
                controller.runLoad();
            }
        });
    },

    frames: function () {
        return {
            frameset: window.parent.document.querySelector('frameset'),
            contents: window.parent.document.getElementById('contents'),
            commits: window.parent.document.getElementById('commits-frame'),
            main: window.parent.document.getElementById('main')
        };
    },

    toggleBisect: function (active) {
        var frames = controller.frames(),
            frame = frames.commits,
            frameset = frames.frameset,
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
                frame = window.parent.document.createElement('frame');
                frame.setAttribute('id', 'commits-frame');
                frame.setAttribute('src', '/bisect/commits');
            } else {
                frame.contentWindow.location.reload();
            }

            frameset.setAttribute('cols', '400, *, 400');
            frameset.appendChild(frame);
        } else {
            commitsFrame = window.parent.document
                .getElementById('commits-frame');
            if (commitsFrame) {
                frameset.removeChild(commitsFrame);
                frameset.setAttribute('cols', '400, *');
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

            var totalWidth = 95;
            var remaining = (
                controller.samples.length -
                testStatus.success.length -
                testStatus.error.length
            );
            var successWidth = (
                (testStatus.success.length / controller.samples.length) *
                totalWidth
            );
            var errorWidth = (
                (testStatus.error.length / controller.samples.length) *
                totalWidth
            );
            var remainingWidth =
                (remaining / controller.samples.length) * totalWidth;
            var table = '<div class="progress">' +
                '<div class="success" style="width:' + successWidth + '%"></div>' +
                '<div class="error" style="width:' + errorWidth + '%"></div>' +
                '<div class="remaining" style="width:' + remainingWidth +'%"></div>' +
                '</div>';

            this.frames().contents.contentDocument.getElementById('test-status')
                .innerHTML =
                '<span class="success">Success: ' + testStatus.success.length + '</span>, ' +
                '<a class="' + (testStatus.error.length ? 'error' : '') +
                '" href="javascript:controller&&controller.filter(\'error\')">' +
                'Error: ' + testStatus.error.length + '</a>, ' +
                '<a class="remaining" href="javascript:controller&&controller.filter(\'remaining\')">' +
                'Remaining: ' + remaining + '</a> of ' +
                '<a href="javascript:controller&&controller.filter()">' +
                    controller.samples.length + '</a>' +

                table;

            


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
                    success.indexOf(sample.path) !== -1
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
        var nextSample = controller.samples[controller.currentSample.index];
        if (nextSample) {
            controller.frames().main.contentWindow.location.href = 
                controller.frames().main.contentWindow.location.href
                    .replace(controller.currentSample.path, nextSample.path);
        }
    },

    batchMode: function() {
        var contentsDoc = controller.frames().contents.contentDocument;
        controller.continueBatch = true;
        $('#batch-compare', contentsDoc).hide();
        $('#batch-stop', contentsDoc).show();
    },

    runBatch: function() {
        controller.frames().main.contentWindow.location.href = 
            '/samples/compare-view?path=' +
            (controller.currentSample || controller.samples[0]).path;
        controller.batchMode();
    },

    stopBatch: function() {
        var contentsDoc = controller.frames().contents.contentDocument;
        controller.continueBatch = false;
        $('#batch-stop', contentsDoc).hide();
        $('#batch-compare', contentsDoc).show();
    },

    /**
     * Pick up calls to www.highcharts.com/samples/data and redirect to the
     * local /samples/data
     */
    getJSON: function (url, callback) {
        var match = url.match(
            /https:\/\/www\.highcharts\.com\/samples\/data\/jsonp\.php\?filename=([^\&]+)/
        )
        if (match) {
            url = '/samples/data/' + match[1];
        }
        $.ajax({
            dataType: 'json',
            url: url,

            // Strip comments
            dataFilter: function (data) {
                var filtered = data.replace(
                    /\/\*.+?\*\/|\/\/.*(?=[\n\r])/g,
                    ''
                );
                if (filtered.indexOf('Date.UTC') !== -1) {
                    filtered = eval(filtered);
                    filtered = JSON.stringify(filtered);
                }
                return filtered;
            },
            success: callback,
            error: function (xhr, status, e) {
                console.error(
                    '$.ajax error:',
                    controller.currentSample.path,
                    e,
                    xhr
                );
            }
        });

    }

};
