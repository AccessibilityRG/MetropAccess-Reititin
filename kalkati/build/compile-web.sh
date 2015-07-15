#!/bin/sh
python closurebuilder.py -i $1-main.js $1-main.js --root=../src/reach |
sed -e "s/^/--js /" |
xargs -J % java -jar ../bin/custom-compiler.jar \
--jscomp_warning checkTypes \
--jscomp_warning undefinedVars \
--jscomp_warning uselessCode \
--summary_detail_level 3 \
--compilation_level ADVANCED_OPTIMIZATIONS \
% \
--closure_entry_point main \
--js_output_file small.o.js \
--externs ../src/extern.js \
--manage_closure_dependencies true \
2>report.txt
#--formatting PRETTY_PRINT \
#--variable_map_output_file varmap.txt \
#--property_map_output_file propmap.txt \
#--variable_map_input_file vars.txt \
#--property_map_input_file props.txt \

cat report.txt

# Remove constructors called RENAME_ARRAYx, change calls like "new RENAME_ARRAYx(a,b)" to "[a,b]" and accesses like "a.RENAME_ACCESSx0" to "a[0]".
#cat small.o.js | perl -p0e "s/function\s+RENAME_ARRAY[a-z]*\s*\([^)]*\)\s*\{[^}]*\}//g,s/new RENAME_ARRAY[a-z]*(\(((?>[^()]+|(?1))*)\))/[\\2]/g,s/\.RENAME_ACCESS[a-z]*([0-9]+)/[\\1]/g" > small.js
#cp small.o.js small.js
cat small.o.js > $1.js
