''/*!
 * This is open-source. Which means that you can contribute to it, and help
 * make it better! Also, feel free to use, modify, redistribute, and so on.
 *
 * If you are going to edit the code, always work from the source-code available for download at
 * https://github.com/jhcp/pistar
 */
istar.models = istar.models || {};  //prevents overriding the variable, while also preventing working with a null variable

istar.models.processModelParameter = function () {
    "use strict";

    var modelId = this.getAllUrlParams().m || 'pistarWelcome';
    if (! istar.models[modelId]) {
        // alert('Sorry, we do not have this model: ' + modelId);
        modelId = 'pistarWelcome';
        istar.models[modelId] = {};
    }

    return istar.models[modelId];
};

istar.models.getAllUrlParams = function () {
    "use strict";
    //this function was adapted from the following tutorial:
    // https://www.sitepoint.com/get-url-parameters-with-javascript/

    // get query string from the window

    var queryString = window.location.search.slice(1);

    // we'll store the parameters here
    var obj = {};

    // if query string exists
    if (queryString) {

        // stuff after # is not part of query string, so get rid of it
        queryString = queryString.split('#')[0];

        // split our query string into its component parts
        var arr = queryString.split('&');

        for (var i = 0; i < arr.length; i++) {
            // separate the keys and the values
            var a = arr[i].split('=');

            // set parameter name and value (use 'true' if empty)
            var paramName = a[0];
            var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];
            // we're dealing with a string
            if (!obj[paramName]) {
                // if it doesn't exist, create property
                obj[paramName] = paramValue;
            } else if (obj[paramName] && typeof obj[paramName] === 'string'){
                // if property does exist and it's a string, convert it to an array
                obj[paramName] = [obj[paramName]];
                obj[paramName].push(paramValue);
            } else {
                // otherwise add the property
                obj[paramName].push(paramValue);
            }
        }
    }

    return obj;
};

istar.models.loadPistarWelcome = function () {
    istar.fileManager.loadModel(this.pistarWelcome);
};

istar.models.pistarWelcome = goalModel;
