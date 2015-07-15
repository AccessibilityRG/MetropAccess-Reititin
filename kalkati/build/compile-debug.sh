#!/bin/sh
python closurebuilder.py -i $1-main.js $1-main.js --root=../src/reach | xargs -J % cat ../src/require.js ../src/classes.js % > $1.js
