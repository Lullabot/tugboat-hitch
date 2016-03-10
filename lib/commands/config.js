var nconf = require('nconf');

nconf.file('/etc/tugboat.json')
    .defaults({
        'project': 'No Name',
    });

module.exports = nconf;
