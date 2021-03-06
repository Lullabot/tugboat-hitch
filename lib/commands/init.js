'use strict';

var fs = require('fs');
var inquirer = require('inquirer');
var chalk = require('chalk');
var figures = require('figures');
var promisify = require('promisify-node');
var _ = require('lodash');
var Rsync = require('rsync');
var path = require('path');

var config = require('../config');
var debug = require('../debug');
var program = require('../program');
var template = require('../template');
var store = require('../store');

var hr = chalk.dim(new Array(15).join(figures.line));

program.command('init')
    .description('Initialize your project with Tugboat.')
    .action(action);

function testingOn(answers) {
    return typeof answers.testingOn === 'undefined' || answers.testingOn;
}

function AskPages(i) {
    this.type = "input";
    this.name = "testingPage";
    this.message = "Enter a path you'd like Tugboat to test:";
    this.filter = function (input) {
        // Strip off scheme and domain info.
        var regex = /^https?:\/\/[^\/]+(\/.*)/;
        var match = input.match(regex);
        if (match && match.length > 0) {
            input = match[1];
        }
        // If this path has a domain at the beginning without the scheme, strip
        // that off too.
        regex = /^[^\/]+[\.]+[^\/]+(\/.*)/;
        match = input.match(regex);
        if (match && match.length > 0) {
            input = match[1];
        }
        // Normalize path to have a leading slash.
        if (input.match(/^[^\/]/)) {
            input = '/' + input;
        }
        return input;
    };
    this.when = testingOn;
    this.default = function() {
        var pages = config.get('testingPages');
        return pages[i] || null;
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

var prefs = {};

var init = {
    'repoRoot': function (tugboatDir) {
        prefs.repoDir =  path.dirname(tugboatDir);
        prefs.tugboatDir = tugboatDir;
        return prefs;
    },
    'overwriteConfirm': function(file, message, callback) {
        console.warn(chalk.red('%s already exists.'), path.relative(process.cwd(), file));
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
        // Check if the Tugboat directory already exists. If no exception is
        // thrown, that means the directory does exist, and we need to verify
        // that the user would like to delete it. If an exception *is* thrown,
        // that means the directory does not exist, and we should continue.
        try {
            fs.statSync(prefs.tugboatDir);
            var message = "Would you like to delete it and start fresh?";
            init.overwriteConfirm(prefs.tugboatDir, message, function(error, overwrite) {
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
            prefs.createTugboatDir = true;
            callback(null, prefs);
        }
    },
    'createTugboatDir': function(prefs, callback) {
        if (prefs.createTugboatDir) {
            var sourcePath = path.resolve(__dirname + '/../templates/tugboat');
            var rsync = new Rsync();
            rsync.source(sourcePath + '/')
                 .destination(prefs.tugboatDir)
                 .flags('a')
                 // Don't copy owner and group.
                 .set('no-g')
                 .set('no-o');
            rsync.execute(function (error, code, cmd) {
                if (error) {
                    callback(error, prefs);
                }
                else {
                    debug('Executed %s', cmd);
                    config.init(prefs.tugboatDir);
                    config.save(function (error) {
                        debug('Saved tugboat.json.');
                        callback(error, prefs);
                    });
                }
            });
        }
        else {
            debug('Preserved existing Tugboat directory.');
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
        debug(prefs.makefilePath);
        // Check if the Makefile already exists. If no exception is thrown, that
        // means the file exists, and we need to confirm the user wants to
        // overwrite it.
        try {
            fs.statSync(prefs.makefilePath);
            init.overwriteConfirm(prefs.makefilePath, function(error, overwrite) {
                prefs.createMakefile = overwrite;
                callback(error, prefs);
            });
        }
        catch (e) {
            debug(e);
            prefs.createMakefile = true;
            callback(null, prefs);
        }
    },
    'begin': function(prefs) {
        console.log(chalk.blue("Welcome to %s, Cap'n!"), chalk.underline('Tugboat'));
        console.log(chalk.bold("Let's Hitch your project up."));
        console.log("Tell us a little more about it:");
        return prefs;
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
        // Store the version this config was made with.
        config.set('version', require('../../package.json').version);
        // Iterate over each answer and set.
        _.forIn(prefs.answers, function (value, key) {
            config.set(key, value);
        });
        debug('Saved values');
        config.save(function (error) {
            callback(error, prefs);
        });
    },
    'createMakefile': function (prefs, callback) {
        if (prefs.createMakefile) {
            debug('Creating %s', prefs.makefilePath);
            template.render('Makefile', prefs.makefilePath, function(error) {
                callback(error, prefs);
            });
        }
        else {
            debug('Preserved existing Makefile');
            callback(null, prefs);
        }
    },
    'finalize': function (prefs) {
        console.log(chalk.blue("Lookin' good! You're all set."));
        var relativeRepoDir = path.relative(process.cwd(), prefs.repoDir) || '.';
        console.log(chalk.yellow("Go check out the scripts in %s."), relativeRepoDir + '/tugboat/bin');
        console.log("You'll want to modify those to work with your project.");
        console.log("Once done, execute the following commands to add your" +
            " work to your repository:");
        console.log(hr);
        console.log("git add %s %s", relativeRepoDir + '/Makefile', relativeRepoDir + '/tugboat');
        console.log("git commit -m '[tugboat] Adding initial Tugboat scripts" +
            " and configuration.'")
    }
};

promisify(init);

function action() {
    store.detectDir()
        .then(init.repoRoot, errors.generic)
        .then(init.checkTugboatDir, errors.generic)
        .then(init.createTugboatDir, errors.generic)
        .then(init.checkMakefile, errors.generic)
        .then(init.begin, errors.generic)
        .then(init.ask, errors.generic)
        .then(init.save, errors.generic)
        .then(init.createMakefile, errors.generic)
        .then(init.finalize, errors.generic)
        .catch(errors.generic);
}
