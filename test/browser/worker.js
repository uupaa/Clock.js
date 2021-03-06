// Clock test

onmessage = function(event) {
    self.unitTest = event.data; // { message, setting: { secondary, baseDir } }

    if (!self.console) { // polyfill WebWorkerConsole
        self.console = function() {};
        self.console.dir = function() {};
        self.console.log = function() {};
        self.console.warn = function() {};
        self.console.error = function() {};
        self.console.table = function() {};
    }

    importScripts("../../lib/WebModule.js");

    WebModule.verify  = true;
    WebModule.verbose = true;
    WebModule.publish = true;

    importScripts("../../node_modules/uupaa.task.js/lib/Task.js");
    importScripts("../../node_modules/uupaa.task.js/lib/TaskMap.js");
    importScripts("../../node_modules/uupaa.easing.js/lib/Easing.js");
    importScripts("../wmtools.js");
    importScripts("../../lib/Clock.js");
    importScripts("../../release/Clock.w.min.js");
    importScripts("../testcase.js");

    self.postMessage(self.unitTest);
};

