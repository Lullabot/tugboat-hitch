'use strict';

var config = require('../config');
var debug = require('../debug');
var program = require('../program');

program.command('preview')
    .action(function (command) {
       config.load(function (err, values) {
           console.log(values);
       });
    });
