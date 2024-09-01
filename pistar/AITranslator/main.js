// Modules to control application life and create native browser window
const { app, dialog, shell, webContents, Menu, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { load_istar2, save_istar2, merge_istar2 } = require('./index')
const fs = require('fs');
const { exit } = require('process');

function createWindow() {
    
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'New Model',
          click() {
            dialog.showMessageBox(mainWindow, {
              type: "warning",
              buttons: [
                "OK", "Cancel"
              ],
              defaultId: 0,
              title: "Warning",
              message: 'Are you sure you want to create a new model and delete the current model?'
            }).then(result => {
              if (result.response === 0) {
                var jsonData = "goalModel = {}\n";              
                global.goalModel = load_istar2("index.istar2")
                global.update = true
                fs.writeFile("goalModel.js", jsonData, function (err) {
                  if (err) {
                    console.log(err);
                  }
                });              
                mainWindow.loadFile('index.html') 
            }
            });
          },
          accelerator: 'CmdOrCtrl+N'
        },
        {
          label: 'Open ...',
          click() {
            dialog.showOpenDialog(mainWindow, {
              defaultPath: app.getPath("documents"),
              extensions: [".txt", ".istar2"]
            }).then(result => {
              if (!result.cancelled) {
                fs.readFile(result.filePaths[0], 'utf-8', (err, data) => {
                  if (err) {
                    alert('An error occured while loading your file', err)
                    return
                  }
                  var jsonData = ""
                  if (result.filePaths[0].endsWith(".istar2")) {
                    if (global.goalModel == null)
                      global.goalModel = load_istar2(data)
                    else
                      global.goalModel = merge_istar2(global.goalModel, data);
                    jsonData = "goalModel = " + JSON.stringify(global.goalModel)
                  }
                  else if (result.filePaths[0].endsWith(".txt")
                    || result.filePaths[0].endsWith(".json")) {
                      global.goalModel = "goalModel = " + data;
                    }
                  fs.writeFile("goalModel.js", jsonData, function (err) {
                    if (err) {
                      console.log(err);
                    }
                  });               
                  global.updated = true
                  mainWindow.loadFile('index.html')
                });
              }
            });
          },
          accelerator: 'CmdOrCtrl+O'
        },
        {
          label: 'Save Model',
          click() {
            var jsonData = "goalModel =" + global.goalModel;
            fs.writeFile("goalModel.js", jsonData, function (err) {
              if (err) {
                console.log(err);
              }
            });
          },
          accelerator: 'CmdOrCtrl+S'
        },
        {
          label: 'Save As ...',
          click() {
            dialog.showSaveDialog(mainWindow, {
              defaultPath: app.getPath("documents"),
            }).then(result => {
              if (!result.cancelled) {
                if (global.goalModel!=null)
                  save_istar2(global.goalModel, result.filePath)
              }
            });
          },
          accelerator: 'CmdOrCtrl+Shift+S'
        },
        // { label: 'Save As Image...' },
        { type: 'separator' },
        {
          label: "Exit", click() {
            app.quit()
          },
          accelerator: 'CmdOrCtrl+Q'
        }
      ]
    },
    // {
    //   label: 'Insert',
    //   submenu: [
    //     {
    //       label: 'Actor',
    //       submenu: [
    //         { label: 'Actor' },
    //         { label: 'Agent' },
    //         { label: 'Role' },
    //       ]
    //     },
    //     {
    //       label: 'Actor Link',
    //       submenu: [
    //         { label: 'is a' },
    //         { label: 'participants-in' },
    //       ]
    //     },
    //     {
    //       label: 'Dependency',
    //       submenu: [
    //         { label: 'goal' },
    //         { label: 'quality' },
    //         { label: 'resource' },
    //         { label: 'task' },
    //       ]
    //     },
    //     { type: 'separator' },
    //     { label: 'Goal' },
    //     { label: 'Quality' },
    //     { label: 'Resource' },
    //     { label: 'Task' },
    //     { label: 'And' },
    //     { label: 'Or' },
    //     { label: 'Needed By' },
    //     { label: 'Qualification' },
    //     {
    //       label: 'Contribution',
    //       submenu: [
    //         { label: 'make' },
    //         { label: 'help' },
    //         { label: 'hurt' },
    //         { label: 'break' },
    //       ]
    //     },
    //   ]
    // },
    // {
    //   label: 'Options',
    //   submenu: [
    //     { label: 'Diagram Size...' },
    //     { type: 'separator' },
    //     { label: 'Pixel-perfect links' },
    //     { label: 'Toggle Full Screen' },
    //     { label: 'Straighten all links' },
    //   ]
    // },
    {
      label: 'Help',
      submenu: [
        // { label: 'Examples' },
        // { label: 'Quick Help' },
        {
          label: 'iStar 2.0 Language Guide',
          click() {
            shell.openExternal('https://sites.google.com/site/istarlanguage')
          },
          accelerator: 'CmdOrCtrl+H'
        },
      ]
    },
  ])
  Menu.setApplicationMenu(menu)

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 3555,
    height: 2861,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  ipcMain.on('syncGoalModel', (event, arg) => {
    console.log("sync");
    if (!global.updated) {
      global.goalModel = arg.goalmodel;
      global.selected = arg.selected;
      // console.log(arg);
      event.returnValue = null;
    } else {
      event.returnValue = global.goalModel;
      global.updated = false;
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
