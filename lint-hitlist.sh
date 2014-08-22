#!/bin/bash
TIME_NOW=$(date "+%c")
echo "# ......-=(The JSLint Hit List)=-......."
echo "## Defending The Faith of Crockford since 2014"
echo "#### The worst offenders as of $TIME_NOW"
echo "Total number of JSLint violations in (parenthesis)"
echo " "
grunt jslint --no-color --force | sed 's/^/\* /' | grep FAIL | sort -k2 -n -r --field-separator=\(
