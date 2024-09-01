/*!
 * This is open-source. Which means that you can contribute to it, and help
 * make it better! Also, feel free to use, modify, redistribute, and so on.
 *
 * If you are going to edit the code, always work from the source-code available for download at
 * https://github.com/jhcp/pistar
 */
$(document).ready(function () {
    'use strict';
    istar.graph = istar.setup.setupModel();
    istar.paper = istar.setup.setupDiagram(istar.graph);
    istar.setupMetamodel(istar.metamodel);
    ui.setupUi();
    $(document).ready(function () {
        setTimeout(function () {
            istar.fileManager.loadModel(istar.models.processModelParameter());
            ui.selectPaper();//clear selection
        }, 5);
    });     
  });
