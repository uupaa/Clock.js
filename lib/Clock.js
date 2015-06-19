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

// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
var RAF   = global["requestAnimationFrame"] ||
            global["webkitRequestAnimationFrame"] ||
            function(fn) { return setTimeout(fn, 1000 / 60, 0); };
var RAF_X = global["cancelAnimationFrame"]  ||
            global["webkitCancelAnimationFrame"] ||
            function(id) { clearTimeout(id); };

// --- class / interfaces ----------------------------------
function Clock(ticks,     // @arg TickFunctionArray = [] - [tick, ...]
               options) { // @arg Object = {} - { vsync, wait, pulse, spike, start, offset }
                          // @options.vsync     Boolean  = false  - vsync mode.
                          // @options.wait      Number   = 16.666 - setInterval(tick, wait)
                          // @options.pulse     Number   = 0.0    - overwrite delta time(unit: ms)(range of oscillation time).
                          // @options.spike     Function = null   - generate an irregular pulse(arrhythmia).
                          // @options.start     Boolean  = false  - auto start.
                          // @options.offset    Number   = 0.0    - timeStamp offset.
                          // @options.transform Function = null   - transform timeStamp and deltaTime.
                          // @desc Master Clock.
//{@dev
    if (!global["BENCHMARK"]) {
        $valid($type(ticks, "TickFunctionArray|omit"), Clock, "ticks");
        $valid($type(options, "Object|omit"), Clock, "options");
        $valid($keys(options, "vsync|wait|pulse|spike|start|offset|transform"), Clock, "options");
        if (options) {
            $valid($type(options.vsync,     "Boolean|omit"),  Clock, "options.vsync");
            $valid($type(options.wait,      "Number|omit"),   Clock, "options.wait");
            $valid($type(options.pulse,     "Number|omit"),   Clock, "options.pulse");
            $valid($type(options.spike,     "Function|omit"), Clock, "options.spike");
            $valid($type(options.start,     "Boolean|omit"),  Clock, "options.start");
            $valid($type(options.offset,    "Number|omit"),   Clock, "options.offset");
            $valid($type(options.transform, "Function|omit"), Clock, "options.transform");
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

    // --- slave mode ---
    this._master      = null;                       // Clock    - external master clock.
    this._slaves      = [];                         // ClockInstanceArray. [clock, ...]
    this._exportTicks = _callTicks.bind(this);      // Function - _callTicks.bind(this)

    // --- transform ---
    this._transform = options["transform"] || null; // Function - transform time stamp and elapsed.

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
    // --- slave mode ---
    "master":       { "get":   function()     { return this._master; } },
    "slaves":       { "get":   function()     { return this._slaves; } },
    "external":     { "value": Clock_external }, // Clock#external(master:Clock):void
    "internal":     { "value": Clock_internal }, // Clock#internal():void
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

    _callTicks.call(this, timeStamp, deltaTime);
}


function _callTicks(timeStamp, deltaTime) { // @bind this
    var garbage = false; // functions that are no longer needed.
    var arg0 = timeStamp;

    if (this._transform) {
        arg0 = this._transform(timeStamp, deltaTime);
    }

    // --- callback tick function ---
    for (var i = 0, iz = this._ticks.length; i < iz; ++i) {
        var tick = this._ticks[i];
        if (tick) {
            tick(arg0, deltaTime);
        } else {
            garbage = true;
        }
    }
    if (garbage) {
        this.ticks = _shrink(this._ticks);
    }

    // --- callback slaves tick function ---
    var iz;
    if (iz = this._slaves.length) {
        var garbage = false;

        for (var i = 0; i < iz; ++i) {
            var slave = this._slaves[i];
            if (slave) {
                _callTicks.call(slave, timeStamp, deltaTime);
            } else {
                garbage = true;
            }
        }
        if (garbage) {
            this._slaves = _shrink(this._slaves);
        }
    }
}

function _shrink(arr) { // @arg Array - ticks or slaves.
                        // @ret Array - dense array.
    var denseArray = [];
    for (var i = 0, iz = arr.length; i < iz; ++i) {
        if (arr[i]) {
            denseArray.push(arr[i]);
        }
    }
    return denseArray;
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

function Clock_external(master) { // @arg Clock
                                  // @desc delegate calling ticks to external clock.
    if (this._master === master) {
        return;
    }
    if (this._master) {
        this["internal"]();
    }

    this["stop"]();

    master._slaves.push(this);
    this._master = master;
}

function Clock_internal() { // @desc release from external clock.
    if (!this._master) {
        return;
    }

    var pos = this._master._slaves.indexOf(this);
    if (pos >= 0) {
        this._master._slaves[pos] = null;
    }
    this._master = null;
}

return Clock; // return entity

});
