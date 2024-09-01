#!/bin/bash
if [ ! -f $1 ]; then
	echo The model $1 does not exist!
	exit 0
fi
folder=${1/.istar2}
if [ -d $folder ]; then
	read -p "The command will write to the folder $folder, which already exists, Are you sure to overwrite it? " -n 1 -r
	echo
	if [[ $REPLY =~ ^[Nn]$ ]]; then
		exit 0
	fi
fi
mkdir -p $folder
node split.js $1 $folder
