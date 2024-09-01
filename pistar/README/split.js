const {load_istar2, save_istar2} = require('./index')
const fs = require('fs')
var input_file = process.argv[2]
var output_folder= process.argv[3]
var data = fs.readFileSync(input_file, 'utf-8', (err, data) => {
  if (err) {
    console.log('An error occured while loading your file', err)
    return
  }
  return data
});
var goalModel = load_istar2(data)
goalModel.actors.forEach(function(a) {
	console.log(a.text)
	var output_file = output_folder + "/" + a.text.replace(/[ \t\n\r]+/g,"_") + ".istar2"
	goalModel.diagram.selected_actor = a.id
	save_istar2(JSON.stringify(goalModel), "tmp.istar2")
	// reallocate the line numbers
	var data2 = fs.readFileSync("tmp.istar2", 'utf-8', (err, data) => {
		  if (err) {
		    console.log('An error occured while loading your file', err)
		    return
		  }
		  return data
	})
	var model = load_istar2(data2)
	save_istar2(JSON.stringify(model), output_file)
})
