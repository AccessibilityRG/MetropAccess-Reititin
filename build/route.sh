#!/bin/sh
node --max-old-space-size=8192 task.js --base-path=.. $@
