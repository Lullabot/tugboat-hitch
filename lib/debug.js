'use strict';

var program = require('./program');

module.exports = function debug() {
    if (program.debug) {
        console.log.apply(console, arguments);
    }
};
