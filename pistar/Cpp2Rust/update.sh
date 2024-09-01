#!/bin/bash
if [ ! -d goalModel ]; then
	echo Please first create models insider the goalModel folder
	exit 0
fi
echo > /tmp/merged.istar2
for f in goalModel/*.istar2; do
	cat $f | node merge.js /tmp/merged.istar2 | sed -e 's/goalModel = //' > /tmp/merged.json
	cat /tmp/merged.json | node json.js > /tmp/merged.istar2
done
mv /tmp/merged.istar2 goalModel.istar2
echo goalModel.istar2 has been merged from all .istar2 models inside the goalModel folder.
cat goalModel.istar2 | node istar2.js > goalModel.js
echo the default model has been updated.
killall node
./start.sh 3001 &
