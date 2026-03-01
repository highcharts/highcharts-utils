/**
 * This file is injected as string in the primary bundles
 */

/* global Highcharts */
// eslint-disable-next-line no-unused-vars
function codeWatch (compileOnDemand) {
    const wsProtocol = /https/.test(
            document.currentScript?.src ||
            location.protocol
        ) ?
            'wss' :
            'ws',
        socketUrl = `${wsProtocol}://${location.host}`,
        socket = new WebSocket(socketUrl);

    let isProcessing = false;

    function getWindow() {
        // Utils compare mode, reload the parent to run the
        // comparison again
        if (
            /(utils|localhost)/.test(
                window.location.hostname
            ) &&
            window.parent?.name === 'main' &&
            window.location.search.indexOf('testId') === -1
        ) {
            return window.parent;
        }

        return window;
    };

    function reloadTop() {
        socket.close();
        const win = /(utils|localhost)/.test(
            window.location.hostname
        ) ? (
            window.parent?.parent ||
            window.parent ||
            window
        ) : getWindow();

        win.location.reload();
    }

    socket.onopen = function() {
        console.log('WebSocket connection opened to ' + socketUrl);
    };
    socket.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);

            if (compileOnDemand) {
                console.log('@onmessage', data);
                if (data?.message === 'samples structure changed') {
                    reloadTop();
                } else if (
                    data?.message === 'ts changed' ||
                    data?.message === 'css changed' ||
                    data?.message === 'samples changed'
                ) {
                    socket.close();
                    getWindow().location.reload();
                }
            } else {

                console.log('@onmessage', data)
                if (data?.message === 'samples structure changed') {
                    reloadTop();
                } else if (data?.message === 'samples changed') {
                    socket.close();
                    getWindow().location.reload();

                } else if (data?.isRunning) {
                    // Started processing on the server
                    if (data.isRunning['scripts-js'] && !isProcessing) {
                        Highcharts.charts.forEach(
                            chart => chart.showLoading(
                                'Building Highcharts on server...<br>' +
                                'Page will reload when finished'
                            )
                        );
                        isProcessing = true;
                    }

                    // Ended processing on the server
                    if (!data.isRunning['scripts-js'] && isProcessing) {
                        socket.close();
                        window.location.reload();
                    }
                }
            }
        } catch (e) {};
    };

    socket.onclose = function(event) {
        if (event.wasClean) {
            console.log(
                'WebSocket connection closed cleanly',
                event.code,
                event.reason
            );
            console.clear();
        } else {
            console.log('WebSocket connection died, reloading in 5s');
            // If the utils server is restarting, reload later
            setTimeout(() => {
                getWindow().location.reload();
            }, 5000);
        }
    };

    socket.onerror = function(error) {
        console.log('WebSocket Error', error.message);
    };
}
