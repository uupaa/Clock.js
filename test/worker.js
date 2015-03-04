// Clock test

onmessage = function(event) {
    self.TEST_DATA = event.data;
    self.TEST_ERROR_MESSAGE = "";

    if (!self.console) {
        self.console = function() {};
        self.console.log = function() {};
        self.console.warn = function() {};
        self.console.error = function() {};
    }

    importScripts("../node_modules/uupaa.task.js/lib/Task.js");
    importScripts("../node_modules/uupaa.easing.js/lib/Easing.js");
    importScripts(".././test/wmtools.js");
    importScripts("../lib/Clock.js");
    importScripts("../release/Clock.w.min.js");
    importScripts("./testcase.js");

    self.postMessage({ TEST_ERROR_MESSAGE: self.TEST_ERROR_MESSAGE || "" });
};

