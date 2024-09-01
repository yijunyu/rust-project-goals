const {load_istar2} = require('./index')
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
	var goalModel = "goalModel = " + JSON.stringify(load_istar2(input))
	console.log(goalModel)
    });
} else {
	var input_file = process.argv[2]
	var output_file= process.argv[3]
	input = fs.readFileSync(input_file, 'utf-8', (err, data) => {
	  if (err) {
	    alert('An error occured while loading your file', err)
	    return
	  }
          return input
	})
	var goalModel = "goalModel = " + JSON.stringify(load_istar2(input))
	fs.writeFile(output_file, goalModel, function (err) {
	  if (err) {
	    console.log(err);
	  }
	});              
}

