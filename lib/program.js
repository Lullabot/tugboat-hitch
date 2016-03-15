'use strict';

var program = require('commander');
var version = require('../package.json').version;

program.version('Tugboat Hitch v' + version)
    .option('-d, --debug', 'Show debugging information.');

module.exports = program;
