/* global QUnit */
document.addEventListener('DOMContentLoaded', function () {
    if (typeof QUnit === 'undefined') {
        return;
    }
    function report(assert, result, actual, expected, message) {
        if (typeof assert.pushResult === 'function') {
            assert.pushResult({ result, actual, expected, message });
        } else {
            assert.push(result, actual, expected, message);
        }
    }

    /**
     * Compare numbers taking in account an error.
     * http://bumbu.me/comparing-numbers-approximately-in-qunitjs/
     *
     * @param  {Float} number
     * @param  {Float} expected
     * @param  {Float} error    Optional
     * @param  {String} message  Optional
     */
    QUnit.assert.close = function (number, expected, error, message) {
        if (error === void 0 || error === null) {
            error = 0.00001; // default error
        }

        var result = number === expected || (number <= expected + error && number >= expected - error) || false;

        report(this, result, number, expected, message);
    };

    /*
    * Less than comparison
    *
    * @param  {Float} number
    * @param  {Float} expected
    * @param  {String} message  Optional
    */
    QUnit.assert.lessThan = function (number, expected, message) {
        var result = (
            typeof number === 'number' &&
            typeof expected === 'number' &&
            number < expected
        ) || false;

        report(this, result, number, expected, message);
    };

    /*
        * Greater than comparison
        *
        * @param  {Float} number
        * @param  {Float} expected
        * @param  {String} message  Optional
        */
    QUnit.assert.greaterThan = function (number, expected, message) {
        var result = (
            typeof number === 'number' &&
            typeof expected === 'number' &&
            number > expected
        ) || false;

        report(this, result, number, expected, message);
    };
});
