#!/bin/sh
find ../src -type f -iname \*.js | xargs wc test-main.js
