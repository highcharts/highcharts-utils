
window.onload = function () {
    
    // Settings
    var hash;
    var sample;
    var parent = document.getElementById('demo');

    // Vars
    var scripts = [];
    var progressBar;

    function xhr(path, callback) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
               // Typical action to be performed when the document is ready:
               callback(xhttp.responseText);
            }
        };
        xhttp.open(
            'GET',
            'https://cdn.jsdelivr.net/gh/highcharts/highcharts@' + hash +
            '/samples/' + sample + '/demo.html',
            true
        );
        xhttp.send();

    }

    function loadScript (i) {
        // Create a new script tag and append it to the head for
        // the JavaScript to load
        if (scripts[i]) {
            var script = document.createElement('script');
            script.onload = function () {

                progress(i + 1, scripts.length + 1);

                loadScript(i + 1);
            };
            script.setAttribute('src', scripts[i]);
            document.head.appendChild(script);
        }
    }

    function progress(n, total) {
        if (document.getElementById('container')) {
            if (!progressBar) {
                progressBar = document.createElement('div');
                progressBar.style.width = 0;
                progressBar.style.height = '3px';
                progressBar.style.backgroundColor = 'blue';
                progressBar.style.transition = 'width 250ms';
                document.getElementById('container').appendChild(progressBar);
            }
            progressBar.style.width = Math.round(100 * n / total) + '%';
        }
    }


    function loadHTML () {
        xhr(
            'https://cdn.jsdelivr.net/gh/highcharts/highcharts@' + hash +
            '/samples/' + sample + '/demo.html',
            function (s) {
                parent.innerHTML = s;
                [].forEach.call(
                    parent.getElementsByTagName('script'),
                    function (script) {
                        var src = script.getAttribute('src');
                        src = src.replace(
                            '/code.highcharts.com/',
                            '/github.highcharts.com/' + hash + '/');

                        scripts.push(src);
                    }
                );
                scripts.push(
                    'https://cdn.jsdelivr.net/gh/highcharts/highcharts@' +
                    hash + '/samples/' + sample + '/demo.js'
                );

                progress(1, scripts.length + 1);

                // Load CSS
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/gh/highcharts/highcharts@' + hash +
                    '/samples/' + sample + '/demo.css';
                document.head.appendChild(link);


                // Load scripts sequentially
                loadScript(0);
            }
        );
    }

    // Take a query string on the form key/value/also-value/key2/value2/etc and
    // split it
    function parseQS (qs) {
        var ret = {},
            keys = ['gh', 'sample'];

        qs = qs.split('/');

        keys.forEach(function (key) {
                
            for (
                var i = qs.indexOf(key) + 1;
                (i < qs.length && keys.indexOf(qs[i]) === -1); // stop if we're inspecing next key
                i++
            ) {
                if (!ret[key]) {
                    ret[key] = qs[i];
                } else {
                    ret[key] += '/' + qs[i];
                }
            }
        });
        return ret;
    }

    var qs = parseQS(window.location.hash.replace(/^#/, ''));

    hash = qs.gh;
    sample = qs.sample;

    loadHTML();
}