// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
});

window.setInterval(function () {
  goalmodel = istar.fileManager.saveModel();
  // console.log(goalmodel.diagram);
  const { ipcRenderer } = require("electron" );
  var model = ipcRenderer.send('syncGoalModel', goalmodel);
  // if (model != null) {
  //   istar.fileManager.loadModel(model);
  // }
}, 3000);
