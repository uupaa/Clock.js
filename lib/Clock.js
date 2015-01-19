(function(global) {
"use strict";

// --- dependency modules ----------------------------------
//var PageVisibilityEvent = global["PageVisibilityEvent"];

// --- define / local variables ----------------------------
//var _isNodeOrNodeWebKit = !!global.global;
//var _runOnNodeWebKit =  _isNodeOrNodeWebKit && /native/.test(setTimeout);
//var _runOnNode       =  _isNodeOrNodeWebKit && !/native/.test(setTimeout);
//var _runOnWorker     = !_isNodeOrNodeWebKit && "WorkerLocation" in global;
//var _runOnBrowser    = !_isNodeOrNodeWebKit && "document" in global;

/*
| API                   | iOS | AOSP | Chrome | IE  |
|-----------------------|-----|------|--------|-----|
| requestAnimationFrame |  7+ | 4.4+ | YES    | 10+ |
| performance.now()     |  8+ | 4.4+ | YES    | 10+ |
 */

/*
var clock = new Clock([tick], { start: true, vsync: true });

function tick(timeStamp, // @arg Number
              deltaTime, // @arg Number
              count) {   // @arg Integer - callback count
    update();
}
 */

var MODE_INTERVAL    = 1; // use setInterval
var MODE_RAF_EMULATE = 2; // use setTimeout(requestAnimationFrame emulation mode)
var MODE_RAF         = 3; // use requestAnimationFrame

// --- class / interfaces ----------------------------------
function Clock(ticks,     // @arg TickFunctionArray = [] - [tick, ...]
               options) { // @arg Object = {} - { start, vsync, wait, speed, pulse, suspend, baseTime }
                          // @options.start Boolean = false - auto start.
                          // @options.vsync Boolean = false - use requestAnimationFrame(false is use setInterval).
                          // @options.wait Number = 16.666 - setInterval(, wait)
                          // @options.speed Number = 16.666 - alias wait. [DEPRECATED]
                          // @options.pulse Number = 0.0 - overwrite delta time(unit: ms)(range of oscillation time).
                          // @options.suspend Boolean = false - automatically suspend by page visibility event.
                          // @options.baseTime Number = 0.0 - setBaseTime value
                          // @desc Master Clock.
//{@dev
    $valid($type(ticks,   "TickFunctionArray|omit"), Clock, "ticks");
    $valid($type(options, "Object|omit"), Clock, "options");
    $valid($keys(options, "start|vsync|wait|speed|pulse|suspend|baseTime"), Clock, "options");
    if (options) {
        $valid($type(options.start, "Boolean|omit"), Clock, "options.start");
        $valid($type(options.vsync, "Boolean|omit"), Clock, "options.vsync");
        $valid($type(options.wait,  "Number|omit"),  Clock, "options.wait");
        $valid($type(options.speed, "Number|omit"),  Clock, "options.speed");
        $valid($type(options.pulse, "Number|omit"),  Clock, "options.pulse");
        $valid($type(options.suspend, "Boolean|omit"), Clock, "options.suspend");
        $valid($type(options.baseTime, "Number|omit"), Clock, "options.baseTime");
        if (options.speed) {
            console.warn("Clock.js options.speed was deprecated.");
        }
    }
//}@dev

    options = options || {};

    var that = this;

    this._mode    = MODE_INTERVAL;              // Integer - mode. MODE_XXX
    this._ticks   = [];                         // TickFunctionArray - callback functions. [tick, ...]
    this._wait    = options["wait"]  ||
                    options["speed"] || 16.666; // Number - setInterval(, wait)
    this._pulse   = options["pulse"] || 0.0;    // Number - overwrite delta time(range of oscillation time).
    this._active  = false;                      // Boolean - active state.
    this._timerID = 0;                          // Integer - timer id.
    this._counter = 0;                          // Integer - callback counter.
    this._timeStamp = -1;                       // Number - last time stamp.
    this._baseTime  = 0.0;
    this._baseTimeDiff = 0.0;                   // difference time
    this._enterFrame = _enterFrame.bind(this);  // Function - _enterFrame.bind(this)
    this._suspend = { begin: 0, total: 0 };

    (ticks || []).forEach(Clock_on, this);

    if (options["vsync"]) {
        this._mode = global["requestAnimationFrame"] ? MODE_RAF : MODE_RAF_EMULATE;
    }
    if (options["suspend"]) { // auto suspend
        if (global["PageVisibilityEvent"]) {
            global["PageVisibilityEvent"]["on"](_onsuspend);
        }
    }
    if (options["start"]) { // auto start
        this["start"]();
    }
    this["setBaseTime"](options["baseTime"] || 0.0);

    function _onsuspend(pageHide) {
        if (pageHide) {
            that._suspend.begin = Date.now();
            that["stop"]();
        } else {
            that._suspend.total += ( Date.now() - that._suspend.begin );
            that._suspend.begin = 0;
            that["start"]();
        }
    }
}

Clock["prototype"] = Object.create(Clock, {
    "constructor":  { "value":  Clock               }, // new Clock(ticks:TickFunctionArray = [], options:Object = {}):Clock
    // --- base time ---
    "setBaseTime":  { "value":  Clock_setBaseTime   }, // Clock.setBaseTime(baseTime:Number):void
    "getBaseTime":  { "value":  Clock_getBaseTime   }, // Clock.getBaseTime():Number
    "now":          { "value":  Clock_now           }, // Clock.now():Number
    // --- clock state ---
    "start":        { "value":  Clock_start         }, // Clock#start():this
    "pause":        { "value":  Clock_pause         }, // Clock#pause():this
    "stop":         { "value":  Clock_stop          }, // Clock#stop():this
    "isActive":     { "value":  Clock_isActive      }, // Clock#isActive():Boolean
    // --- register / unregister callback functions ---
    "on":           { "value":  Clock_on            }, // Clock#on(tick:Function):this
    "off":          { "value":  Clock_off           }, // Clock#off(tick:Function):this
    "has":          { "value":  Clock_has           }, // Clock#has(tick:Function):Boolean
    "clear":        { "value":  Clock_clear         }, // Clock#clear():this
    // --- register temporary callback function ---
    "nth":          { "value":  Clock_nth           }, // Clock#nth(callback:Function, times:Integer = 1):this
    // --- utility ---
    "resetCount":   { "value":  Clock_resetCount    }, // Clock#resetCount():this
    "resetTimeStamp":{ "value": Clock_resetTimeStamp}, // Clock#resetTimeStamp():this
    // --- accessor ---
    "pulse": {
        "set":  function(v) { this._pulse = v;  },
        "get":  function()  { return this._pulse }
    },
    "wait": {
        "set":  function(v) {
                    if (this._active) {
                        this["stop"](); this._wait = v; this["start"]();
                    } else {
                        this._wait = v;
                    }
                },
        "get":  function()  { return this._wait }
    }
});

// --- implements ------------------------------------------
function _enterFrame(timeStamp) { // @arg DOMHighResTimeStamp|undefined - requestAnimationFrame give us timeStamp.
                                  // @bind this
    if (!this._active) {
        return;
    }
    switch (this._mode) {
    case MODE_RAF_EMULATE: this._timerID = setTimeout(this._enterFrame, 4); break;
    case MODE_RAF:         this._timerID = global["requestAnimationFrame"](this._enterFrame);
    }
    if (!this._ticks.length) {
        return;
    }
    // setInterval and setTimeout does not give us the timeStamp.
    if (this._mode === MODE_INTERVAL ||
        this._mode === MODE_RAF_EMULATE) {
      //timeStamp = this["now"](); // inlining Clock#now
        timeStamp = (Date.now() - this._baseTimeDiff);
    }
    // reduce the suspended time
    timeStamp -= this._suspend.total;

    var garbageFunctions = 0; // functions that are no longer needed.
    var deltaTime = 0;        // elapsed time since the last frame.
    var count = this._counter++;

    // --- adjust timeStamp and deltaTime ---
    if (this._timeStamp < 0) { // init
        if (this._pulse) { // overwrite timeStamp
            timeStamp = this._pulse;
        }
    } else {
        if (this._pulse) { // overwrite timeStamp
            timeStamp = this._pulse + this._timeStamp;
            deltaTime = this._pulse;
        } else {
            deltaTime = timeStamp - this._timeStamp;
        }
    }
    this._timeStamp = timeStamp; // update time stamp

    // --- callback tick function ---
    for (var i = 0, iz = this._ticks.length; i < iz; ++i) {
        var tick = this._ticks[i];

        if (tick) {
            tick(timeStamp,  // @arg Number - current time
                 deltaTime,  // @arg Number - delta time
                 count);     // @arg Integer - callback count
        } else {
            ++garbageFunctions;
        }
    }
    if (garbageFunctions) {
        _garbageCollection(this);
    }
}
function _garbageCollection(that) {
    var denseArray = [];
    for (var i = 0, iz = that._ticks.length; i < iz; ++i) {
        if (that._ticks[i]) {
            denseArray.push(that._ticks[i]);
        }
    }
    that._ticks = denseArray;
}

function Clock_start() { // @ret this
                         // @desc start the master clock.
    if (!this._active) {
        this._active = true;

        switch (this._mode) {
        case MODE_INTERVAL:    this._timerID = setInterval(this._enterFrame, this._wait); break;
        case MODE_RAF_EMULATE: this._timerID = setTimeout(this._enterFrame, 4); break;
        case MODE_RAF:         this._timerID = global["requestAnimationFrame"](this._enterFrame);
        }
    }
    return this;
}

function Clock_stop() { // @ret this
                        // @desc stop the master clock.
    if (this._active) {
        this._active = false;

        switch (this._mode) {
        case MODE_INTERVAL:    clearInterval(this._timerID); break;
        case MODE_RAF_EMULATE: clearTimeout(this._timerID); break;
        case MODE_RAF:         global["cancelAnimationFrame"](this._timerID);
        }
        this._timerID = 0;
    }
    return this;
}

function Clock_pause() { // @ret this
                         // @desc toggle start/stop state
    if (this._active) {
        this["stop"]();
    } else {
        this["start"]();
    }
    return this;
}

function Clock_isActive() { // @ret Boolean
    return this._active;
}

function Clock_on(tick) { // @arg Function - tick(timeStamp:Number, deltaTime:Number, count:Integer):void
                          // @ret this
                          // @desc register callback.
//{@dev
    $valid($type(tick, "Function"), Clock_on, "tick");
//}@dev

    if ( !this["has"](tick) ) { // ignore already registered function.
        this._ticks.push(tick);
    }
    return this;
}

function Clock_off(tick) { // @arg Function - registered tick function.
                           // @ret this
                           // @desc deregister callback.
//{@dev
    $valid($type(tick, "Function"), Clock_off, "tick");
//}@dev

    var pos = this._ticks.indexOf(tick);

    if (pos >= 0) {
        this._ticks[pos] = null;
    }
    return this;
}

function Clock_has(tick) { // @arg Function - tick function
                           // @ret Boolean - true is registered, false is unregistered.
//{@dev
    $valid($type(tick, "Function"), Clock_has, "tick");
//}@dev

    return this._ticks.indexOf(tick) >= 0;
}

function Clock_nth(callback, // @arg Function - callback(timeStamp:Number, deltaTime:Number, count:Integer):void
                   times) {  // @arg Integer = 1 - value from 1.
                             // @ret this
                             // @desc register the callback function of number of times.
//{@dev
    $valid($type(callback, "Function"),  Clock_nth, "callback");
    $valid($type(times, "Integer|omit"), Clock_nth, "times");
    if (times !== undefined) {
        $valid(times > 0,                Clock_nth, "times");
    }
//}@dev

    times = times || 1;

    var that = this;
    var counter = 0;

    if (this["has"](callback)) {
        throw new TypeError("callback function already exists");
    }
    return that["on"](_handler);

    function _handler(timeStamp, deltaTime) {
        if (counter + 1 >= times) {
            that["off"](_handler);
        }
        callback(timeStamp, deltaTime, counter++);
    }
}

function Clock_clear() { // @ret this
                         // @desc clear all ticks.
    for (var i = 0, iz = this._ticks.length; i < iz; ++i) {
        this._ticks[i] = null;
    }
    return this;
}

function Clock_resetCount() { // @ret this
    this._counter = 0;
    return this;
}

function Clock_resetTimeStamp() { // @ret this
    this._timeStamp = -1; // reset
    this._suspend = { begin: 0, total: 0 };
    return this;
}

function Clock_setBaseTime(baseTime) { // @arg Number - base time
//{@dev
    $valid($type(baseTime, "Number"), Clock_setBaseTime, "baseTime");
//}@dev
    this._baseTime = baseTime;
    this._baseTimeDiff = Date.now() - baseTime;
}

function Clock_getBaseTime() { // @ret Number - base time
    return this._baseTime;
}

function Clock_now() { // @ret Number
    return Date.now() - this._baseTimeDiff;
}

// --- validate / assertions -------------------------------
//{@dev
function $valid(val, fn, hint) { if (global["Valid"]) { global["Valid"](val, fn, hint); } }
function $type(obj, type) { return global["Valid"] ? global["Valid"].type(obj, type) : true; }
function $keys(obj, str) { return global["Valid"] ? global["Valid"].keys(obj, str) : true; }
//function $some(val, str, ignore) { return global["Valid"] ? global["Valid"].some(val, str, ignore) : true; }
//function $args(fn, args) { if (global["Valid"]) { global["Valid"].args(fn, args); } }
//}@dev

// --- exports ---------------------------------------------
if (typeof module !== "undefined") {
    module["exports"] = Clock;
}
global["Clock" in global ? "Clock_" : "Clock"] = Clock; // switch module. http://git.io/Minify

})((this || 0).self || global); // WebModule idiom. http://git.io/WebModule

