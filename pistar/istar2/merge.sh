#!/bin/bash
if [ ! -d "$1" ]; then
	echo Please first create models insider the $1 folder
	exit 0
fi
if [ -f $1.istar2 ]; then
	read -p "The command will write to the file $1.istar2, which already exists, Are you sure to overwrite it? " -n 1 -r
	echo
	if [[ $REPLY =~ ^[Nn]$ ]]; then
		exit 0
	fi
fi
echo > /tmp/merged.istar2
for f in $1/*.istar2; do
	cat $f | node pistar/istar2/merge.js /tmp/merged.istar2 | sed -e 's/goalModel = //' > /tmp/merged.json
	cat /tmp/merged.json | node pistar/istar2/json.js > /tmp/merged.istar2
done
mv /tmp/merged.istar2 $1.istar2
echo $1.istar2 has been merged from all .istar2 models inside the $1 folder.
if [ -f ../goalModel.js ]; then
	read -p "The command will overwrite the default model, which already exists, Are you sure to overwrite it? " -n 1 -r
	echo
	if [[ $REPLY =~ ^[Nn]$ ]]; then
		exit 0
	fi
fi
node pistar/istar2/istar2.js $1.istar2 > pistar/tool/goalModel.js
echo the default model has been updated.
