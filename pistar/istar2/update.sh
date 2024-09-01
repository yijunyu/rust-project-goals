jsfolder=$(echo $1 | sed -e 's/\\tool\\istar2//' | sed -e 's/\\/\//g' | sed -e 's/://')
jsfolder=$(dirname $jsfolder)
jsfolder=$(basename $jsfolder)
echo $jsfolder
make $jsfolder.js
