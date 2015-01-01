onmessage = function(event) {
    self.TEST_DATA = event.data; // WebModule/lib/Test.js
    self.TEST_ERROR_MESSAGE = "";

    if (!self.console) {
        self.console = function() {};
        self.console.log = function() {};
        self.console.warn = function() {};
        self.console.error = function() {};
    }

    importScripts("../node_modules/uupaa.easing.js/lib/Easing.js");
    importScripts("../../WebModule/lib/Reflection.js");
    importScripts("../../WebModule/lib/Console.js");
    importScripts("../../WebModule/lib/Valid.js");
    importScripts("../../WebModule/lib/Help.js");
    importScripts("../../WebModule/lib/Task.js");
    importScripts("../../WebModule/lib/Test.js");
    importScripts("../lib/Clock.js");
    importScripts("../release/Clock.min.w.js");
    importScripts("./testcase.js");

    self.postMessage({ TEST_ERROR_MESSAGE: self.TEST_ERROR_MESSAGE || "" });
};
