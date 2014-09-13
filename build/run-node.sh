#!/bin/sh
#PATH=$PATH:/Users/jjrv/local/bin
#NODE_PATH=/Users/jjrv/local/lib/node_modules node --gc_global --expose_gc --max-old-space-size=8192 --print_cumulative_gc_stat $@
NODE_PATH=/Users/jjrv/local/lib/node_modules /Users/jjrv/local/bin/node --expose_gc --max-old-space-size=8192 $@
