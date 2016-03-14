'use strict';

var Git = require('nodegit');
var debug = require('./debug');

function Store() {
    this._directory = null;
}

Store.prototype.detectDir = function () {
    var store = this;
    function parseDir(dir) {
        debug('Found git repo %s.', dir);
        var tugboatDir = require('path').dirname(dir) + '/tugboat';
        store.setDir(tugboatDir);
        return tugboatDir;
    }

    function notGitRepo(error) {
        debug(error);
        console.error("Huh. Looks like %s isn't a git repository.", process.cwd());
        console.error('Please try again from within a git repository.');
        process.exit(23);
    }

    return Git.Repository.discover(process.cwd(), 0, '')
        .then(parseDir, notGitRepo);
};

Store.prototype.setDir = function (directory) {
    this._directory = directory;
    debug('Set Store directory to %s.', directory);
};

Store.prototype.getDir = function () {
    return this._directory;
};

module.exports = new Store();
