var ModuleTestClock = (function(global) {

var _isNodeOrNodeWebKit = !!global.global;
var _runOnNodeWebKit =  _isNodeOrNodeWebKit && /native/.test(setTimeout);
var _runOnNode       =  _isNodeOrNodeWebKit && !/native/.test(setTimeout);
var _runOnWorker     = !_isNodeOrNodeWebKit && "WorkerLocation" in global;
var _runOnBrowser    = !_isNodeOrNodeWebKit && "document" in global;

return new Test("Clock", {
        disable:    false,
        browser:    true,
        worker:     true,
        node:       true,
        nw:         true,
        button:     true,
        both:       true, // test the primary module and secondary module
    }).add([
        //testClockBasic,
        // ----
        testClockOnOffResultValue,
        testClockOptions,
        testClockAndVSync,
        testClockOnce,
        testClockOnce2,
        // --- VSync ---
        testVSyncOnOffResultValue,
        testVSyncOptions,
        testVSyncPulse,
        // ---
        testClockSetBaseTime,
        testClockSetBaseTime0,
    ]).run().clone();

function testClockBasic(test, pass, miss) {

/*
    var clock = new Clock([tick], { start: true, vsync: false });

    function tick(timeStamp, deltaTime, count) {
        console.log({ timeStamp:timeStamp, deltaTime:deltaTime, count: count });
    }
    // setInterval(, 16.666) の間隔で tick をコールバックします。
    // コールバックの間隔はCPUと負荷に依存します。
    // アニメーション用途に使うことも可能ですがお勧めはしません。
    // この例では (243 - 71) / 10 = 17.2 ms 間隔で駆動しています。
    Object {timeStamp:  54, deltaTime:  0, count: 0}
    Object {timeStamp:  71, deltaTime: 17, count: 1}
    Object {timeStamp:  89, deltaTime: 18, count: 2}
    Object {timeStamp: 106, deltaTime: 17, count: 3}
    Object {timeStamp: 123, deltaTime: 17, count: 4}
    Object {timeStamp: 139, deltaTime: 16, count: 5}
    Object {timeStamp: 156, deltaTime: 17, count: 6}
    Object {timeStamp: 173, deltaTime: 17, count: 7}
    Object {timeStamp: 191, deltaTime: 18, count: 8}
    Object {timeStamp: 208, deltaTime: 17, count: 9}
    Object {timeStamp: 226, deltaTime: 18, count: 10}
    Object {timeStamp: 243, deltaTime: 17, count: 11}
 */
/*
    var clock = new Clock([tick], { start: true, vsync: false, wait: 100 });

    function tick(timeStamp, deltaTime, count) {
        console.log({ timeStamp:timeStamp, deltaTime:deltaTime, count: count });
    }
    // setInterval(, 100) の間隔で tick をコールバックします。
    // コールバックの間隔はCPUと負荷に依存します
    // デバッグ用途に利用できます。
    // この例では (1217 - 201) / 10 = 101.6 ms 間隔で駆動しており、1〜2msほど誤差がでています。
    Object {timeStamp:  100, deltaTime:   0, count: 0}
    Object {timeStamp:  201, deltaTime: 101, count: 1}
    Object {timeStamp:  303, deltaTime: 102, count: 2}
    Object {timeStamp:  404, deltaTime: 101, count: 3}
    Object {timeStamp:  506, deltaTime: 102, count: 4}
    Object {timeStamp:  607, deltaTime: 101, count: 5}
    Object {timeStamp:  709, deltaTime: 102, count: 6}
    Object {timeStamp:  811, deltaTime: 102, count: 7}
    Object {timeStamp:  913, deltaTime: 102, count: 8}
    Object {timeStamp: 1015, deltaTime: 102, count: 9}
    Object {timeStamp: 1116, deltaTime: 101, count: 10}
    Object {timeStamp: 1217, deltaTime: 101, count: 11}
 */
/*
    var clock = new Clock([tick], { start: true, vsync: false, pulse: 100 });

    function tick(timeStamp, deltaTime, count) {
        console.log({ timeStamp:timeStamp, deltaTime:deltaTime, count: count });
    }
    // setInterval(, 16.666) の間隔で tick をコールバックします。
    // コールバックの間隔はCPUと負荷に依存します。
    // timeStamp と deltaTime の値にはペースメイクされた理想的なクロックが供給されます。
    // レンダリングのデバッグ用途に使用できます。
    // この例では 平均 (1200 - 200) / 10 = 100.0 ms 間隔の値になります。誤差は出ていません。
    Object {timeStamp:  100, deltaTime:   0, count: 0}
    Object {timeStamp:  200, deltaTime: 100, count: 1}
    Object {timeStamp:  300, deltaTime: 100, count: 2}
    Object {timeStamp:  400, deltaTime: 100, count: 3}
    Object {timeStamp:  500, deltaTime: 100, count: 4}
    Object {timeStamp:  600, deltaTime: 100, count: 5}
    Object {timeStamp:  700, deltaTime: 100, count: 6}
    Object {timeStamp:  800, deltaTime: 100, count: 7}
    Object {timeStamp:  900, deltaTime: 100, count: 8}
    Object {timeStamp: 1000, deltaTime: 100, count: 9}
    Object {timeStamp: 1100, deltaTime: 100, count: 10}
    Object {timeStamp: 1200, deltaTime: 100, count: 11}
 */
/*
    var clock = new Clock([tick], { start: true, vsync: false, wait: 1000, pulse: 100 });

    function tick(timeStamp, deltaTime, count) {
        console.log({ timeStamp:timeStamp, deltaTime:deltaTime, count: count });
    }
    // setInterval(, 100) の間隔で tick をコールバックします。
    // コールバックの間隔はCPUと負荷に依存します。
    // timeStamp と deltaTime の値にはペースメイクされた理想的なクロックが供給されます。
    // レンダリングのデバッグ用途に使用できます。
    // この例では 平均 (1200 - 200) / 10 = 100.0 ms 間隔の値になります。誤差は出ていません。
    Object {timeStamp:  100, deltaTime:   0, count: 0}
    Object {timeStamp:  200, deltaTime: 100, count: 1}
    Object {timeStamp:  300, deltaTime: 100, count: 2}
    Object {timeStamp:  400, deltaTime: 100, count: 3}
    Object {timeStamp:  500, deltaTime: 100, count: 4}
    Object {timeStamp:  600, deltaTime: 100, count: 5}
    Object {timeStamp:  700, deltaTime: 100, count: 6}
    Object {timeStamp:  800, deltaTime: 100, count: 7}
    Object {timeStamp:  900, deltaTime: 100, count: 8}
    Object {timeStamp: 1000, deltaTime: 100, count: 9}
    Object {timeStamp: 1100, deltaTime: 100, count: 10}
    Object {timeStamp: 1200, deltaTime: 100, count: 11}
 */
/*
    var clock = new Clock([tick], { start: true, vsync: true });

    function tick(timeStamp, deltaTime, count) {
        console.log({ timeStamp:timeStamp, deltaTime:deltaTime, count: count });
    }
    // requestAnimationFrame の間隔で tick をコールバックします。
    // コールバックの間隔はCPUと負荷に依存します。
    // アニメーション用途に利用できます。
    // この例では 平均 (425.74 - 242.91) / 10 = 18.283ms 間隔で駆動しています。
    Object {timeStamp: 159.3509998638183, deltaTime:  0,                 count: 0}
    Object {timeStamp: 242.9140000604093, deltaTime: 83.563000196591020, count: 1}
    Object {timeStamp: 275.4189998377114, deltaTime: 32.504999777302146, count: 2}
    Object {timeStamp: 292.0979999471456, deltaTime: 16.679000109434128, count: 3}
    Object {timeStamp: 309.2350000515580, deltaTime: 17.137000104412436, count: 4}
    Object {timeStamp: 326.4089999720454, deltaTime: 17.173999920487404, count: 5}
    Object {timeStamp: 342.6089999265969, deltaTime: 16.199999954551460, count: 6}
    Object {timeStamp: 359.1310000047087, deltaTime: 16.522000078111887, count: 7}
    Object {timeStamp: 375.7909999694675, deltaTime: 16.659999964758754, count: 8}
    Object {timeStamp: 392.8359998390078, deltaTime: 17.044999869540334, count: 9}
    Object {timeStamp: 409.7090000286698, deltaTime: 16.873000189661980, count: 10}
    Object {timeStamp: 425.7479999214411, deltaTime: 16.038999892771244, count: 11}
 */
}

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
    var task = new TestTask(2, function(err, buffer, task) {
            clock.clear();
            clock.stop();

            if (err) {
                test.done(miss())
            } else {
                test.done(pass())
            }
        });

    var clock = new Clock([_userTick1, _userTick2], { start: true });

    function _userTick1(timeStamp, deltaTime, count) {
        if (count > 10) {
            task.pass();
        }
    }
    function _userTick2(timeStamp, deltaTime, count) {
        if (count > 10) {
            task.pass();
        }
    }
}

function testClockAndVSync(test, pass, miss) {
    var task = new TestTask(2, function(err, buffer, task) { // buffer has { clock, vsync }
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

    var clock = new Clock([_clockTick], { start: true });
    var vsync = new Clock([_vsyncTick], { start: true, vsync: true });

    function _clockTick(timeStamp, deltaTime, count) {
        if (count === 59) {
            task.set( "clock", timeStamp / 60 ).pass();
        }
    }
    function _vsyncTick(timeStamp, deltaTime, count) {
        if (count === 59) {
            task.set( "vsync", timeStamp / 60 ).pass();
        }
    }
}

function testClockOnce(test, pass, miss) {
    var clock = new Clock([], { start: true, wait: 1000 });

    clock.nth(function(timeStamp, deltaTime, count) {
        clock.stop();
        test.done(pass())
    });
}

function testClockOnce2(test, pass, miss) {
    var clock = new Clock([], { start: true, wait: 1000 });

    clock.nth(function(timeStamp, deltaTime, count) {
        switch (count) {
        case 1:
            clock.stop();
            test.done(pass());
            break;
        case 2:
            clock.stop();
            test.done(miss());
        }
    }, 2);
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
    var task = new TestTask(2, function(err, buffer, task) {
            vsync.clear();
            vsync.stop();

            if (err) {
                test.done(miss())
            } else {
                test.done(pass())
            }
        });

    var vsync = new Clock([_userTick1, _userTick2], { start: true, vsync: true });

    function _userTick1(timeStamp, deltaTime, count) {
        if (count > 10) {
            task.pass();
        }
    }
    function _userTick2(timeStamp, deltaTime, count) {
        if (count > 10) {
            task.pass();
        }
    }
}

function testVSyncPulse(test, pass, miss) {
    var task = new TestTask(10, function(err, buffer, task) {
            clock.clear();
            clock.stop();

            if (err) {
                test.done(miss())
            } else {
                test.done(pass())
            }
        });

    var clock = new Clock([], { vsync: false, wait: 100, pulse: 20, baseTime: 0 });

    clock.nth(_tick, 10);
    clock.start();

    function _tick(timeStamp, deltaTime, count) {
        console.log({ timeStamp:timeStamp, deltaTime:deltaTime, count:count });

        // deltaTime は初回が0で、それ以降は常に20になる(pulseが20なので)
        // waitが100なので 100ms 毎に呼ばれるが、timeStampは20msずつ増える
        if (timeStamp === (timeStamp | 0)) {
            if (timeStamp % 20 === 0) {
                if (deltaTime === 0 || deltaTime === 20) {
                    task.pass();
                    return;
                }
            }
        }
        task.miss();
    }
}

function testClockSetBaseTime(test, pass, miss) {
    var now1 = Date.now();
    var clock = new Clock([], { vsync: false, baseTime: Date.now() });
    var now2 = clock.now();

    console.log("now: ", now1, now2);

    if (now2 >= now1) {
        if (now2 <= now1 + 10) {
            test.done(pass())
            return;
        }
    }
    test.done(miss())
}

function testClockSetBaseTime0(test, pass, miss) {
    var clock = new Clock([], { vsync: false, baseTime: 0 });
    var now = clock.now();

    console.log("now: ", now);

    if (now < 10) {
        test.done(pass())
        return;
    }
    test.done(miss())
}


})((this || 0).self || global);

