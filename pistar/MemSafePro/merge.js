const {load_istar2, merge_istar2} = require('./index')
const fs = require('fs')
var input_file = process.argv[2]
var data = fs.readFileSync(input_file, 'utf-8', (err, data) => {
  if (err) {
    alert('An error occured while loading your file', err)
    return
  }
  return data
});
var goalModel = load_istar2(data)
var input_file2 = process.argv[3]
if (input_file2 != null) {
	var output_file= process.argv[4]
	var data2 = fs.readFileSync(input_file2, 'utf-8', (err, data) => {
	  if (err) {
	    alert('An error occured while loading your file', err)
	    return
	  }
	  return data
	});
	var new_goalModel = "goalModel = " + JSON.stringify(merge_istar2(goalModel, data2));
	fs.writeFileSync(output_file, new_goalModel, function (err) {
	  if (err) {
	    console.log(err);
	  }
	});
} else {
    var stdin = process.stdin;
    var stdout = process.stdout;
    var input = '';

    stdin.on('readable', function() {
        var chuck = stdin.read();
        if(chuck !== null){
            input += chuck;
        }
    });
    stdin.on('end', function() {
	var goalModel = load_istar2(input)
	var new_goalModel = "goalModel = " + JSON.stringify(merge_istar2(goalModel, data));
	console.log(new_goalModel)
    });
}
