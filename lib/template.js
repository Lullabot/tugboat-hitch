var hogan = require('hogan.js');
var fs = require('fs');
var config = require('./config');
var debug = require('./debug');

// Allow loading of .tpl files as utf-8 text with require.
require.extensions['.tpl'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

exports.render = function render(templateFile, destination, callback) {
    config.load(function (error, values) {
        if (error) {
            debug(error);
            callback(error);
        }
        else {
            try {
                var filename = './templates/' + templateFile + '.tpl';
                var raw = require(filename);
                var template = hogan.compile(raw);
                var rendered = template.render(values);
                var fd = fs.openSync(destination, 'w');
                fs.write(fd, rendered, callback);
            }
            catch (e) {
                callback(e);
            }
        }
    });
};


