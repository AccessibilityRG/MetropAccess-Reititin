#!/bin/sh

# Parse HSL Kalkati data into SQLite database.

#./compile-debug.sh parse-date

TXT=`cat kalkati/date.txt | tr "\n" "\t"`
IFS="	" read -ra ARR <<< "$TXT"

UPDATE=${ARR[0]}

TXT=`./run-node.sh parse-date.js big/kalkati-hsl/flag-$UPDATE.txt | tr "\n" "\t"`
IFS="	" read -d"\t" -ra ARR <<< "$TXT"
echo $TXT
echo ./run-node.sh parse-date.js big/kalkati-hsl/flag-$UPDATE.txt

START=${ARR[0]}
LEN=${ARR[1]}

#cd kalkati/parse
#qmake
#make
#cd ../..

rm kalkati/hsl.sqlite
sqlite3 kalkati/hsl.sqlite < kalkati/hsl.sql
unzip -p big/kalkati-hsl/all-$UPDATE.zip LVM.xml | kalkati/parse/parse $START - $LEN kalkati/hsl.sqlite
