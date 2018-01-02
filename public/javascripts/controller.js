/* global $, controller, window */
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
            url: './temp/compare.' + controller.server.branch + '.' +
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

    toggleBisect: function () {
        var frames = this.frames(),
            frame = frames.commits,
            frameset = frames.frameset,
            checked;

        $(this).toggleClass('active');
        checked = $(this).hasClass('active');

        if (checked) {
            window.parent.commits = {};

            if (!frame) {
                frame = window.parent.document.createElement('frame');
                frame.setAttribute('id', 'commits-frame');
                frame.setAttribute('src', '/issue-by-commit/commits.php');
            } else {
                frame.contentWindow.location.reload();
            }

            frameset.setAttribute('cols', '400, *, 400');
            frameset.appendChild(frame);
        } else {
            frameset.setAttribute('cols', '400, *');
        }
    },

    testStatus: {
        success: [],
        skipped: [],
        error: [],
        total: 0
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

        this.frames().contents.contentDocument.getElementById('test-status')
            .innerHTML =
            'Success: ' + testStatus.success.length + ', ' +
            '<a href="javascript:controller&&controller.filter(\'error\')">Error: ' +
                testStatus.error.length + '</a> of ' +
            '<a href="javascript:controller&&controller.filter()">' +
                testStatus.total + '</a>';
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
            error = this.testStatus.error;

        contentFrame.contentWindow.samples.forEach(function (path, i) {
            var li = contentFrame.contentDocument.querySelector('li#li' + i);
            if (li) {

                if (status === 'error' && error.indexOf(path) === -1) {
                    li.style.display = 'none';
                } else {
                    li.style.display = '';
                }
            }
        });

        [].forEach.call(
            contentFrame.contentDocument.querySelectorAll('h2, h4'),
            function (h) {
                if (status === 'error') {
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


    batchMode: function() {
        var contentsDoc = controller.frames().contents.contentDocument;
        controller.continueBatch = true;
        $('#batch-compare', contentsDoc).hide();
        $('#batch-stop', contentsDoc).show();
    },

    runBatch: function() {
        var contentsDoc = controller.frames().contents.contentDocument;

        controller.frames().main.contentWindow.location.href = 
            '/samples/compare-view?path=' +
            (controller.currentSample || controller.samples[i]).path;
        controller.batchMode();
    },

    stopBatch: function() {
        var contentsDoc = controller.frames().contents.contentDocument;
        controller.continueBatch = false;
        $('#batch-stop', contentsDoc).hide();
        $('#batch-compare', contentsDoc).show();
    }

};
