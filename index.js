#!/usr/bin/env node
'use strict';

var program = require('./lib/program');

// These are our commands. We don't need to instantiate them as variables.
require('./lib/commands/init');
require('./lib/commands/preview');

// Respond to help as a command too.
program.command('help')
    .description('Display help.')
    .action(function() {
        program.help();
    });

// Parse the program arguments and run it ship captain!
program.parse(process.argv);

// Lastly, display our help text if a command wasn't specified. Note that this has
// to be after parse() so that the args array is populated.
if (!program.args.length) {
    program.help();
}

