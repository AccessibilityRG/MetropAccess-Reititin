#!/bin/sh
BASE=${1%.*}
BASE=${BASE%-main}

python ../bin/closurebuilder.py -i $BASE-main.js $BASE-main.js --root=../src/reach --root=../src/gis --root=../shim | xargs cat ../shim/classes.js > $BASE.js
