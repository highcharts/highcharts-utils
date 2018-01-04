/* eslint-env browser */
/* global $, controller, window */
/* eslint require-jsdoc: 0, valid-jsdoc: 0 */
controller.Sample = function (options, index) {

    var contentsDoc = controller.frames().contents.contentDocument,
        mainNav = contentsDoc.getElementById('main-nav'),
        dirs = options.path.split('/'),
        ulId = ('ul-' + dirs[0] + '-' + dirs[1]).replace(/\./g, '-'),
        li = mainNav.querySelector('li#li' + index),
        diff;

    /**
     * Add headers the first time samples are listed
     */
    function addHeaders() {
        // h2 headers
        if (!mainNav.querySelector('h2#' + dirs[0])) {
            var h2 = contentsDoc.createElement('h2');
            h2.innerHTML = dirs[0];
            h2.id = dirs[0];
            mainNav.appendChild(h2);
        }

        // h4 subheaders
        var h4Id = (dirs[0] + '-' + dirs[1]).replace(/\./g, '-');
        if (!mainNav.querySelector('h4#' + h4Id)) {
            var h4 = contentsDoc.createElement('h4');
            h4.innerHTML = dirs[0] + '/' + dirs[1];
            h4.id = h4Id;
            mainNav.appendChild(h4);
        }
    }

    function isUnitTest() {
        return Boolean(
            options.files['unit-tests.js'] ||
            (
                options.details &&
                options.details.resources &&
                options.details.resources.toString().indexOf('qunit') !== -1
            )
        );
    }

    function addTestAnchor() {

        var testAnchor;
        if (options.details && options.details.requiresManualTesting) {
            testAnchor = contentsDoc.createElement('input');
            testAnchor.type = 'checkbox';
            testAnchor.className = 'dissimilarity-index manual-checkbox';
            testAnchor.id = 'checkbox-' + options.path;
            testAnchor.checked = (diff === '0');

        } else {
            testAnchor = contentsDoc.createElement('a');
            testAnchor.className = 'dissimilarity-index';
            testAnchor.href = '/samples/compare-view?path=' + options.path;
            testAnchor.target = 'main';
            testAnchor.innerHTML = '<i class="' +
                (isUnitTest() ? 'icon-puzzle-piece' : 'icon-columns') +
                '"></i>';

            if (diff !== '') {
                if (
                    (/^[0-9\.\/]+$/.test(diff) || diff > 0) && diff !== '0'
                ) {
                    if (diff.indexOf('.') > -1) {
                        diff = (Math.round(diff * 100) / 100).toString();
                    }
                    testAnchor.setAttribute('data-diff', diff);
                    testAnchor.innerHTML = diff;
                }
            }
        }

        li.appendChild(testAnchor);
    }


    function addCommentAnchor() {
        var commentIcon = '<i class="icon-pencil" title="Add comment"></i>',
            comment = options.compare && options.compare.comment;

        if (comment) {
            // Make it string
            commentIcon =
                '<i class="icon-' + comment.symbol + '" title="' +
                comment.title + '"></i>' +
                '<span class="comment-title">' + comment.title +
                '<br>(Approved diff: ' + comment.diff + '</span>';
        }

        var commentAnchor = contentsDoc.createElement('a');
        commentAnchor.className = 'comment';
        commentAnchor.target = 'main';
        commentAnchor.href = '/samples/compare-comment?path=' + options.path +
            '&diff=' + diff + '&browser=' + controller.getBrowser().toLowerCase();
        commentAnchor.innerHTML =
            commentIcon;
        li.appendChild(commentAnchor);
    }

    function setClassName() {
        var className = '',
            comment = options.compare && options.compare.comment;

        if (options.details && options.details.requiresManualTesting) {
            className = 'manual';
        }
        if (diff !== '') {
            if ((/^[0-9\.\/]+$/.test(diff) || diff > 0) && diff !== '0') {
                className = 'different';
            } else {
                className = 'identical';
            }
        }

        // Sample is different but approved
        if (comment) {
            if (
                comment.symbol === 'check' &&
                comment.diff == diff // eslint-disable-line eqeqeq
            ) {
                className = 'approved';
            } else if (comment.symbol === 'exclamation-sign') {
                className = 'different';
            }
        }

        if (this === controller.currentSample) {
            className += ' hilighted';
        }
        li.className = className;
    }

    /**
     * Render the item in the main-nav list
     */
    function renderList() {

        addHeaders();

        // Add list
        var ul = mainNav.querySelector('ul#' + ulId);
        if (!ul) {
            ul = contentsDoc.createElement('ul');
            ul.id = ulId;
            mainNav.appendChild(ul);
        }

        // Add list item
        if (!li) {
            li = contentsDoc.createElement('li');
            li.id = 'li' + index;
            ul.appendChild(li);
        }
        li.innerHTML = index + '. '; // Flushes previous content

        // Add main anchor
        var anchor = contentsDoc.createElement('a');
        anchor.innerHTML = options.path;
        anchor.id = 'i' + index;
        anchor.target = 'main';
        anchor.href = isUnitTest() ?
            '/samples/compare-view?path=' + options.path +
                '&dummy=' + Date.now() :
            '/samples/view?path=' + options.path;
        if (!(options.details && options.details.requiresManualTesting)) {
            anchor.className = 'batch';
        }
        li.appendChild(anchor);

        // Set the diff
        if (typeof diff === 'undefined') {
            if (options.compare && options.compare.diff) {
                diff = options.compare.diff;
            } else {
                diff = '';
            }
        }

        // Render test anchor
        addTestAnchor();

        // Add comment anchor
        addCommentAnchor();

        // Finally add the class name
        setClassName();
    }

    /**
     * Set the diff and report back to the server.
     */
    function setDiff(newDiff) {
        if (newDiff.toString() !== diff) {
            
            diff = newDiff.toString();
            $.extend(true, options, {
                compare: {
                    diff: diff
                }
            });
            save();
            renderList();
        }
    }

    /**
     * Save the current compare diff and comment to file.
     */
    function save() {
        $.get('/samples/compare-update-report', {
            path: options.path,
            browser: controller.getBrowser().toLowerCase(),
            compare: options.compare
        });
    }

    function setOptions(newOptions) {
        $.extend(true, options, newOptions);
        renderList();
        save()
    }


    /**
     * Set the current sample and highlight it in the left
     */
    function setCurrent() {

        var lastCurrentSample = controller.currentSample;

        controller.currentSample = this;
        if (lastCurrentSample) {
            lastCurrentSample.setClassName();
        }
        this.setClassName();
        $('html,body', contentsDoc).animate({
            scrollTop: $(li).offset().top - 300
        }, 'slow');

    }

    return {
        index: index,
        isUnitTest: isUnitTest,
        options: options,
        path: options.path,
        renderList: renderList,
        save: save,
        setClassName: setClassName,
        setCurrent: setCurrent,
        setOptions: setOptions,
        setDiff: setDiff
    };
};
