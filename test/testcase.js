var ModuleTestClock = (function(global) {

global["BENCHMARK"] = false;

var test = new Test("Clock", {
        disable:    false, // disable all tests.
        browser:    true,  // enable browser test.
        worker:     true,  // enable worker test.
        node:       true,  // enable node test.
        nw:         true,  // enable nw.js test.
        button:     true,  // show button.
        both:       true,  // test the primary and secondary modules.
        ignoreError:false, // ignore error.
        callback:   function() {
        },
        errorback:  function(error) {
        }
    }).add([
        // generic test
        testClock_onOffResultValue,
        testClock_options,
        testClock_vsync,
        testClock_pulse,
        // --- vsync ---
        testClock_vsyncOnOffResultValue,
        testClock_vsyncOptions,
        testClock_vsyncPulse,
        // ---
        testClock_offset,
        testClock_offsetClock,
        testClock_offsetVsync,
        // ---
        testClock_relayClockVsync,
        testClock_relayClockVsyncPulse,
        // ---
        testClock_now,
        // --- spike ---
        testClock_spike,
        // --- master slave mode ---
        testClock_external,
        testClock_internal,
        testClock_switchExternal,
        testClock_switchExternalPulse,
        testClock_switchExternalInternal,
        testClock_switchExternalInternalPulse,
        // --- vsync
        testClock_vsyncSwitchExternal,
        testClock_vsyncSwitchExternalPulse,
        testClock_vsyncSwitchExternalInternal,
        testClock_vsyncSwitchExternalInternalPulse,
        // --- transform ---
        testClock_transform,
        testClock_transformSwitchExternal,
        testClock_transformVsyncSwitchExternal,
    ]);

if (IN_BROWSER || IN_NW) {
    test.add([
        // browser and node-webkit test
    ]);
} else if (IN_WORKER) {
    test.add([
        // worker test
    ]);
} else if (IN_NODE) {
    test.add([
        // node.js and io.js test
    ]);
}

// --- test cases ------------------------------------------
function testClock_onOffResultValue(test, pass, miss) {

    var clock = new WebModule.Clock([_userTick1]);

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

function testClock_options(test, pass, miss) {
    var task = new WebModule.Task(2, function(err, buffer, task) {
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
    var clock = new WebModule.Clock([_userTick1, _userTick2], { start: true });

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

function testClock_vsync(test, pass, miss) {
    var task = new WebModule.Task(2, function(err, buffer, task) { // buffer has { clock, vsync }
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
    var clock = new WebModule.Clock([_clockTick], { start: true });

    var vsyncCount = 0;
    var vsync = new WebModule.Clock([_vsyncTick], { start: true, vsync: true });

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

function testClock_vsyncOnOffResultValue(test, pass, miss) {

    var vsync = new WebModule.Clock([_userTick1], { vsync: true });

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

function testClock_vsyncOptions(test, pass, miss) {
    var task = new WebModule.Task(2, function(err, buffer, task) {
            vsync.clear();
            vsync.stop();

            if (err) {
                test.done(miss())
            } else {
                test.done(pass())
            }
        });

    var vsync = new WebModule.Clock([_userTick1, _userTick2], { start: true, vsync: true });

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

function testClock_pulse(test, pass, miss) {
    var task = new WebModule.Task(10, function(err, buffer, task) {
            clock.clear();
            clock.stop();

            if (err) {
                test.done(miss())
            } else {
                test.done(pass())
            }
        });

    var clockCounter = 0;
    var clock = new WebModule.Clock([_tick], { start: true, wait: 100, pulse: 20, offset: 0 });

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

function testClock_vsyncPulse(test, pass, miss) {
    var task = new WebModule.Task(10, function(err, buffer, task) {
            clock.clear();
            clock.stop();

            if (err) {
                test.done(miss())
            } else {
                test.done(pass())
            }
        });

    var clockCounter = 0;
    var clock = new WebModule.Clock([_tick], { start: true, vsync: true, wait: 100, pulse: 20, offset: 0 });

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

function testClock_offset(test, pass, miss) {
    var offset = 1000000;

    var clock = new WebModule.Clock([], { offset: offset });
    var vsync = new WebModule.Clock([], { offset: offset, vsync: true });

    var lastTimeStamp1 = clock.lastTimeStamp;
    var lastTimeStamp2 = vsync.lastTimeStamp;

    console.log(lastTimeStamp1, lastTimeStamp2);

    if (lastTimeStamp1 === lastTimeStamp2) {
        test.done(pass())
    } else {
        test.done(miss())
    }
}

function testClock_offsetClock(test, pass, miss) {
    var offset = 1000000;
    var clock = new WebModule.Clock([tick], { start: true, offset: offset });
    var task = new WebModule.Task(10, function(err, buffer, task) {

            clock.stop();
            var result = buffer.every(function(v) {
                    return v >= offset;
                });

            var max = Math.max.apply(null, buffer);
            var min = Math.min.apply(null, buffer);
            var average = (max - min) / 10;

            console.log("testClock_offsetClock", min, max, average);

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


function testClock_offsetVsync(test, pass, miss) {
    var offset = 1000000;
    var clock = new WebModule.Clock([tick], { start: true, offset: offset, vsync: true });
    var task = new WebModule.Task(10, function(err, buffer, task) {

            clock.stop();
            var result = buffer.every(function(v) {
                    return v >= offset;
                });

            var max = Math.max.apply(null, buffer);
            var min = Math.min.apply(null, buffer);
            var average = (max - min) / 10;

            console.log("testClock_offsetVsync", min | 0, max | 0, average);

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

function testClock_relayClockVsync(test, pass, miss) {
    var times = [];
    var clock = new WebModule.Clock([tick1], { start: true });
    var vsync = null;
    var clock2 = null;

    var task1 = new WebModule.Task(3, function(err, buffer, task) {
            clock.stop();
            vsync = new WebModule.Clock([tick2], { start: true, vsync: true, offset: clock.lastTimeStamp });
        });
    var task2 = new WebModule.Task(3, function(err, buffer, task) {
            vsync.stop();
            clock2 = new WebModule.Clock([tick3], { start: true, vsync: false, offset: vsync.lastTimeStamp });
        });
    var task3 = new WebModule.Task(3, function(err, buffer, task) {
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

function testClock_relayClockVsyncPulse(test, pass, miss) {
    var times = [];
    var clock = new WebModule.Clock([tick1], { start: true, pulse: 100 });
    var vsync = null;
    var clock2 = null;

    var task1 = new WebModule.Task(3, function(err, buffer, task) {
            clock.stop();
            vsync = new WebModule.Clock([tick2], { start: true, pulse: 100, vsync: true, offset: clock.lastTimeStamp });
        });
    var task2 = new WebModule.Task(3, function(err, buffer, task) {
            vsync.stop();
            clock2 = new WebModule.Clock([tick3], { start: true, pulse: 100, vsync: false, offset: vsync.lastTimeStamp });
        });
    var task3 = new WebModule.Task(3, function(err, buffer, task) {
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

function testClock_now(test, pass, miss) {
    var clock = new WebModule.Clock();
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
    var clock = new WebModule.Clock([_tick], { start: true, wait: 100, pulse: 20, offset: 0, spike: _spike });

    var clockCounter = 0;

    // 20回試行でテスト終了
    var task = new WebModule.Task(20, function(err, buffer, task) {
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

function testClock_external(test, pass, miss) {
    var slave  = new WebModule.Clock([_tick1]);
    var master = new WebModule.Clock([_tick2]);

    var result1 = slave.master === null; // true

    slave.external(master);

    var result2 = slave.master === master; // true

    if (result1 && result2) {
        test.done(pass());
    } else {
        test.done(miss());
    }

    function _tick1() {}
    function _tick2() {}
}

function testClock_internal(test, pass, miss) {
    var slave  = new WebModule.Clock([_tick1]);
    var master = new WebModule.Clock([_tick2]);

    var result1 = slave.master === null; // true

    slave.external(master);

    var result2 = slave.master === master; // true

    slave.internal();

    var result3 = slave.master === null; // true

    if (result1 && result2 && result3) {
        test.done(pass());
    } else {
        test.done(miss());
    }

    function _tick1() {}
    function _tick2() {}
}

function testClock_switchExternal(test, pass, miss) {
    var slave  = new WebModule.Clock([_tick1], { start: true });
    var master = new WebModule.Clock([_tick2], { start: true });

    var task1 = new WebModule.Task(5, function(err, buffer, task) {
            // スレーブが5回自走したらマスターに切り替える
            currentTask = task2;
            slave.external(master);
        });
    var task2 = new WebModule.Task(5, function(err, buffer, task) {
            // マスターの元でさらに5回tickが呼び出されたら終了
            master.clear();
            master.stop();
            slave.internal();
            slave.clear();
            slave.stop();

            if (err) {
                test.done(miss());
            } else {
                test.done(pass());
            }
        });
    var currentTask = task1;

    function _tick1(timeStamp, deltaTime) { // スレーブ用のtick
        currentTask.pass();
    }
    function _tick2() {}
}

function testClock_switchExternalPulse(test, pass, miss) {
    var times = [];

    var slave  = new WebModule.Clock([_tick1], { start: true, wait: 100, pulse: 20 });
    var master = new WebModule.Clock([_tick2], { start: true, wait: 150, pulse: 30 });

    var task1 = new WebModule.Task(5, function(err, buffer, task) {
            // スレーブが5回自走したらマスターに切り替える
            currentTask = task2;
            slave.external(master);
        });
    var task2 = new WebModule.Task(5, function(err, buffer, task) {
            // マスターの元でさらに5回が呼び出されたら終了
            master.clear();
            master.stop();
            slave.internal();
            slave.clear();
            slave.stop();

            var result1 = times.slice(0, 5).every(function(x) { return x === 20; }); // true
            var result2 = times.slice(5   ).every(function(x) { return x === 30; }); // true

            if (result1 && result2) {
                test.done(pass());
            } else {
                test.done(miss());
            }
        });
    var currentTask = task1;

    function _tick1(timeStamp, deltaTime) { // スレーブ用のtick
        console.log({ time: timeStamp, delta: deltaTime, master: !!slave.master });
        times.push(deltaTime);
        currentTask.pass();
    }
    function _tick2() {}
}

function testClock_switchExternalInternal(test, pass, miss) {
    var slave  = new WebModule.Clock([_tick1], { start: true });
    var master = new WebModule.Clock([_tick2], { start: true });

    var task1 = new WebModule.Task(3, function(err, buffer, task) {
            // スレーブが3回自走したらマスターに切り替える
            currentTask = task2;
            slave.external(master);
        });
    var task2 = new WebModule.Task(3, function(err, buffer, task) {
            // マスターの元でさらに3回呼び出されたら再びスレーブの自走に切り替える
            currentTask = task3;

            slave.internal();
            slave.start();
        });
    var task3 = new WebModule.Task(3, function(err, buffer, task) {
            // 最後にスレーブが3回自走したら終了
            master.clear();
            master.stop();
            slave.internal();
            slave.clear();
            slave.stop();

            if (err) {
                test.done(miss());
            } else {
                test.done(pass());
            }
        });
    var currentTask = task1;

    function _tick1(timeStamp, deltaTime) { // スレーブ用のtick
        currentTask.pass();
    }
    function _tick2() {}
}

function testClock_switchExternalInternalPulse(test, pass, miss) {
    var times = [];

    var slave  = new WebModule.Clock([_tick1], { start: true, wait: 100, pulse: 20 });
    var master = new WebModule.Clock([_tick2], { start: true, wait: 150, pulse: 30 });

    var task1 = new WebModule.Task(3, function(err, buffer, task) {
            // スレーブが3回自走したらマスターに切り替える
            currentTask = task2;

            slave.external(master);
        });
    var task2 = new WebModule.Task(3, function(err, buffer, task) {
            // マスターの元でさらに3回呼び出されたら再びスレーブの自走に切り替える
            currentTask = task3;

            slave.internal();
            slave.start();
        });
    var task3 = new WebModule.Task(3, function(err, buffer, task) {
            // 最後にスレーブが3回自走したら終了
            master.clear();
            master.stop();
            slave.internal();
            slave.clear();
            slave.stop();

            var result1 = times.slice(0, 3).every(function(x) { return x === 20; }); // true
            var result2 = times.slice(3, 6).every(function(x) { return x === 30; }); // true
            var result3 = times.slice(6, 9).every(function(x) { return x === 20; }); // true

            if (result1 && result2 && result3) {
                test.done(pass());
            } else {
                test.done(miss());
            }
        });
    var currentTask = task1;

    function _tick1(timeStamp, deltaTime) { // スレーブ用のtick
        console.log({ time: timeStamp, delta: deltaTime, master: !!slave.master });
        times.push(deltaTime);
        currentTask.pass();
    }
    function _tick2() {}
}

function testClock_vsyncSwitchExternal(test, pass, miss) {
    var slave  = new WebModule.Clock([_tick1], { start: true });
    var master = new WebModule.Clock([_tick2], { start: true, vsync: true });

    var task1 = new WebModule.Task(5, function(err, buffer, task) {
            // スレーブが5回自走したらマスターに切り替える
            currentTask = task2;
            slave.external(master);
        });
    var task2 = new WebModule.Task(5, function(err, buffer, task) {
            // マスターの元でさらに5回が呼び出されたら終了
            master.clear();
            master.stop();
            slave.internal();
            slave.clear();
            slave.stop();

            if (err) {
                test.done(miss());
            } else {
                test.done(pass());
            }
        });
    var currentTask = task1;

    function _tick1(timeStamp, deltaTime) { // スレーブ用のtick
        currentTask.pass();
    }
    function _tick2() {}
}

function testClock_vsyncSwitchExternalPulse(test, pass, miss) {
    var slaveTimes  = [];
    var masterTimes = [];

    var slave  = new WebModule.Clock([_tick1], { start: true, pulse: 20, wait: 100  });
    var master = null;

    var task1 = new WebModule.Task(5, function(err, buffer, task) {
            // スレーブが5回自走したらマスターに切り替える
            currentTask = task2;

            master = new WebModule.Clock([_tick2], { vsync: true });
            slave.external(master);
            master.start();
        });
    var task2 = new WebModule.Task(5, function(err, buffer, task) {
            // マスターの元でさらに5回が呼び出されたら終了
            master.clear();
            master.stop();
            slave.internal();
            slave.clear();
            slave.stop();

            var result1 = slaveTimes.slice(0, 5).every(function(x) { return x === 20; }); // true
            var result2 = slaveTimes.slice(5).every(function(x, i) { return x === masterTimes[i]; }); // true

            if (result1 && result2) {
                test.done(pass());
            } else {
                test.done(miss());
            }
        });
    var currentTask = task1;

    function _tick1(timeStamp, deltaTime) { // スレーブ用のtick
        console.log({ time: timeStamp, delta: deltaTime, master: !!slave.master });
        slaveTimes.push(deltaTime);
        currentTask.pass();
    }
    function _tick2(timeStamp, deltaTime) { masterTimes.push(deltaTime); }
}

function testClock_vsyncSwitchExternalInternal(test, pass, miss) {
    var slave  = new WebModule.Clock([_tick1], { start: true });
    var master = new WebModule.Clock([_tick2], { start: true, vsync: true });

    var task1 = new WebModule.Task(3, function(err, buffer, task) {
            // スレーブが3回自走したらマスターに切り替える
            currentTask = task2;
            slave.external(master);
        });
    var task2 = new WebModule.Task(3, function(err, buffer, task) {
            // マスターの元でさらに3回呼び出されたら再びスレーブの自走に切り替える
            currentTask = task3;

            slave.internal();
            slave.start();
        });
    var task3 = new WebModule.Task(3, function(err, buffer, task) {
            // 最後にスレーブが3回自走したら終了
            master.clear();
            master.stop();
            slave.internal();
            slave.clear();
            slave.stop();

            if (err) {
                test.done(miss());
            } else {
                test.done(pass());
            }
        });
    var currentTask = task1;

    function _tick1(timeStamp, deltaTime) { // スレーブ用のtick
        currentTask.pass();
    }
    function _tick2() {}
}

function testClock_vsyncSwitchExternalInternalPulse(test, pass, miss) {
    var slaveTimes  = [];
    var masterTimes = [];

    var slave  = new WebModule.Clock([_tick1], { start: true, wait: 100, pulse: 20 });
    var master = null;

    var task1 = new WebModule.Task(5, function(err, buffer, task) {
            // スレーブが5回自走したらマスターに切り替える
            currentTask = task2;

            // マスターはvsyncオプションで起動しtimeStampを順に記録していく
            master = new WebModule.Clock([_tick2], { vsync: true });
            slave.external(master);
            master.start();
        });
    var task2 = new WebModule.Task(10, function(err, buffer, task) {
            // マスターのもとでさらに10回呼び出されたら再びスレーブの自走に切り替える
            currentTask = task3;

            slave.internal();
            slave.start();
        });
    var task3 = new WebModule.Task(5, function(err, buffer, task) {
            // 最後にスレーブが5回自走したら終了
            master.clear();
            master.stop();
            slave.internal();
            slave.clear();
            slave.stop();

            var result1 = slaveTimes.slice(0,   5).every(function(x)    { return x === 20; }); // true
            var result2 = slaveTimes.slice(5,  15).every(function(x, i) { return x === masterTimes[i]; }); // true
            var result3 = slaveTimes.slice(15, 20).every(function(x)    { return x === 20; }); // true

            if (result1 && result2 && result3) {
                test.done(pass());
            } else {
                test.done(miss());
            }
        });
    var currentTask = task1;

    function _tick1(timeStamp, deltaTime) { // スレーブ用のtick
        console.log({ time: timeStamp, delta: deltaTime, master: !!slave.master });
        slaveTimes.push(deltaTime);
        currentTask.pass();
    }
    function _tick2(timeStamp, deltaTime) { masterTimes.push(deltaTime); } // マスター用のtick
}

function testClock_transform(test, pass, miss) {
    var task = new WebModule.Task(10, function(err, buffer, task) {
            clock.clear();
            clock.stop();

            var result = record1.every(function(data, i) {
                console.log(data);
                // tick1とtick2の引数が同一オブジェクトか
                // インデックスが正しいか
                return data === record2[i] && data.cnt === i;
            })

            if (result) {
                test.done(pass());
            } else {
                test.done(miss());
            }
        });
    var record1 = [];
    var record2 = [];
    var count   = 0;

    var clock   = new WebModule.Clock([tick1, tick2], { start: true, transform: _transform });

    function tick1(data) {
        record1.push(data); // 引数を記録
    }
    function tick2(data) {
        record2.push(data); // 引数を記録
        task.pass();
    }

    function _transform(timeStamp, deltaTime) {
        // timeStampとdeltaTimeをオブジェクトに変換する
        // tickは変換されたオブジェクトを受け取る
        return { ts: timeStamp, delta: deltaTime, cnt: count++ };
    };

}

function testClock_transformSwitchExternal(test, pass, miss) {
    var task = new WebModule.Task(2, function(err, buffer, task) {
            clock2.clear();
            clock2.stop();
            clock1.internal();
            clock1.clear();
            clock1.stop();

            // マスターからdeltaTimeを受け取りつつ
            // 自身のtransform関数を使用しているかをチェック
            var result1 = record1.slice(0, 5).every(function(data) {
                return data === '20ms';
            });
            var result2 = record1.slice(5   ).every(function(data) {
                return data === '30ms';
            });
            var result3 = record2.slice(0, 5).every(function(data) {
                return data === '20 milli secounds';
            });
            var result4 = record2.slice(5   ).every(function(data) {
                return data === '30 milli secounds';
            });

            if (result1 && result2 && result3 && result4) {
                test.done(pass());
            } else {
                test.done(miss());
            }
        });

    // 二つのクロックに別のtransform関数を指定
    var clock1   = new WebModule.Clock([_tick1], { wait: 100, pulse: 20, transform: transform1 });
    var clock2   = new WebModule.Clock([_tick2], { wait: 100, pulse: 30, transform: transform2 });
    var record1  = [];
    var record2  = [];
    var counter1 = 0;
    var counter2 = 0;

    // clock2をclock1に追従させてスタート
    clock2.external(clock1);
    clock1.start();

    function _tick1(transformed, _) {
        counter1++;
        console.log (transformed, counter1);
        record1.push(transformed);

        if (counter1 === 10) {
            task.pass();
        }
    }
    function _tick2(transformed, _) {
        counter2++;
        console.log (transformed, counter2);
        record2.push(transformed);

        if (counter2 === 5) {
            // clock1の元で5回呼び出されたら主従関係を入れ替える
            // ここではまだclock1をスレーブにせずclock2を自走させるに留める
            // ※この関数を抜けたのちclock2はスレーブの有無を確かめに行くため
            clock1.stop();
            clock2.internal();
            clock2.start();
        }
        if (counter2 === 6) {
            // clock2の最初の自走呼び出しでclock1をスレーブにする
            clock1.external(clock2);
        }
        if (counter2 === 10) {
            task.pass();
        }
    }
    function transform1(timeStamp, deltaTime) {
        return deltaTime+ 'ms';
    }
    function transform2(timeStamp, deltaTime) {
        return deltaTime+ ' milli secounds';
    }

}

function testClock_transformVsyncSwitchExternal(test, pass, miss) {
    var task = new WebModule.Task(2, function(err, buffer, task) {
            clock2.clear();
            clock2.stop();
            clock1.internal();
            clock1.clear();
            clock1.stop();

            // マスターからdeltaTimeを受け取りつつ
            // 自身のtransform関数を使用しているかをチェック
            var result1 = record1.slice(0, 5).every(function(data) {
                return data === '20ms';
            });
            var result2 = record1.slice(5   ).every(function(data) {
                return data === '30ms';
            });
            var result3 = record2.slice(0, 5).every(function(data) {
                return data === '20 milli secounds';
            });
            var result4 = record2.slice(5   ).every(function(data) {
                return data === '30 milli secounds';
            });

            if (result1 && result2 && result3 && result4) {
                test.done(pass());
            } else {
                test.done(miss());
            }
        });

    // 二つのクロックに別のtransform関数を指定
    var clock1   = new WebModule.Clock([_tick1], { vsync: true, pulse: 20, transform: transform1 });
    var clock2   = new WebModule.Clock([_tick2], { vsync: true, pulse: 30, transform: transform2 });
    var record1  = [];
    var record2  = [];
    var counter1 = 0;
    var counter2 = 0;

    // clock2をclock1に追従させてスタート
    clock2.external(clock1);
    clock1.start();

    function _tick1(transformed, _) {
        counter1++;
        console.log (transformed, counter1);
        record1.push(transformed);

        if (counter1 === 10) {
            task.pass();
        }
    }
    function _tick2(transformed, _) {
        counter2++;
        console.log (transformed, counter2);
        record2.push(transformed);

        if (counter2 === 5) {
            // clock1の元で5回呼び出されたら主従関係を入れ替える
            // ここではまだclock1をスレーブにせずclock2を自走させるに留める
            // ※この関数を抜けたのちclock2はスレーブの有無を確かめに行くため
            clock1.stop();
            clock2.internal();
            clock2.start();
        }
        if (counter2 === 6) {
            // clock2の最初の自走呼び出しでclock1をスレーブにする
            clock1.external(clock2);
        }
        if (counter2 === 10) {
            task.pass();
        }
    }
    function transform1(timeStamp, deltaTime) {
        return deltaTime+ 'ms';
    }
    function transform2(timeStamp, deltaTime) {
        return deltaTime+ ' milli secounds';
    }
}


return test.run();

})(GLOBAL);
