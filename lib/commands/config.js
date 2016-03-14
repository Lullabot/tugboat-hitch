'use strict';

var config = require('../config');
var program = require('../program');

program.command('config [action] [key] [value]')
    .description('Get or set configuration.')
    .usage('[get|set] [key] [value]')
    .option('--keys', 'See the available keys to get or set.')
    .action(action);

function action(action, key, value) {
    if (this.keys) {
        config._allowedKeys.forEach(function (key) {
            console.log(key);
        });
        process.exit();
    }
    validateAction.apply(this, arguments);
    config.load(function (error, values) {
        if (error) {
            exitError(error);
        }
        try {
            if (action === 'get') {
                get.call(this, key, values);
            }
            else if (action === 'set') {
                set.call(this, key, value);
            }
        }
        catch (e) {
            exitError(e);
        }
    });
}

function validateAction(action, key, value) {
    if (typeof action === 'undefined') {
        exitError('You must specify an action of set or get.');
    }
    if (action !== 'set' && action !== 'get') {
        exitError('Action %s is invalid. Please use set or get.', action);
    }
    if (action === 'set') {
        if (typeof value === 'undefined') {
            exitError('You must specify a value to set.');
        }
        if (key === 'testingPages') {
            exitError('Setting testingPages is not currently supported. You' +
                ' may want to edit the tugboat.json by hand.');
        }
    }
    if (key && config._allowedKeys.indexOf(key) === -1) {
        exitError('%s is not a valid key. Use --keys to see a list of keys.', key);
    }
}

function get(key, values) {
    if (key) {
        var value = config.get(key);
        if (typeof value === 'undefined' || value === null) {
            console.log('null');
        }
        else if (typeof value.length !== 'undefined') {
            value.forEach(function (v) {
                console.log(v);
            });
        }
        else {
            console.log(value);
        }
    }
    else {
        console.log(values);
    }
}

function set(key, value) {
    var asString = value;
    if (value === 'false') {
        value = false;
    }
    if (value === 'true') {
        value = true;
    }
    config.set(key, value);
    config.save(function (error) {
        if (error) {
            exitError(error);
        }
        console.log('Set %s to %s.', key, asString);
    });
}

function exitError() {
    console.error.apply(console, arguments);
    process.exit(23);
}
