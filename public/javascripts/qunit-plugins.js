/* global QUnit */
document.addEventListener('DOMContentLoaded', function () {
    if (typeof QUnit === 'undefined') {
        return;
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

        this.push(result, number, expected, message);
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

        this.pushResult({
            result: result,
            actual: number,
            expected: expected,
            message: message
        });
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

        this.pushResult({
            result: result,
            actual: number,
            expected: expected,
            message: message
        });
    };
});
