'use strict';

var nconf = require('nconf');
var store = require('./store');
var debug = require('./debug');

exports.nconf = nconf;

function Config() {
    this._nconf = nconf;
}

Config.prototype.set = function (key, value) {
    nconf.set(key, value);
    return this;
};
Config.prototype.get = function (key) {
    return nconf.get(key);
};
Config.prototype.save = function (callback) {
    nconf.save(callback);
    return this;
};
Config.prototype.file = function(file) {
    if (!file) {
        file = store.getDir() + '/tugboat.json';
    }
    debug('Loading config from %s', file);
    nconf.file(file);
    return this;
};

Config.prototype.load = function (callback) {
    var config = this;
    store.detectDir().then(function() {
        config.file();
        nconf.load(callback);
    });
    return this;
};

Config.prototype.init = function (tugboatDir) {
    store.setDir(tugboatDir);
    this.file();

    nconf.defaults({
        'projectName': 'Example Project',
        'prodUrl': 'http://www.example.com',
        'testingOn': true,
        'testingPages': []
    });

    return this;
};

module.exports = new Config();
