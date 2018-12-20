
window.onload = function () {
    
    // Settings
    var params;
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
        xhttp.open('GET', path, true);
        xhttp.send();

    }

    function loadScript (i) {
        // Create a new script tag and append it to the head for
        // the JavaScript to load
        if (scripts[i]) {
            var script = document.createElement('script');
            script.onload = function () {

                progress(i + 2, scripts.length + 1);

                loadScript(i + 1);
            };
            script.setAttribute('src', scripts[i]);
            document.head.appendChild(script);
        }
    }

    function onLoadAll() {
        var jsFiddle = document.getElementById('jsfiddle');
        if (jsFiddle) {
            jsFiddle.href = 'https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/' +
                (params.gh || 'master') + '/samples/' + params.sample;
            jsFiddle.style.display = 'inline';
        }
        
    }

    function progress(n, total) {
        if (document.getElementById('main')) {
            if (!progressBar) {
                progressBar = document.createElement('div');
                progressBar.style.width = 0;
                progressBar.style.height = '5px';
                progressBar.style.backgroundColor = 'rgb(128, 133, 233)';
                progressBar.style.transition = 'width 250ms, background-color 500ms';
                document.getElementById('main').parentNode.insertBefore(
                    progressBar,
                    document.getElementById('main')
                );
            }
            progressBar.style.width = Math.round(100 * n / total) + '%';
            
            if (n === total) {
                progressBar.style.backgroundColor = 'transparent';
                onLoadAll();
            }
        }
    }

    function handleDetails(details) {
        if (details.name) {
            document.title = details.name;
        }
    }

    function loadHTML () {
        xhr(
            'https://cdn.jsdelivr.net/gh/highcharts/highcharts@' + (params.gh || 'master') +
            '/samples/' + params.sample + '/demo.html',
            function (s) {
                parent.innerHTML = s;

                [].forEach.call(
                    parent.getElementsByTagName('script'),
                    function (script) {
                        var src = script.getAttribute('src');

                        if (params.gh) {
                            src = src.replace(
                                '/code.highcharts.com/',
                                '/github.highcharts.com/' + params.gh + '/');
                        }

                        scripts.push(src);
                    }
                );

                scripts.push(
                    'https://cdn.jsdelivr.net/gh/highcharts/highcharts@' +
                    (params.gh || 'master') + '/samples/' + params.sample + '/demo.js'
                );

                progress(1, scripts.length + 1);

                // Load CSS
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/gh/highcharts/highcharts@' + (params.gh || 'master') +
                    '/samples/' + params.sample + '/demo.css';
                document.head.appendChild(link);

                // Load details
                xhr('https://cdn.jsdelivr.net/gh/highcharts/highcharts@' +
                    (params.gh || 'master') + '/samples/' + params.sample +
                    '/demo.details',
                    function (yaml) {
                        handleDetails(parseYAML(yaml));
                    }
                );


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

    function parseYAML (yaml) {
        return yaml.split('\n').reduce(function (acc, line) {
            line = line.split(':');
            if (line.length === 2) {
                acc[line[0].trim()] = line[1].trim();
            }
            return acc;
        }, {});
    }

    params = parseQS(window.location.hash.replace(/^#/, ''));

    loadHTML();
}