# Clock.js [![Build Status](https://travis-ci.org/uupaa/Clock.js.png)](http://travis-ci.org/uupaa/Clock.js)

[![npm](https://nodei.co/npm/uupaa.wmclock.js.png?downloads=true&stars=true)](https://nodei.co/npm/uupaa.wmclock.js/)

Master/Base Clock, Virtual timer.

## Document

- [Clock.js wiki](https://github.com/uupaa/Clock.js/wiki/Clock)
- [WebModule](https://github.com/uupaa/WebModule)
    - [Slide](http://uupaa.github.io/Slide/slide/WebModule/index.html)
    - [Development](https://github.com/uupaa/WebModule/wiki/Development)

## How to use

### Browser

```js
<script src="lib/Clock.js"></script>
<script>
var clock = new Clock([_tick], { vsync: true, start: true });

function _tick(timeStamp, deltaTime, count) {
    console.log("tick:", timeStamp, deltaTime, count);
    if (count === 9) {
        clock.off(_tick);

        clock.nth(function(timeStamp, deltaTime, count) {
            console.log("nth:", timeStamp, deltaTime, count);
            if (count === 9) {
                clock.stop();
                if (!clock.isActive()) {
                    console.log("finished");
                } else {
                    console.log("error");
                }
            }
        }, 10);
    }
}
</script>
```

### WebWorkers

```js
importScripts("lib/Clock.js");
```

### Node.js

```js
require("lib/Clock.js");
```

### node-webkit

```js
<script src="lib/Clock.js"></script>
require("lib/Clock.js");
```
