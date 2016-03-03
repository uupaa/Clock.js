(function moduleExporter(name, closure) {
"use strict";

var entity = GLOBAL["WebModule"]["exports"](name, closure);

if (typeof module !== "undefined") {
    module["exports"] = entity;
}
return entity;

})("Clock", function moduleClosure(global) {
"use strict";

/*
| API                         | iOS      | Chrome | IE  | Android Browser | Chromium based Browser |
|-----------------------------|----------|--------|-----|-----------------|------------------------|
| webkitRequestAnimationFrame | 6.0+     | YES    | 10+ | NO              | 4.4+                   |
| requestAnimationFrame       | 7.0+     | YES    | 10+ | NO              | 4.4+                   |
| performance.now()           | 9.0+     | YES    | 10+ | NO              | 4.4+                   |
 */

/*
var clock = new Clock([_tick], { vsync: true, start: true });

function _tick(timeStamp,   // @arg Number - current time
               deltaTime) { // @arg Number - delta time
    _update();
}
function _update() {
    // redraw
}
 */

// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
var RAF   = global["requestAnimationFrame"]       ||
            global["webkitRequestAnimationFrame"] ||
            function(fn) { return setTimeout(fn, 1000 / 60, 0); };
var RAF_X = global["cancelAnimationFrame"]        ||
            global["webkitCancelAnimationFrame"]  ||
            function(id) { clearTimeout(id); };

// --- class / interfaces ----------------------------------
function Clock(ticks,     // @arg TickFunctionArray = [] - [tick, ...]
               options) { // @arg Object = {} - { vsync, wait, pulse, spike, start, offset }
                          // @options.vsync  Boolean  = false  - vsync mode.
                          // @options.wait   Number   = 16.666 - setInterval(tick, wait)
                          // @options.pulse  Number   = 0.0    - overwrite delta time(unit: ms)(range of oscillation time).
                          // @options.spike  Function = null   - generate an irregular pulse(arrhythmia).
                          // @options.start  Boolean  = false  - auto start.
                          // @options.offset Number   = 0.0    - timeStamp offset.
                          // @desc Master Clock.
//{@dev
    if (!global["BENCHMARK"]) {
        $valid($type(ticks, "TickFunctionArray|omit"), Clock, "ticks");
        $valid($type(options, "Object|omit"), Clock, "options");
        $valid($keys(options, "vsync|wait|pulse|spike|start|offset"), Clock, "options");
        if (options) {
            $valid($type(options.vsync,  "Boolean|omit"),  Clock, "options.vsync");
            $valid($type(options.wait,   "Number|omit"),   Clock, "options.wait");
            $valid($type(options.pulse,  "Number|omit"),   Clock, "options.pulse");
            $valid($type(options.spike,  "Function|omit"), Clock, "options.spike");
            $valid($type(options.start,  "Boolean|omit"),  Clock, "options.start");
            $valid($type(options.offset, "Number|omit"),   Clock, "options.offset");
        }
    }
//}@dev

    options = options || {};

    this._ticks    = [];                            // TickFunctionArray. [tick, ...]
    this._vsync    = options["vsync"] || false;     // Boolean  - vsync mode
    this._wait     = options["wait"]  || 1000 / 60; // Number   - setInterval(tick, wait)
    this._pulse    = options["pulse"] || 0.0;       // Number   - overwrite delta time(range of oscillation time).
    this._spike    = options["spike"] || null;      // Function - generate an irregular pulse(arrhythmia).
    this._active   = false;                         // Boolean  - active state.
    this._counter  = 0;                             // Integer  - pulse generate counter.
    this._timerID  = 0;                             // Integer  - timer id.
    this._baseTime = 0;                             // Number   - offset from zero.
    this._timeOffset = options["offset"] || 0.0;    // Number   - timeStamp offset.
    this._enterFrame = _enterFrame.bind(this);      // Function - _enterFrame.bind(this)
    this._lastTimeStamp = 0;                        // Number   - last time stamp.

    // --- get base time ---
    if (this._vsync) {
        RAF((function(timeStamp) { this._baseTime = timeStamp || Date.now(); }).bind(this));
    } else {
        this._baseTime = Date.now();
    }

    // --- init ---
    (ticks || []).forEach(Clock_on, this);

    if (options["start"]) {
        this["start"]();
    }
}

Clock["repository"] = "https://github.com/uupaa/Clock.js"; // GitHub repository URL.
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
    "now":          { "value": function()  { return Date.now() - this._baseTime; } },
    "lastTimeStamp":{ "get":   function()  { return this._lastTimeStamp + this._timeOffset; } },
    "ticks":        { "get":   function()  { return this._ticks; } },
    // --- accessor ---
    "get":          { "value": function(k)    { return this["_" + k];     } }, // Clock#get(key:String):Any
    "set":          { "value": function(k, v) {        this["_" + k] = v; } }, // Clock#set(key:String, value:Any):void
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
    var timeStamp = (highResTimeStamp || Date.now()) - this._baseTime; // current time stamp.
    var deltaTime = 0;     // elapsed time since the last frame.
    var garbage   = false; // functions that are no longer needed.

    if (this._pulse) {
        var pulse = this._pulse;

        if (this._spike) {
            pulse = this._spike(timeStamp, pulse, this._counter);
        }
        // --- adjust timeStamp and deltaTime ---
        if (this._counter++) {
            timeStamp = pulse + this._lastTimeStamp;
        }
        deltaTime = pulse;
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

return Clock; // return entity

});

