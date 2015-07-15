#!/bin/sh

TXT=`cat kalkati/date.txt | tr "\n" "\t"`
IFS="	" read -ra ARR <<< "$TXT"

UPDATE=${ARR[0]}

TXT=`./run-node.sh parse-date.js big/kalkati-hsl/flag-$UPDATE.txt | tr "\n" "\t"`
IFS="	" read -d"\t" -ra ARR <<< "$TXT"

START=${ARR[0]}
LEN=${ARR[1]}

# Note command line parameter.
#time ./compile2.sh make-01-prepare;
time ./run-node.sh make-01-prepare.js 3 $START $LEN

# Using compile instead of compile-debug below somehow makes it take twice as long and spend a lot of time in sys according to top.
# Possibly the issue is related to sqlite usage.
# NOTE: this script takes 5 minutes and only has to be run when the road map changes.
#time ./compile2.sh make-02-temp-map;
time ./run-node.sh make-02-temp-map.js
