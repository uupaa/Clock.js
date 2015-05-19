var ModuleTestClock = (function(global) {

var _isNodeOrNodeWebKit = !!global.global;
var _runOnNodeWebKit =  _isNodeOrNodeWebKit &&  /native/.test(setTimeout);
var _runOnNode       =  _isNodeOrNodeWebKit && !/native/.test(setTimeout);
var _runOnWorker     = !_isNodeOrNodeWebKit && "WorkerLocation" in global;
var _runOnBrowser    = !_isNodeOrNodeWebKit && "document" in global;

global["BENCHMARK"] = false;

if (console) {
    if (!console.table) {
        console.table = console.dir;
    }
}

var test = new Test("Clock", {
        disable:    false, // disable all tests.
        browser:    true,  // enable browser test.
        worker:     true,  // enable worker test.
        node:       true,  // enable node test.
        nw:         true,  // enable nw.js test.
        button:     true,  // show button.
        both:       true,  // test the primary and secondary modules.
        ignoreError:false, // ignore error.
    }).add([
        // ----
        testClockOnOffResultValue,
        testClockOptions,
        testClockAndVSync,
        testClockPulse,
        // --- VSync ---
        testVSyncOnOffResultValue,
        testVSyncOptions,
        testVsyncPulse,
        // ---
        testClockOffset,
        testClockOffsetClock,
        testClockOffsetVsync,
        // ---
        testRelayClockVsync,
        testRelayClockVsyncPulse,
        // ---
        testClockNow,
        // --- spike ---
        testClock_spike,
    ]);

function testClockOnOffResultValue(test, pass, miss) {

    var clock = new Clock([_userTick1]);

    var result2 = clock.has(_userTick1) === true; // true

    clock.off(_userTick1);

    var result4 = clock.has(_userTick1) === false; // true

    clock.on(_userTick1);  // true
    clock.on(_userTick2);  // true

    clock.clear();         // true (all unregister)

    if (result2 === true &&
        result4 === true) {

        clock.clear();
        test.done(pass())
    } else {
        clock.clear();
        test.done(miss())
    }

    function _userTick1() { }
    function _userTick2() { }
}

function testClockOptions(test, pass, miss) {
    var task = new Task(2, function(err, buffer, task) {
            clock.clear();
            clock.stop();

            if (err) {
                test.done(miss())
            } else {
                test.done(pass())
            }
        });

    var counter1 = 0;
    var counter2 = 0;
    var clock = new Clock([_userTick1, _userTick2], { start: true });

    function _userTick1(timeStamp, deltaTime) {
        if (counter1++ > 10) {
            task.pass();
        }
    }
    function _userTick2(timeStamp, deltaTime) {
        if (counter2++ > 10) {
            task.pass();
        }
    }
}

function testClockAndVSync(test, pass, miss) {
    var task = new Task(2, function(err, buffer, task) { // buffer has { clock, vsync }
            clock.clear();
            vsync.clear();

            clock.stop();
            vsync.stop();

            var clockValue = buffer.clock;
            var vsyncValue = buffer.vsync;

            console.log("clock: " + clockValue + ", vsync: " + vsyncValue);

            if (err || !clockValue || !vsyncValue) {
                test.done(miss())
            } else {
                test.done(pass())
            }
        });

    var clockCount = 0;
    var clock = new Clock([_clockTick], { start: true });

    var vsyncCount = 0;
    var vsync = new Clock([_vsyncTick], { start: true, vsync: true });

    function _clockTick(timeStamp, deltaTime) {
        if (clockCount++ === 59) {
            task.set( "clock", timeStamp / 60 ).pass();
        }
    }
    function _vsyncTick(timeStamp, deltaTime) {
        if (vsyncCount++ === 59) {
            task.set( "vsync", timeStamp / 60 ).pass();
        }
    }
}

function testVSyncOnOffResultValue(test, pass, miss) {

    var vsync = new Clock([_userTick1], { vsync: true });

    var result2 = vsync.has(_userTick1) === true; // true

    vsync.off(_userTick1);

    var result4 = vsync.has(_userTick1) === false; // true

    vsync.on(_userTick1);  // true
    vsync.on(_userTick2);  // true

    vsync.clear();         // true (all unregister)

    if (result2 === true &&
        result4 === true) {

        vsync.clear()
        test.done(pass())
    } else {
        vsync.clear()
        test.done(miss())
    }

    function _userTick1() { }
    function _userTick2() { }
}

function testVSyncOptions(test, pass, miss) {
    var task = new Task(2, function(err, buffer, task) {
            vsync.clear();
            vsync.stop();

            if (err) {
                test.done(miss())
            } else {
                test.done(pass())
            }
        });

    var vsync = new Clock([_userTick1, _userTick2], { start: true, vsync: true });

    var counter1 = 0;
    var counter2 = 0;

    function _userTick1(timeStamp, deltaTime) {
        if (counter1++ > 10) {
            task.pass();
        }
    }
    function _userTick2(timeStamp, deltaTime) {
        if (counter2++ > 10) {
            task.pass();
        }
    }
}

function testClockPulse(test, pass, miss) {
    var task = new Task(10, function(err, buffer, task) {
            clock.clear();
            clock.stop();

            if (err) {
                test.done(miss())
            } else {
                test.done(pass())
            }
        });

    var clockCounter = 0;
    var clock = new Clock([_tick], { start: true, wait: 100, pulse: 20, offset: 0 });

    function _tick(timeStamp, deltaTime) {
        var count = clockCounter++;
        console.log({ timeStamp:timeStamp, deltaTime:deltaTime, count:count });

        // deltaTime は初回が0で、それ以降は常に20になる(pulseが20なので)
        // waitが100なので 100ms ±2ms 程度で呼ばれるはずだが、deltaTime は正確に20msずつ増える
        if (timeStamp === (timeStamp | 0)) {
                if (deltaTime === 0 || deltaTime === 20) {
                    task.pass();
                    return;
                }
        }
debugger;
        task.miss();
    }
}

function testVsyncPulse(test, pass, miss) {
    var task = new Task(10, function(err, buffer, task) {
            clock.clear();
            clock.stop();

            if (err) {
                test.done(miss())
            } else {
                test.done(pass())
            }
        });

    var clockCounter = 0;
    var clock = new Clock([_tick], { start: true, vsync: true, wait: 100, pulse: 20, offset: 0 });

    function _tick(timeStamp, deltaTime) {
        var count = clockCounter++;
        console.log({ timeStamp:timeStamp, deltaTime:deltaTime, count:count });

        // deltaTime は初回が0で、それ以降は常に20になる(pulseが20なので)
        // waitが100なので 100ms ±2ms 程度で呼ばれるはずだが、deltaTime は正確に20msずつ増える
        if (timeStamp === (timeStamp | 0)) {
                if (deltaTime === 0 || deltaTime === 20) {
                    task.pass();
                    return;
                }
        }
debugger;
        task.miss();
    }
}

function testClockOffset(test, pass, miss) {
    var offset = 1000000;

    var clock = new Clock([], { offset: offset });
    var vsync = new Clock([], { offset: offset, vsync: true });

    var lastTimeStamp1 = clock.lastTimeStamp;
    var lastTimeStamp2 = vsync.lastTimeStamp;

    console.log(lastTimeStamp1, lastTimeStamp2);

    if (lastTimeStamp1 === lastTimeStamp2) {
        test.done(pass())
    } else {
        test.done(miss())
    }
}

function testClockOffsetClock(test, pass, miss) {
    var offset = 1000000;
    var clock = new Clock([tick], { start: true, offset: offset });
    var task = new Task(10, function(err, buffer, task) {

            clock.stop();
            var result = buffer.every(function(v) {
                    return v >= offset;
                });

            var max = Math.max.apply(null, buffer);
            var min = Math.min.apply(null, buffer);
            var average = (max - min) / 10;

            console.log("testClockOffsetClock", min, max, average);

            if (result && average <= 17) { // 16.6666 <= 17
                test.done(pass())
            } else {

                test.done(miss())
            }
        });

    function tick(timeStamp, deltaTime) {
        var lastTimeStamp = clock.lastTimeStamp;
        console.log(lastTimeStamp);
        task.push(lastTimeStamp);
        task.pass();
    }
}


function testClockOffsetVsync(test, pass, miss) {
    var offset = 1000000;
    var clock = new Clock([tick], { start: true, offset: offset, vsync: true });
    var task = new Task(10, function(err, buffer, task) {

            clock.stop();
            var result = buffer.every(function(v) {
                    return v >= offset;
                });

            var max = Math.max.apply(null, buffer);
            var min = Math.min.apply(null, buffer);
            var average = (max - min) / 10;

            console.log("testClockOffsetVsync", min | 0, max | 0, average);

            if (result && average <= 17) { // 16.6666 <= 17
                test.done(pass())
            } else {
                test.done(miss())
            }
        });

    function tick(timeStamp, deltaTime) {
        var lastTimeStamp = clock.lastTimeStamp;
        console.log(lastTimeStamp);
        task.push(lastTimeStamp);
        task.pass();
    }
}

function testRelayClockVsync(test, pass, miss) {
    var times = [];
    var clock = new Clock([tick1], { start: true });
    var vsync = null;
    var clock2 = null;

    var task1 = new Task(3, function(err, buffer, task) {
            clock.stop();
            vsync = new Clock([tick2], { start: true, vsync: true, offset: clock.lastTimeStamp });
        });
    var task2 = new Task(3, function(err, buffer, task) {
            vsync.stop();
            clock2 = new Clock([tick3], { start: true, vsync: false, offset: vsync.lastTimeStamp });
        });
    var task3 = new Task(3, function(err, buffer, task) {
            clock2.stop();
            console.table( times );
            test.done(pass())
        });


    function tick1(timeStamp, deltaTime) {
        times.push({ time: timeStamp | 0, delta: deltaTime | 0, type: "clock" });
        task1.pass();
    }
    function tick2(timeStamp, deltaTime) {
        times.push({ time: timeStamp | 0, delta: deltaTime | 0, type: "vsync" });
        task2.pass();
    }
    function tick3(timeStamp, deltaTime) {
        times.push({ time: timeStamp | 0, delta: deltaTime | 0, type: "clock" });
        task3.pass();
    }
}

function testRelayClockVsyncPulse(test, pass, miss) {
    var times = [];
    var clock = new Clock([tick1], { start: true, pulse: 100 });
    var vsync = null;
    var clock2 = null;

    var task1 = new Task(3, function(err, buffer, task) {
            clock.stop();
            vsync = new Clock([tick2], { start: true, pulse: 100, vsync: true, offset: clock.lastTimeStamp });
        });
    var task2 = new Task(3, function(err, buffer, task) {
            vsync.stop();
            clock2 = new Clock([tick3], { start: true, pulse: 100, vsync: false, offset: vsync.lastTimeStamp });
        });
    var task3 = new Task(3, function(err, buffer, task) {
            clock2.stop();
            console.table( times );
            test.done(pass());
        });


    function tick1(timeStamp, deltaTime) {
        times.push({ time: timeStamp | 0, delta: deltaTime | 0, type: "clock" });
        task1.pass();
    }
    function tick2(timeStamp, deltaTime) {
        times.push({ time: timeStamp | 0, delta: deltaTime | 0, type: "vsync" });
        task2.pass();
    }
    function tick3(timeStamp, deltaTime) {
        times.push({ time: timeStamp | 0, delta: deltaTime | 0, type: "clock" });
        task3.pass();
    }
}

function testClockNow(test, pass, miss) {
    var clock = new Clock();
    try {
        clock.now();
        test.done(pass());
    } catch (err) {
        test.done(miss());
    }
}

function testClock_spike(test, pass, miss) {
    // 自動でclock供給開始
    // 大体100msごとに_tickをコールバックする (wait が 100 なため)
    // deltaTime は正確に前回の値+20msされた値になる (pulse が 20 なため)
    // offset が 0 なので、timeStamp は 0 から始まる
    // spike が指定されているため、pulse の値は spike の返す加工された値になる (不整脈を演出できる)
    var clock = new Clock([_tick], { start: true, wait: 100, pulse: 20, offset: 0, spike: _spike });

    var clockCounter = 0;

    // 20回試行でテスト終了
    var task = new Task(20, function(err, buffer, task) {
            clock.clear();
            clock.stop();

            if (err) {
                test.done(miss())
            } else {
                test.done(pass())
            }
        });

    function _tick(timeStamp, deltaTime) {
        var count = clockCounter++;
        console.log({ timeStamp:timeStamp, deltaTime:deltaTime, count:count });

        // deltaTime は初回が0で、それ以降は常に20になる(pulseが20なので)
        // ただし spike が値を加工した場合はその限りではない
        // waitが100なので 100ms ±2ms 程度で呼ばれるはずだが、deltaTime は正確に20msずつ増える
        if (count % 10 === 0) {
            // count が 0 と 10 の場合にpulse は 20 * 2 になる
            if (deltaTime === 40) {
                task.pass();
                return;
            }
        } else {
            if (timeStamp === (timeStamp | 0)) {
                if (deltaTime === 0 || deltaTime === 20) {
                    task.pass();
                    return;
                }
            }
        }
        task.miss();
    }

    // 10回(200ms)毎に pulse を2倍にする(不整脈を演出する)
    function _spike(timeStamp, // @arg Number
                    pulse,     // @arg Number
                    counter) { // @arg Integer
                               // @ret Number - modified pulse
        if (counter % 10 === 0) {
            return pulse * 2;
        }
        return pulse;
    }
}

return test.run().clone();

})((this || 0).self || global);

