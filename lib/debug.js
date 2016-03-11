'use strict';

var program = require('./program');

module.exports = function debug() {
    // TODO: Check if debug flag was specified.
    console.log.apply(console, arguments);
};
