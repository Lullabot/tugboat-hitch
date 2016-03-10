var hogan = require('hogan');

var config = require('./config');


exports.render = function render(templateFile) {
    var template = hogan.compile(templateFile);
    return template.render(config.get);
};


