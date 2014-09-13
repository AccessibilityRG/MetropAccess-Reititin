#!/bin/sh
node --max-old-space-size=8192 /opt/reititin/build/task.js --base-path=/opt/reititin $@
