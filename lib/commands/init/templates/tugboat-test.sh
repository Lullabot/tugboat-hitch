#!/usr/bin/env bash

# This is called by Tugboat to run a project's test suite. It is used during
# "tugboat test", if the "testall" config option is set to true, and if --test
# is specified during "tugboat build". Tugboat currently doesn't do any
# automated publishing of test results. You will need to publish them yourself
# in this script.
