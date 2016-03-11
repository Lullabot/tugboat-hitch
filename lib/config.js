'use strict';

var nconf = require('nconf');

nconf.init = function (tugboatDir) {
    this.file(tugboatDir + '/tugboat.json');
    return this;
};

module.exports = nconf;
