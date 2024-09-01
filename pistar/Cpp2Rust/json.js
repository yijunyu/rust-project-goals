const {save_istar2} = require('./index')
const fs = require('fs')
var stdin = process.stdin;
var stdout = process.stdout;
if (process.argv[2] == null) {
    var input = '';

    stdin.on('readable', function() {
        var chuck = stdin.read();
        if(chuck !== null){
            input += chuck;
        }
    });
    stdin.on('end', function() {
	  save_istar2(input, null)
    });
} else {
	var input_file = process.argv[2]
	var output_file= input_file.replace(/.json/, ".istar2")
	var input = fs.readFile(input_file, 'utf-8', (err, data) => {
	  if (err) {
	    alert('An error occured while loading your file', err)
	    return
	  }
	  save_istar2(data, output_file)
	})
}

