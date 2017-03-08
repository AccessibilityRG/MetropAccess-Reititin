#!/bin/sh

DB=../tiles.sqlite

./protoc-c fileformat.proto --c_out=.
./protoc-c osmformat.proto --c_out=.

gcc -O2 -o fileformat.pb-c.o -c fileformat.pb-c.c
gcc -O2 -o osmformat.pb-c.o -c osmformat.pb-c.c

gcc -O2 -o murmur.o -c murmur.c

gcc -O2 -Wall -W -o tree.o -c tree.c
gcc -O2 -Wall -W -o parse.o -c parse.c

gcc -o parse fileformat.pb-c.o osmformat.pb-c.o tree.o parse.o murmur.o -lprotobuf-c -lm -lz

#./parse > data.js
./parse > /dev/null

gcc -O2 -Wall -W -o tree.o -c tree.c
gcc -O2 -Wall -W -o quad.o -c quad.c

gcc -o quad tree.o quad.o

rm $DB
sqlite3 $DB < tiles.sql

#rm vectiles/*
./quad | sqlite3 $DB

echo "BEGIN TRANSACTION;" > tags.sql
cat tags.txt | sed -e "s/\"/\"\"/g" | sed -e "s/\([0-9]*\)	\(.*\)/INSERT INTO tagdata (tagid,data) VALUES (\\1,\"\\2\");/" >> tags.sql
echo "COMMIT;" >> tags.sql
cat tags.sql | sqlite3 $DB

gcc -O2 -o tags tags.c
./tags | sqlite3 $DB

cp splits.txt ../data/
rm *.bin

#rm tags.txt tags.sql

echo "Compression succesfully finished.."
