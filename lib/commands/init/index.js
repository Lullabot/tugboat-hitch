'use strict';

var program = require('../../program');
var inquirer = require('inquirer');
var async = require('async');
var Git = require('nodegit');

var testingPages = [];

function testingOn(answers) {
    return typeof answers.testingOn === 'undefined' || answers.testingOn;
}

function askPages(useWhen) {
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

function askMore(useWhen) {
    this.type = "confirm";
    this.name = "morePages";
    this.message = "Do you have more pages to test?";
    this.default = false;
    this.when = testingOn;
}


var questions = [
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

var allAnswers;

function ask(questions) {
    inquirer.prompt( questions, function( answers ) {
        if ( !allAnswers ) {
            allAnswers = answers;
        }
        if (answers.testingPage) {
            testingPages.push(answers.testingPage);
        }
        if ( answers.morePages ) {
            var testingQuestions = [new askPages(), new askMore()];
            ask(testingQuestions);
        }
        else {
            console.log(testingPages);
            console.log(allAnswers);
        }
    });
}

program.command('init')
    .action(function () {
        Git.Repository.discover(process.cwd(), 0, '')
            .then(null, function(error) {
                console.error("Huh. Looks like %s isn't a git repository.", process.cwd());
                console.log('Please try again from within a git repository.');
                process.exit(23);
            })
            .then(function() {
                console.log(process.cwd());
                console.log("Welcome to Tugboat, Cap'n. Let's Hitch your project up." +
                    " Tell us a little more about it.");
                ask(questions);
            });
    });
