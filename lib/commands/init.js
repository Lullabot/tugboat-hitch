'use strict';

var f = require('util').format;
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

function askPages() {
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
}

function askMore() {
    this.type = "confirm";
    this.name = "morePages";
    this.message = "Do you have more pages to test?";
    this.default = false;
    this.when = testingOn;
}

var mainQuestions = [
    {
        type: "input",
        name: "projectName",
        message: "What's the name of your project?",
        default: "Example Project"
    },
    {
        type: "input",
        name: "prodUrl",
        message: "What's the production URL of the project?",
        default: function () { return "http://example.com"; }
    },
    {
        type: "confirm",
        name: "testingOn",
        message: "Would you like to have Tugboat test a few different pages" +
        " for things like load time, page weight, JavaScript errors, etc.?"
    },
    new askPages(),
    new askMore()
];

var init = {
    'repoRoot': function (repoDir, callback) {
        var path = require('path');
        callback(null, path.dirname(repoDir));
    },
    'overwriteConfirm': function(file, callback) {
        var question = [{
            type: 'confirm',
            name: 'overwrite',
            message: 'Would you like to overwrite it?',
            default: false
        }];
        inquirer.prompt(question, function(answers) {
            callback(null, answers.overwrite);
        });
    },
    'checkTugboatDir': function (repoDir, callback) {
        var tugboatDir = repoDir + '/tugboat';
        try {
            fs.statSync(tugboatDir);
            console.warn(f('%s already exists.', tugboatDir));
            init.overwriteConfirm(tugboatDir, function(error, overwrite) {
                if (overwrite) {
                    var exec = require('child_process').exec;
                    exec( 'rm -r ' + tugboatDir, function () {
                        init.createTugboatDir(repoDir, tugboatDir, callback);
                    });
                }
                else {
                    config.init(tugboatDir);
                    callback(error, repoDir);
                }
            });
        }
        catch (e) {
            init.createTugboatDir(repoDir, tugboatDir, callback);
        }
    },
    'createTugboatDir': function(repoDir, tugboatDir, callback) {
        fs.mkdir(tugboatDir, function() {
            debug('Created %s.', tugboatDir);
            config.init(tugboatDir);
            config.save(function (err) {
                debug('Saved tugboat.json.');
                callback(err, repoDir);
            });
        });
    },
    'checkMakefile': function (repoDir, callback) {
        var makefilePath = repoDir + '/Makefile';
        // Check if the Makefile already exists. If no exception is thrown, that
        // means the file exists, and we need to confirm the user wants to
        // overwrite it.
        try {
            fs.statSync(makefilePath);
            console.warn(f('%s already exists.', makefilePath));
            init.overwriteConfirm(makefilePath, function(error, overwrite) {
                if (overwrite) {
                    init.createMakefile(repoDir, makefilePath, callback);
                }
                else {
                    callback(error, repoDir);
                }
            });
        }
        catch (e) {
            init.createMakefile(repoDir, makefilePath, callback);
        }
    },
    'createMakefile': function (repoDir, makefilePath, callback) {
        debug(repoDir);
        debug(makefilePath);
        callback(null, repoDir);
    },
    'begin': function(values, callback) {
        console.log("Welcome to Tugboat, Cap'n. Let's Hitch your project up." +
            " Tell us a little more about it.");
        callback();
    },
    'ask': function (values, callback) {
        var allAnswers;
        var testingPages = [];

        ask(mainQuestions);

        function ask(questions) {

            inquirer.prompt(questions, function (answers) {
                if (!allAnswers) {
                    allAnswers = answers;
                }
                if (answers.testingPage) {
                    testingPages.push(answers.testingPage);
                }
                if (answers.morePages) {
                    var testingQuestions = [new askPages(), new askMore()];
                    ask(testingQuestions, callback);
                }
                else {
                    delete allAnswers.testingPage;
                    allAnswers.testingPages = testingPages;
                    debug(testingPages);
                    debug(allAnswers);
                    debug(callback);
                    callback(null, allAnswers);
                }
            });
        }
    },
    'save': function (values, callback) {
        debug('Preparing to save');
        _.forIn(values, function (value, key) {
            config.set(key, value);
        });
        debug('Saved values');
        config.save(function (error) {
            callback(error, values);
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
    }
};

promisify(errors);

program.command('init')
    .action(function () {
        Git.Repository.discover(process.cwd(), 0, '')
            .then(null, errors.notGitRepo)
            .then(init.repoRoot)
            .then(init.checkTugboatDir)
            .then(init.begin)
            .then(init.ask)
            .then(init.save)
            .then(init.checkMakefile);
    });
