#!/bin/sh
BASE=${1%.*}
BASE=${BASE%-main}

python ../bin/closurebuilder.py -i $BASE-main.js $BASE-main.js --root=../src/reach --root=../goog |
sed -e "s/^/--js /" |
xargs java -jar ../bin/custom-compiler.jar \
--jscomp_warning checkTypes \
--jscomp_warning undefinedVars \
--jscomp_warning uselessCode \
--summary_detail_level 3 \
--compilation_level ADVANCED_OPTIMIZATIONS \
--closure_entry_point main \
--js_output_file $BASE.js \
--externs ../src/extern.js \
--manage_closure_dependencies true \
#--formatting PRETTY_PRINT --debug \
2>report.txt
#--variable_map_output_file varmap.txt \
#--property_map_output_file propmap.txt \
#--variable_map_input_file vars.txt \
#--property_map_input_file props.txt \

cat report.txt
