#!/usr/bin/env bash

# This is called during "tugboat init", after all of the service containers have
# been built, and the git repo has been cloned. This can be used for things like
# installing additional libraries that don't come built-in to the tugboat
# containers.

# Turn on error detection and xtracing. Helpful for debugging.
set -ex
