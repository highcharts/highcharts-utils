/* eslint-env browser */
/* global $, controller */
controller.Sample = function (options, index) {

    var contentsDoc = (
            controller.frames().contents &&
            controller.frames().contents.contentDocument
        ),
        mainNav = contentsDoc && contentsDoc.getElementById('main-nav'),
        productJump = contentsDoc && contentsDoc.getElementById('product-jump'),
        dirs = options.path.split('/'),
        ulId = ('ul-' + dirs[0] + '-' + dirs[1]).replace(/\./g, '-'),
        li = mainNav && mainNav.querySelector('li#li' + index),
        iconDiv = li && li.querySelector('.icons'),
        diff,
        status;

    /**
     * Add headers the first time samples are listed
     */
    function addHeaders() {
        // Update jump selector
        if (!productJump.querySelector('option[value="' + dirs[0] + '"]')) {
            var option = contentsDoc.createElement('option');
            option.innerText = dirs[0].toUpperCase();
            option.value = dirs[0];
            productJump.appendChild(option);
        }

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
        return (
            options.details &&
            options.details.resources &&
            options.details.resources.toString().indexOf('qunit') !== -1
        );
    }

    function addTestAnchor() {

        var testAnchor,
            requiresManualTesting = options.details &&
                options.details.requiresManualTesting,
            skipTest = options.details && options.details.skipTest;

        if (requiresManualTesting) {
            testAnchor = contentsDoc.createElement('input');
            testAnchor.type = 'checkbox';
            testAnchor.className = 'dissimilarity-index manual-checkbox';
            testAnchor.id = 'checkbox-' + options.path;
            testAnchor.checked = (diff === '0');

            $(testAnchor).click(function () {
                if (this.checked) {
                    $(li).removeClass('different').addClass('identical');
                } else {
                    $(li).removeClass('identical').addClass('different');
                }

                setDiff(this.checked ? 0 : 1);
            });

        } else if (skipTest) {
            testAnchor = contentsDoc.createElement('a');
            testAnchor.className = 'dissimilarity-index skip';
            testAnchor.href = '/samples/compare-view?path=' + options.path;
            testAnchor.target = 'main';
            testAnchor.innerHTML = '<i class="fa fa-ban"></i>';
            testAnchor.title = 'Skipped by setting skipTest:true in demo.details';

        } else {
            testAnchor = contentsDoc.createElement('a');
            testAnchor.className = 'dissimilarity-index';
            testAnchor.href = '/samples/compare-view?path=' + options.path;
            testAnchor.target = 'main';
            testAnchor.innerHTML = '<i class="' +
                (isUnitTest() ? 'fa fa-puzzle-piece' : 'fa fa-columns') +
                '"></i>';

            if (diff !== '') {
                if (
                    (/^[0-9\.\/]+$/.test(diff) || diff > 0 || diff === 'Err') && diff !== '0'
                ) {
                    if (diff.toString().indexOf('.') > -1) {
                        diff = (Math.round(diff * 100) / 100).toString();
                    }
                    testAnchor.setAttribute('data-diff', diff);
                    var innerHTML = diff;
                    if (diff >= 1000) {
                        innerHTML = Math.round(diff / 1000) + 'k';
                    }
                    testAnchor.innerHTML = innerHTML;
                }
            }
        }
        iconDiv.appendChild(testAnchor);
    }

    // Render nightly anchor
    function addStandaloneAnchor() {
        var icon = '<i class="fa fa-external-link" title="Standalone window"></i>';

        var anchor = contentsDoc.createElement('a');
        anchor.className = 'standalone';
        anchor.target = '_blank';
        anchor.href = isUnitTest() ?
            '/samples/compare-iframe?which=right&path=' + options.path :
            '/samples/view?path=' + options.path;
        anchor.innerHTML = icon;
        iconDiv.appendChild(anchor);
    }


    function addVSCodeAnchor() {
        var icon = '<i class="fa fa-file-code-o" title="Open in VSCode"></i>';
        var highchartsDir = controller.frames().contents.contentWindow
            .highchartsDir;

        var anchor = contentsDoc.createElement('a');
        anchor.target = 'main';
        anchor.href = `vscode://file/${highchartsDir}/samples/${options.path}/demo.js`;
        anchor.innerHTML = icon;
        iconDiv.appendChild(anchor);
    }

    function addNightlyAnchor() {
        var icon = '<i class="fa fa-moon-o" title="Nightly test"></i>';

        var anchor = contentsDoc.createElement('a');
        anchor.className = 'nightly-single';
        anchor.target = 'main';
        anchor.href = '/samples/nightly/single?path=' + options.path;
        anchor.innerHTML = icon;
        iconDiv.appendChild(anchor);
    }

    function addCommentAnchor() {
        var commentIcon = '<i class="fa fa-comment-o" title="Add comment"></i>',
            comment = options.compare && options.compare.comment;

        if (comment) {
            // Make it string
            commentIcon =
                '<i class="fa fa-' + comment.symbol + '" title="' +
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
        iconDiv.appendChild(commentAnchor);
    }

    function isTolerated() {
        var nightlyResult = controller.nightly[options.path];
        if (nightlyResult) {
            var nightlyDiff = +nightlyResult.diff;
            var change = diff - nightlyDiff;
            var relativeChange = Math.abs(change / nightlyDiff);
            if (relativeChange < controller.tolerance) {
                return true;
            }
        }
        return false;
    }

    function setClassName() {
        var isHidden = li.classList.contains('hidden'),
            className = '',
            comment = options.compare && options.compare.comment;

        if (options.details && options.details.requiresManualTesting) {
            className = 'manual';
        }
        if (diff !== '') {
            if ((/^[0-9\.\/]+$/.test(diff) || diff > 0 || diff === 'Err') && diff !== '0') {
                className = 'different';
                status = 'error';
            } else if (diff === 'skip') {
                className = 'skip';
                status = 'success';
            } else {
                className = 'identical';
                status = 'success';
            }
        }

        // Sample is different but approved
        if (comment) {
            if (
                comment.symbol === 'check' &&
                comment.diff == diff // eslint-disable-line eqeqeq
            ) {
                className = 'approved';
                status = 'success';
            } else if (comment.symbol === 'warning') {
                className = 'different';
                status = 'error';
            }
        }

        // Sample is different but within tolerance
        if (isTolerated()) {
            className = 'approved tolerated';
            status = 'success';
        }

        if (options.path === (controller.currentSample && controller.currentSample.path)) {
            className += ' hilighted';
        }

        if (isHidden) {
            className += ' hidden';
        }

        li.className = className;
    }

    /**
     * Render the item in the main-nav list
     */
    function renderList() {

        addHeaders();

        // Add list
        var ul = mainNav.querySelector('ul#' + ulId),
            innerHTML = options.path;

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
        li.innerHTML = ''; // Flushes previous content

        // No capital
        if (/[A-Z]/.test(innerHTML)) {
            innerHTML = '<span style="color:red">Only lower case allowed in folders:<br>' + innerHTML + '</span>';
        }

        // Add main anchor
        var anchor = contentsDoc.createElement('a');
        anchor.innerHTML = innerHTML;
        anchor.id = 'i' + index;
        anchor.target = 'main';
        anchor.href = isUnitTest() ?
            '/samples/compare-view?path=' + options.path +
                '&dummy=' + Date.now() :
            '/samples/view?path=' + options.path;
        if (!(options.details && options.details.requiresManualTesting)) {
            anchor.className = 'batch';
        }
        anchor.title = options.path;
        li.appendChild(anchor);

        iconDiv = contentsDoc.createElement('div');
        iconDiv.className = 'icons';
        li.appendChild(iconDiv);

        // Set the diff
        if (typeof diff === 'undefined') {
            if (options.compare && options.compare.diff) {
                diff = options.compare.diff;
            } else {
                diff = '';
            }
        }

        addVSCodeAnchor();

        // Add comment anchor
        addCommentAnchor();

        addStandaloneAnchor();

        // Render nightly anchor
        if (!isUnitTest()) {
            addNightlyAnchor();
        }

        // Render test anchor
        addTestAnchor();



        // Add the class name
        setClassName();

        controller.updateStatus(
            options.path,
            status
        );
    }

    /**
     * Set the diff and report back to the server.
     */
    function setDiff(newDiff) {
        if (controller.compareMode === 'nightly') {
            return;
        }
        if (newDiff.toString() !== diff) {

            diff = newDiff.toString();
            options.compare.diff = diff;
            save();
            renderList();
        } else {
            controller.updateStatus(
                options.path,
                status
            );
        }
    }

    function reset() {
        diff = undefined;
    }

    /**
     * Save the current compare diff and comment to file.
     */
    function save() {
        var config = {
            path: options.path,
            browser: controller.getBrowser().toLowerCase(),
            compare: options.compare
        };
        $.get('/samples/compare-update-report', config);
    }

    function setOptions(newOptions) {
        $.extend(true, options, newOptions);
        renderList();
        save();
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

        const mainNav = contentsDoc.querySelector('#main-nav');
        mainNav.scrollTo({
            top: li.offsetTop - Math.round(mainNav.offsetHeight * 0.4),
            behavior: controller.continueBatch ? 'instant' : 'smooth'
        })

    }

    return {
        index: index,
        isTolerated: isTolerated,
        isUnitTest: isUnitTest,
        options: options,
        path: options.path,
        renderList: renderList,
        reset: reset,
        save: save,
        setClassName: setClassName,
        setCurrent: setCurrent,
        setOptions: setOptions,
        setDiff: setDiff,

        getLi: function () { return li; }
    };
};
