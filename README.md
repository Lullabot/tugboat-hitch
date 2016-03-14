# Integrate your project with [Tugboat](https://tugboat.qa)

Hitch is a command line tool for integrating your project with [Tugboat]
(https://tugboat.qa). It installs a scaffolding in your git repository
for use with Tugboat. This includes a Makefile, and a tugboat directory
with some starter shell scripts executed by the Makefile.

## Installation

Globally install this project on your computer.

```
$ npm install -g tugboat-hitch
```

You should now have a `hitch` command you can run:

```
$ hitch --version
Tugboat Hitch v0.1.0
```

## Usage

To hitch up your project to Tugboat, make sure you are inside of the
git repository directory of the project, and then run:

```
$ hitch init
```

This command will ask you some simple questions to get you started. Once
complete, you will need to commit the configuration back to your
repository, and push up to your origin.

```
$ git add Makefile tugboat
$ git commit -m "[tugboat] Adding initial Tugboat configuration and \
scripts using hitch."
$ git push
```
