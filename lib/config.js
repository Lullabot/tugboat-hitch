'use strict';

var nconf = require('nconf');
var store = require('./store');
var debug = require('./debug');

exports.nconf = nconf;

function Config() {
    this._nconf = nconf;
}

Config.prototype.set = function (key, value) {
    return nconf.set(key, value);
};
Config.prototype.get = function (key) {
    return nconf.get(key);
};
Config.prototype.save = function (callback) {
    return nconf.save(callback);
};
Config.prototype.file = function(file) {
    if (!file) {
        file = store.getDir() + '/tugboat.json';
    }
    return nconf.file(file);
};

Config.prototype.load = function (callback) {
    var config = this;
    store.detectDir().then(function() {
        config.file();
        nconf.load(callback);
    });
};

Config.prototype.init = function (tugboatDir) {
    store.setDir(tugboatDir);
    this.file();
};

module.exports = new Config();
