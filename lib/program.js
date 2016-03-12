'use strict';

var program = require('commander');

program.version('0.1.0')
    .option('-d, --debug', 'Show debugging information.');

module.exports = program;
