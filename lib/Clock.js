(function(global) {
"use strict";

// --- dependency modules ----------------------------------
//var PageVisibilityEvent = global["PageVisibilityEvent"];

// --- define / local variables ----------------------------
//var _isNodeOrNodeWebKit = !!global.global;
//var _runOnNodeWebKit =  _isNodeOrNodeWebKit &&  /native/.test(setTimeout);
//var _runOnNode       =  _isNodeOrNodeWebKit && !/native/.test(setTimeout);
//var _runOnWorker     = !_isNodeOrNodeWebKit && "WorkerLocation" in global;
//var _runOnBrowser    = !_isNodeOrNodeWebKit && "document" in global;

/*
| API                         | iOS      | Chrome | IE  | Android |
|-----------------------------|----------|--------|-----|---------|
| webkitRequestAnimationFrame | 6.0+     | YES    | 10+ | 4.4+    |
| requestAnimationFrame       | 7.0+     | YES    | 10+ | 4.4+    |
| performance.now()           | 8.0 only | YES    | 10+ | 4.4+    |
 */

/*
var clock = new Clock([tick], { vsync: true, start: true });

function tick(timeStamp,   // @arg Number - current time
              deltaTime) { // @arg Number - delta time
    update();
}
 */

var RAF   = global["requestAnimationFrame"] ||
            global["webkitRequestAnimationFrame"] ||
            function(fn) {
                setTimeout(fn, 1000 / 60, 0);
            };
var RAF_X = global["cancelAnimationFrame"]  ||
            global["webkitCancelAnimationFrame"] ||
            function(id) {
                clearTimeout(id);
            };

// --- class / interfaces ----------------------------------
function Clock(ticks,     // @arg TickFunctionArray = [] - [tick, ...]
               options) { // @arg Object = {} - { vsync, wait, pulse, start, offset }
                          // @options.vsync  Boolean = false - vsync mode.
                          // @options.wait   Number = 16.666 - setInterval(tick, wait)
                          // @options.pulse  Number = 0.0 - overwrite delta time(unit: ms)(range of oscillation time).
                          // @options.start  Boolean = false - auto start.
                          // @options.offset Number = 0.0 - timeStamp offset.
                          // @desc Master Clock.
//{@dev
    if (!global["BENCHMARK"]) {
        $valid($type(ticks, "TickFunctionArray|omit"), Clock, "ticks");
        $valid($type(options, "Object|omit"), Clock, "options");
        $valid($keys(options, "vsync|wait|pulse|start|offset"), Clock, "options");
        if (options) {
            $valid($type(options.vsync, "Boolean|omit"), Clock, "options.vsync");
            $valid($type(options.wait,  "Number|omit"),  Clock, "options.wait");
            $valid($type(options.pulse, "Number|omit"),  Clock, "options.pulse");
            $valid($type(options.start, "Boolean|omit"), Clock, "options.start");
            $valid($type(options.offset,"Number|omit"),  Clock, "options.offset");
        }
    }
//}@dev

    options = options || {};

    this._ticks    = [];                            // TickFunctionArray. [tick, ...]
    this._vsync    = options["vsync"] || false;     // Boolean - vsync mode
    this._wait     = options["wait"]  || 1000 / 60; // Number  - setInterval(tick, wait)
    this._pulse    = options["pulse"] || 0.0;       // Number  - overwrite delta time(range of oscillation time).
    this._active   = false;                         // Boolean - active state.
    this._counter  = 0;
    this._timerID  = 0;                             // Integer - timer id.
    this._baseTime = 0;                             // Number - offset from zero.
    this._timeOffset = options["offset"] || 0.0;    // Number - timeStamp offset.
    this._enterFrame = _enterFrame.bind(this);      // Function - _enterFrame.bind(this)
    this._lastTimeStamp = 0;                        // Number - last time stamp.

    if (this._vsync) {
        RAF((function(timeStamp) { this._baseTime = timeStamp || Date.now(); }).bind(this));
    } else {
        this._baseTime = Date.now();
    }
    (ticks || []).forEach(Clock_on, this);
    if (options["start"]) { this["start"](); }
}

Clock["prototype"] = Object.create(Clock, {
    "constructor":  { "value": Clock       }, // new Clock(options:Object = {}):Clock
    "active":       { "get":   function()  { return this._active; } },
    "start":        { "value": Clock_start }, // Clock#start():this
    "stop":         { "value": Clock_stop  }, // Clock#stop():this
    // --- register / unregister tick functions ---
    "on":           { "value": Clock_on    }, // Clock#on(tick:Function):void
    "off":          { "value": Clock_off   }, // Clock#off(tick:Function):void
    "has":          { "value": function(v) { return this._ticks.indexOf(v) >= 0; } },
    "clear":        { "value": Clock_clear }, // Clock#clear():void
    // --- utility ---
    "lastTimeStamp":{ "get":   function()  { return this._lastTimeStamp + this._timeOffset; } },
    "ticks":        { "get":   function()  { return this._ticks; } },
});

// --- implements ------------------------------------------
function _enterFrame(highResTimeStamp) { // @arg DOMHighResTimeStamp|undefined - requestAnimationFrame give us timeStamp.
                                         // @bind this
    if (!this._active) {
        return;
    }
    if (this._vsync) {
        this._timerID = RAF(this._enterFrame);
    }
    if (!this._ticks.length) {
        return;
    }

    // setInterval or setTimeout does not give us the highResTimeStamp.
    var timeStamp = (highResTimeStamp || Date.now()) - this._baseTime;
    var deltaTime = 0;     // elapsed time since the last frame.
    var garbage   = false; // functions that are no longer needed.

    if (this._pulse) {
        // --- adjust timeStamp and deltaTime ---
        if (this._counter++) {
            timeStamp = this._pulse + this._lastTimeStamp;
        }
        deltaTime = this._pulse;
    } else {
        deltaTime = timeStamp - this._lastTimeStamp;
    }
    this._lastTimeStamp = timeStamp; // update lastTimeStamp
    timeStamp += this._timeOffset;

    // --- callback tick function ---
    for (var i = 0, iz = this._ticks.length; i < iz; ++i) {
        var tick = this._ticks[i];
        if (tick) {
            tick(timeStamp, deltaTime);
        } else {
            garbage = true;
        }
    }
    if (garbage) {
        _shrink.call(this);
    }
}

function _shrink() { // @bind this
    var denseArray = [];
    for (var i = 0, iz = this._ticks.length; i < iz; ++i) {
        if (this._ticks[i]) {
            denseArray.push(this._ticks[i]);
        }
    }
    this._ticks = denseArray; // overwrite
}

function Clock_start() {
    if (!this._active) {
        this._active = true;
        this._timerID = this._vsync ? RAF(this._enterFrame)
                                    : setInterval(this._enterFrame, this._wait, 0);
    }
}

function Clock_stop() {
    if (this._active) {
        this._active = false;
        if (this._vsync) {
            RAF_X(this._timerID);
        } else {
            clearInterval(this._timerID);
        }
        this._timerID = 0;
    }
}

function Clock_on(tick) { // @arg Function - tick(timeStamp:Number, deltaTime:Number):void
                          // @desc register callback.
    if ( !this["has"](tick) ) { // ignore already registered function.
        this._ticks.push(tick);
    }
}

function Clock_off(tick) { // @arg Function - registered tick function.
                           // @desc unregister callback.
    var pos = this._ticks.indexOf(tick);
    if (pos >= 0) {
        this._ticks[pos] = null;
    }
}

function Clock_clear() { // @desc clear all ticks.
    for (var i = 0, iz = this._ticks.length; i < iz; ++i) {
        this._ticks[i] = null;
    }
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

