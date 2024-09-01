#!/bin/bash
inotifywait -m -e modify */goalModel/* --format "%w" | while read file; do
	folder=$(dirname $file)
	dir=$(dirname $folder)
	cd $dir > /dev/null 
	./update.sh
	cd - > /dev/null
done
