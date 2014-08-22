#!/bin/bash
grunt jslint --force | grep FAIL | sort -k2 -n -r --field-separator=\(
