// Clock test

require("../lib/WebModule.js");

// publish to global
WebModule.publish = true;

require("../node_modules/uupaa.task.js/lib/Task.js");
require("../node_modules/uupaa.task.js/lib/TaskMap.js");
require("../node_modules/uupaa.easing.js/lib/Easing.js");
require("./wmtools.js");
require("../lib/Clock.js");
require("../release/Clock.n.min.js");
require("./testcase.js");

