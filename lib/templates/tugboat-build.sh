#!/usr/bin/env bash

# When a new Tugboat Preview is being built, this command will be called
# immediately following the git merge. This script can execute any deployment
# scripts that might be required on your project.

# Turn on error detection and xtracing. Helpful for debugging.
set -ex

# Add your build steps here:

# Once your build steps are complete, cURLing localhost will warm any caches on
# the site.
curl -s http://localhost/ > /dev/null
