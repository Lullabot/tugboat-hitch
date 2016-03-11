#
# Makefile for Project {{project}}
#
# Includes commands for Tugboat. Feel free to expand with custom project
# commands.
#

# This is called during "tugboat init", after all of the service containers have
# been built, and the git repo has been cloned. This can be used for things like
# installing additional libraries that don't come built-in to the tugboat
# containers.
tugboat-init:
	util/tugboat-init.sh

# When a Tugboat Preview is being built or rebuilt, this command will be called
# immediately following the git merge. This script can execute any deployment
# scripts that might be required on your project.
tugboat-build:
	util/tugboat-build.sh

# This command is used to update the Base Preview that all Previews are built
# from. This can be used to synchronize any data or other assets from a
# production or staging source, so that your Previews roughly match prod.
tugboat-update:
	util/tugboat-update.sh

# This is called by Tugboat to run a project's test suite. It is used during
# "tugboat test", if the "testall" config option is set to true, and if --test
# is specified during "tugboat build".
tugboat-test:
	util/tugboat-test.sh
