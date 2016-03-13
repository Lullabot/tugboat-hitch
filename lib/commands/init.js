'use strict';

var fs = require('fs');
var Git = require('nodegit');
var inquirer = require('inquirer');
var promisify = require('promisify-node');
var _ = require('lodash');

var config = require('../config');
var debug = require('../debug');
var program = require('../program');

function testingOn(answers) {
    return typeof answers.testingOn === 'undefined' || answers.testingOn;
}

function AskPages(i) {
    this.type = "input";
    this.name = "testingPage";
    this.message = "Enter a URL you'd like Tugboat to test:";
    this.filter = function (input) {
        var regex = /^https?:\/\/[^\/]+(\/.*)/;
        var match = input.match(regex);
        if (match && match.length > 0) {
            input = match[1];
        }
        return input;
    };
    this.when = testingOn;
    this.default = function() {
        var pages = config.get('testingPages');
        return pages[i] || '';
    };
}

function AskMore(i) {
    this.type = "confirm";
    this.name = "morePages";
    this.message = "Do you have more pages to test?";
    this.default = function() {
        var pages = config.get('testingPages');
        return i + 1 < pages.length;
    };
    this.when = testingOn;
}

var defaultValue = function (key) {
    return function () {
        return config.get(key);
    }
};

var mainQuestions = [
    {
        type: "input",
        name: "projectName",
        message: "What's the name of your project?",
        default: defaultValue('projectName')
    },
    {
        type: "input",
        name: "prodUrl",
        message: "What's the production URL of the project?",
        default: defaultValue('prodUrl')
    },
    {
        type: "confirm",
        name: "testingOn",
        message: "Would you like to have Tugboat test a few different pages" +
        " for things like load time, page weight, JavaScript errors, etc.?",
        default: defaultValue('testingOn')
    },
    new AskPages(0),
    new AskMore(0)
];

var prefs = {};

var init = {
    'repoRoot': function (repoDir, callback) {
        var path = require('path');
        prefs.repoDir = path.dirname(repoDir);
        prefs.tugboatDir = prefs.repoDir + '/tugboat';
        callback(null, prefs);
    },
    'overwriteConfirm': function(file, message, callback) {
        if (typeof message === 'function') {
            callback = message;
            message = 'Would you like to overwrite it?';
        }
        var question = [{
            'type': 'confirm',
            'name': 'overwrite',
            'message': message,
            'default': false
        }];
        inquirer.prompt(question, function(answers) {
            callback(null, answers.overwrite);
        });
    },
    'checkTugboatDir': function (prefs, callback) {
        try {
            fs.statSync(prefs.tugboatDir);
            console.warn('%s already exists.', prefs.tugboatDir);
            init.overwriteConfirm(prefs.tugboatDir, function(error, overwrite) {
                prefs.createTugboatDir = overwrite;
                if (overwrite) {
                    var exec = require('child_process').exec;
                    exec( 'rm -r ' + prefs.tugboatDir, function () {
                        callback(error, prefs);
                    });
                }
                else {
                    callback(error, prefs);
                }
            });
        }
        catch (e) {
            callback(null, prefs);
        }
    },
    'createTugboatDir': function(prefs, callback) {
        if (prefs.createTugboatDir) {
            config.init(prefs.tugboatDir);
            fs.mkdir(prefs.tugboatDir, function() {
                debug('Created %s.', prefs.tugboatDir);
                config.save(function (error) {
                    debug('Saved tugboat.json.');
                    callback(error, prefs);
                });
            });
        }
        else {
            debug('Preserved existing tugboat.json');
            config.init(prefs.tugboatDir);
            config.load(function(error, settings) {
                debug(settings);
                debug('Loaded existing config from tugboat.json');
                callback(error, prefs);
            });
        }
    },
    'checkMakefile': function (prefs, callback) {
        prefs.makefilePath = prefs.repoDir + '/Makefile';
        // Check if the Makefile already exists. If no exception is thrown, that
        // means the file exists, and we need to confirm the user wants to
        // overwrite it.
        try {
            fs.statSync(prefs.makefilePath);
            console.warn('%s already exists.', makefilePath);
            init.overwriteConfirm(prefs.makefilePath, function(error, overwrite) {
                prefs.createMakefile = overwrite;
                callback(error, prefs);
            });
        }
        catch (e) {
            prefs.createMakefile = true;
            callback(null, prefs);
        }
    },
    'createMakefile': function (prefs, callback) {
        if (prefs.createMakefile) {
            debug('Creating %s', prefs.makefilePath);
            callback(null, prefs);
        }
        else {
            debug('Preserved existing Makefile');
            callback(null, prefs);
        }
    },
    'begin': function(prefs, callback) {
        console.log("Welcome to Tugboat, Cap'n. Let's Hitch your project up." +
            " Tell us a little more about it.");
        callback(null, prefs);
    },
    'ask': function (prefs, callback) {
        var testingPages = [];
        var i = 0;

        ask(mainQuestions);

        function ask(questions) {

            inquirer.prompt(questions, function (answers) {
                if (typeof prefs.answers === 'undefined') {
                    prefs.answers = answers;
                }
                if (answers.testingPage) {
                    testingPages.push(answers.testingPage);
                }
                if (answers.morePages) {
                    i++;
                    var testingQuestions = [new AskPages(i), new AskMore(i)];
                    ask(testingQuestions, callback);
                }
                else {
                    delete prefs.answers.testingPage;
                    delete prefs.answers.morePages;
                    prefs.answers.testingPages = testingPages;
                    debug(testingPages);
                    debug(prefs.answers);
                    callback(null, prefs);
                }
            });
        }
    },
    'save': function (prefs, callback) {
        debug('Preparing to save');
        _.forIn(prefs.answers, function (value, key) {
            config.set(key, value);
        });
        debug('Saved values');
        config.save(function (error) {
            callback(error, prefs);
        });
    }
};

promisify(init);

var errors = {
    'notGitRepo': function(error) {
        debug(error);
        console.error("Huh. Looks like %s isn't a git repository.", process.cwd());
        console.error('Please try again from within a git repository.');
        process.exit(23);
    },
    'generic': function (error) {
        debug(error);
        console.error('An unexpected error was detected.');
        process.exit(23);
    }
};

promisify(errors);

program.command('init')
    .option('-f, --force', 'Force initialize, overwriting any extant hitch' +
    ' config.')
    .action(function () {
        Git.Repository.discover(process.cwd(), 0, '')
            .then(null, errors.notGitRepo)
            .then(init.repoRoot)
            .then(init.checkMakefile)
            .then(init.checkTugboatDir)
            .then(init.createTugboatDir)
            .then(init.begin)
            .then(init.ask)
            .then(init.save)
            .then(init.createMakefile)
            .catch(errors.generic);
    });
